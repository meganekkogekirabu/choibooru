import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as user from "./user.ts";
import * as posts from "./posts.ts";
import * as database from "./database.ts";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import sharp from "sharp";
import multer from "multer";
import { unlink, readFileSync } from "node:fs";
import { createRequire } from "module";
import http from "node:http";
import https from "node:https";
import morgan from "morgan";

const require = createRequire(import.meta.url); // for loading i18n json

const http_port = process.env.HTTP_PORT;
const https_port = process.env.HTTPS_PORT;
const hostname = process.env.HTTP_HOSTNAME;

const app = express();

const upload = multer({
    storage : multer.memoryStorage(),
    limits  : {
      files    : 1
    },
    fileFilter : (_, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type."));
        }
    }
});

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.argv.includes("--verbose")) {
    app.use(morgan("combined"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret            : process.env.SESSION_KEY as string,
    resave            : false,
    saveUninitialized : false,
    cookie            : { secure: false },
    genid             : () => uuidv4(),
}));

// redirect http to https
app.use((req, res, next) => {
    if (process.env.ENVIRONMENT === "prod" && !req.secure) {
        return res.redirect("https://" + req.headers.host + req.url);
    }

    next();
})

const locales: Record<string, boolean> = {
    "en"      : true,
    "en-US"   : true,
    "es"      : true,
    "zh"      : true,
    "zh-hans" : true,
    "zh-hant" : true,
}

// middleware for setting locale
app.use((req, _, next) => {
    const lang =
    req.host.split(".")[0] ??
    req.headers["accept-language"];

    req.session.lang = locales[lang] ? lang : "en";

    next();
});

app.get("/", (_, res) => {
    res.sendFile(join(__dirname, "public", "index.html"));
});

app.get(["/post", "/post.html"], async (req, res) => {
    await database.get(`
        SELECT rating, deleted FROM posts WHERE id = ?;
    `, [req.query.id])

    .then(data => {
        if ((data.rating === "explicit" || data.deleted === 1) && (!req.session.is_full || !req.session.username)) {
            res.redirect("/");
        } else {
            res.sendFile(join(__dirname, "public", "post.html"));
        }
    });
});

app.get("/assets/posts/:filename", async (req, res) => {
    await database.get(`
        SELECT rating, deleted FROM posts WHERE src = ?;
    `, [req.path.replace(/^\//, "")])

    .then(data => {
        if ((data.rating === "explicit" || data.deleted === 1) && (!req.session.is_full || !req.session.username)) {
            res.redirect("/");
        } else {
            res.sendFile(join(__dirname, "public", req.path), (err) => {
                if (err) {
                    res.status(404).sendFile(join(__dirname, "public", "assets", "posts", "deleted.png"));
                }
            });
        }
    });
})

app.post("/api/signup", async (req, res) => {
    try {
        const ret = await user.create_user(req.body.username, req.body.password);
        res.json({
            status   : ret.status,
            response : ret.response,
        });
    } catch(e) {
        console.error("Failed to create user:", e);
        res.status(500).json({
            error  : "Failed to create user.",
        });
    }
});

app.post("/api/signin", async (req, res) => {
    try {
        const ret = await user.sign_in(req.body.username, req.body.password);

        if (ret.status === 200) {
            Object.assign(req.session, {
                username : ret.username,
                is_admin : ret.is_admin,
                user_id  : ret.user_id,
                is_full  : ret.is_full,
            });
        }

        res.json({
            status   : ret.status,
            response : ret.response,
        });
    } catch (e) {
        console.error("Failed to authenticate user:", e);
        res.status(500).json({
            error  : "Failed to authenticate user.",
        });
    }
});

app.post("/api/auth", (req, res) => {
    res.json({
        status   : 200,
        username : req.session.username,
        is_admin : req.session.is_admin,
        user_id  : req.session.user_id,
        is_full  : req.session.is_full,
    });
});

app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
        console.error(err);
    });
    res.sendStatus(200);
});

app.get("/api/posts", (async (req, res) => {
    const all_posts = await posts.grab();
    const filtered_posts = [];
    
    for (const post of all_posts) {
        if ((post.rating === "explicit" || post.deleted === 1) && (!req.session.is_full || !req.session.username)) {
            continue;
        } else {
            filtered_posts.push(post);
        }
    }

    if (req.query.total === "true") {
        return res.json({total: filtered_posts.length});
    }

    const offset = typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : 0;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 10;

    const paginated_posts = filtered_posts.reverse().slice(offset, offset + limit);
    res.json(paginated_posts);
}) as express.RequestHandler);

app.post("/api/upload", upload.single("post"), (async (req, res) => {
    if (!req.session.username) {
        return res.status(403).json({
            error  : "Not authorised.",
        });
    } else if (!req.file) {
        return res.status(400).json({
            error  : "Bad request.",
        });
    }

    try {
        const date = Date.now();
        const src = join("assets", "posts", date + ".webp");

        await sharp(req.file.buffer)
            .webp({
                quality      : 70,
                nearLossless : true,
                effort       : 5,
            })
            .toFile(join(__dirname, "public", src));
        
        await database.run(`
            INSERT INTO posts (src, uploader, date) VALUES (?, ?, ?);
        `, [src, req.session.username, date]);

        res.sendStatus(200);
    } catch(err) {
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
}) as express.RequestHandler);

app.get("/api/src", async (req, res) => {
    const { id } = req.query;

    if (!id) {
        res.status(400).json({
            error  : "Bad request.",
        });
    }

    try {
        res.json(await database.get(`
            SELECT * FROM posts WHERE id = ?;
        `, [id]));
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
});

app.post("/api/vote", (async (req, res) => {
    const _row = await database.get(`SELECT voters FROM posts WHERE id = ?;`, [req.body.id]);
    const voters = _row.voters;

    if (!req.session.username || (voters?.includes("," + req.session.username + ",") ?? false)) {
        return res.status(403).json({
            error  : "Not authorised.",
        });
    } else if (Math.abs(req.body.dir) !== 1) {
        return res.status(400).json({
            error  : "Bad request.",
        });
    }

    try {
        await database.run(`
            UPDATE posts SET voters = CONCAT(voters, ",", ?, ",") WHERE id = ?;
        `, [req.session.username, req.body.id]);
        
        await database.run(`
            UPDATE posts SET score = score + ? WHERE id = ?;
        `, [req.body.dir, req.body.id]);

        res.sendStatus(200);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
}) as express.RequestHandler);

app.post("/api/tag/add", async (req, res) => {
    const { tag, id } = req.body;

    if (!req.session.username) {
        res.status(403).json({
            error  : "Not authorised.",
        });
    } else if (!tag || !id) {
        res.status(400).json({
            error  : "Bad request.",
        });
    }

    try {
        const _row = await database.get(`SELECT tags FROM posts WHERE id = ?;`, [req.body.id]);
        const tags = _row.tags;
        if (!tags?.includes("," + req.body.tag + ",")) {
            await database.run(`
                UPDATE posts SET tags = CONCAT(tags, ",", ?, ",") WHERE id = ?;
            `, [req.body.tag, req.body.id]);

            res.sendStatus(200);
        } else {
            res.status(400).json({
                error  : "The specified tag is already applied to this post.",
            });
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
});

app.post("/api/tag/remove", async (req, res) => {
    const { tag, id } = req.body;

    if (!req.session.username) {
        res.status(403).json({
            error  : "Not authorised.",
        });
    } else if (!tag || !id) {
        res.status(400).json({
            error  : "Bad request.",
        });
    }

    try {
        await database.run(`
            UPDATE posts SET tags = REPLACE(tags, CONCAT(",", ?, ","), "") WHERE id = ?;
        `, [tag, id]);

        res.sendStatus(200);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
});

app.post("/api/rate", (async (req, res) => {
    if (!req.session.username) {
        return res.status(403).json({
            error  : "Not authorised.",
        });
    } else if (!req.body.rating || !req.body.id) {
        return res.status(400).json({
            error  : "Bad request.",
        });
    }

    try {
        await database.run(`
            UPDATE posts SET rating = ? WHERE id = ?;
        `, [req.body.rating, req.body.id]);

        res.status(200).send("Tagging successful.");
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
}) as express.RequestHandler);

app.post("/api/search", (async (req, res) => {
    try {
        const { query, offset, limit, total } = req.body;

        if (!query || typeof query !== "object") {
            return res.status(400).json({
                error  : "Bad request.",
            });
        }

        const all_posts = await posts.grab();
        let filtered_posts = [];

        for (const post of all_posts) {
            let matches = true;

            // AND (&)
            if (query.and && query.and.length > 0) {
                for (const tag of query.and) {
                    if (!post.tags?.includes(`,${tag},`)) {
                        matches = false;
                        break;
                    }
                }
            }

            // OR (|)
            if (matches && query.or && query.or.length > 0) {
                matches = false;
                for (const tag of query.or) {
                    if (post.tags?.includes(`,${tag},`)) {
                        matches = true;
                        break;
                    }
                }
            }

            // NOT (!)
            if (matches && query.not && query.not.length > 0) {
                for (const tag of query.not) {
                    if (post.tags?.includes(`,${tag},`)) {
                        matches = false;
                        break;
                    }
                }
            }
            
            if (matches && (post.rating === "explicit" || post.deleted === 1) && (!req.session.is_full || !req.session.username)) {
                matches = false;
            }

            if (matches) {
                filtered_posts.push(post);
            }
        }

        if (total) {
            return res.json({ total: filtered_posts.length, tag: query });
        }

        const page_offset = parseInt(offset) || 0;
        const page_limit = parseInt(limit) || 10;
        const paginated_posts = filtered_posts.reverse().slice(page_offset, page_offset + page_limit);
        
        res.json(paginated_posts);

    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
}) as express.RequestHandler);

app.post("/api/delete", (async (req, res) => {
    try {
        if (!req.session.is_admin) {
            return res.status(403).json({
                error  : "Not authorised.",
            });
        } else if (!req.body.id) {
            return res.status(400).json({
                error  : "Bad request.",
            });
        }

        const _row = await database.get(`
            SELECT src FROM posts WHERE id = ?
        `, [req.body.id]);
        
        const src = _row.src;

        await database.run(`
            UPDATE posts SET deleted = 1 WHERE id = ?
        `, [req.body.id]);

        unlink(join(__dirname, "public", src), (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    error  : "An internal server error occurred.",
                });
            }
        });

        res.sendStatus(200);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
}) as express.RequestHandler);

app.get("/api/translations", (req, res) => {
    const { lang } = req.query;
    const translations = require(`./i18n/${lang}.json`);
    res.json(translations);
});

app.get("/api/lang", (req, res) => {
    try {
        res.status(200).json({
            lang   : req.session.lang,
        });
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
});

app.get("/favicon.ico", (_, res) => {
    res.sendFile(join(__dirname, "public", "assets", "favicon.ico"))
});

app.post("/api/source", (async (req, res) => {
    const { id, source } = req.body;

    // https://regexr.com/39nr7
    const valid_url = source.match(/^[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)$/mi);

    if (!req.session.username) {
        return res.status(403).json({
            error  : "Not authorised.",
        });
    } else if (!id || !source || !valid_url) {
        return res.status(400).json({
            error  : "Bad request.",
        });
    }

    try {
        await database.run(`
            UPDATE posts SET source = ? WHERE id = ?;
        `, [source, id]);

        res.sendStatus(200);
    } catch(err) {
        console.error(err);
        res.status(500).json({
            error  : "An internal server error occurred.",
        });
    }
}) as express.RequestHandler);

app.post("/api/new-key", (async (req, res) => {
    const username = req.body.username ?? req.session.username;

    if (!username) {
        return res.status(400).json({
            error : "Bad request.",
        });
    }

    try {
        const ret = await user.new_api_key(username);
        res.json({
            response : ret.response,
            key      : ret.key,
            status   : ret.status,
        });
    } catch(err) {
        res.status(500).json({
            error : "An internal server error occurred.",
        });
    }
}) as express.RequestHandler);

app.use(express.static("public"));

app.use((_, res) => {
  res.status(404).sendFile(join(__dirname, 'public', 'not_found.html'));
});

const options = {
  key  : readFileSync('./keys/private-key.pem'),
  cert : readFileSync('./keys/certificate.pem'),
};

https.createServer(options, app).listen({
    port     : https_port,
    hostname : hostname,
}, () => {
    console.log(`HTTPS server running at https://${hostname}:${https_port}`);
});

// redirect HTTP to HTTPS in production
if (process.env.ENVIRONMENT === "prod") {
    const httpApp = express();

    httpApp.use(((req, res, next) => {
        if (!req.secure && typeof http_port === "string" && typeof https_port === "string") {
            const host = req.headers.host || `${hostname}:${http_port}`;
            const redirectUrl = new URL(req.url, `https://${host.replace(http_port, https_port)}`);
            return res.redirect(301, redirectUrl.toString());
        }
        next();
    }) as express.RequestHandler);

    http.createServer(httpApp).listen({
        port     : http_port,
        hostname : hostname,
    }, () => {
        console.log(`HTTP redirect server running at http://${hostname}:${http_port}`);
    });
} else {
    http.createServer(app).listen({
        port     : http_port,
        hostname : hostname,
    }, () => {
        console.log(`HTTP server running at http://${hostname}:${http_port}`);
    });
}