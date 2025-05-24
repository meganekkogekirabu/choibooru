import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import * as user from "./user.js";
import * as posts from "./posts.js";
import * as database from "./database.js";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import sharp from "sharp";
import multer from "multer";
import { unlink } from "node:fs";

const port = process.argv[3] ?? 3000;
const hostname = process.argv[2] ?? "127.0.0.1";

const app = express();

const upload = multer({
    storage : multer.memoryStorage(),
    limits  : {
      fileSize : 5 * 1024 * 1024, // 5MB
      files    : 1
    },
    fileFilter : (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type."), false);
        }
    }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret            : process.env.SESSION_KEY,
    resave            : false,
    saveUninitialized : false,
    cookie            : { secure: false },
    genid             : () => {
        return uuidv4();
    },
}));

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (_, res) => {
    res.sendFile(join(__dirname, "public", "index.html"));
});

app.get(["/post", "/post.html"], async (req, res) => {
    await database.get(`
        SELECT rating FROM posts WHERE id = ?;
    `, [req.query.id])

    .then(data => {
        if (data.rating === "explicit" && (!req.session.is_full || !req.session.username)) {
            res.redirect("/");
        } else {
            res.sendFile(join(__dirname, "public", "post.html"));
        }
    });
});

app.get("/assets/posts/:filename", async (req, res) => {
    await database.get(`
        SELECT rating FROM posts WHERE src = ?;
    `, [req.path.replace(/^\//, "")])

    .then(data => {
        if (data.rating === "explicit" && (!req.session.is_full || !req.session.username)) {
            res.redirect("/");
        } else {
            res.sendFile(join(__dirname, "public", req.path));
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
        res.json({
            status : 500,
            error  : "Failed to create user.",
        });
    }
});

app.post("/api/signin", async (req, res) => {
    try {
        const ret = await user.sign_in(req.body.username, req.body.password);

        Object.assign(req.session, {
            username: ret.username,
            is_admin: ret.is_admin,
            user_id: ret.user_id,
            is_full: ret.is_full,
        });

        res.json({
            status   : ret.status,
            response : ret.response,
        });
    } catch (e) {
        console.error("Failed to authenticate user:", e);
        res.json({
            status : 500,
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
    req.session.destroy();
    res.sendStatus(200);
});

app.get("/api/posts", async (req, res) => {
    const ret = [];
    for (const post of (await posts.grab())) {
        if ((post.rating === "explicit" || post.deleted === 1) && (!req.session.is_full || !req.session.username)) {
            continue;
        } else {
            ret.push(post);
        }
    }
    res.json(ret);
});

app.post("/api/upload", upload.single("post"), async (req, res) => {
    if (!req.session.username) {
        return res.status(403).send("Not authorised.");
    }

    if (!req.file) {
        return res.status(400).send("An image must be provided.");
    }

    try {
        const date = Date.now();
        const src = join("assets", "posts", date + ".webp");

        await sharp(req.file.buffer)
            .webp({ quality: 100 })
            .toFile(join(__dirname, "public", src));
        
        await database.run(`
            INSERT INTO posts (src, uploader, date) VALUES (?, ?, ?);
        `, [src, req.session.username, date]);

        res.status(200).send("Successfully uploaded.");
    } catch(err) {
        res.status(500).send("An internal server error occurred.");
    }
});

app.get("/api/src", async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).send("?id= is required.");
    }

    try {
        res.json(await database.get(`
            SELECT * FROM posts WHERE id = ?;
        `, [id]));
    } catch(err) {
        console.error(err);
        res.status(500).send("An internal server error occurred.");
    }
});

app.post("/api/vote", async (req, res) => {
    const _row = await database.get(`SELECT voters FROM posts WHERE id = ?;`, [req.body.id]);
    const voters = _row.voters;

    if (!req.session.username || (voters?.includes("," + req.session.username + ",") ?? false)) {
        return res.status(403).send("Not authorised.");

    } else if (Math.abs(req.body.dir) !== 1) {
        return res.status(400).send("Invalid request.");
    }

    try {
        await database.run(`
            UPDATE posts SET voters = CONCAT(voters, ",", ?, ",") WHERE id = ?;
        `, [req.session.username, req.body.id]);
        
        await database.run(`
            UPDATE posts SET score = score + ? WHERE id = ?;
        `, [req.body.dir, req.body.id]);

        res.status(200).send("Successfully voted.");
    } catch(err) {
        console.error(err);
        res.status(500).send("An internal server error occurred.");
    }
});

app.post("/api/tag/add", async (req, res) => {
    if (!req.session.username) {
        return res.status(403).send("Not authorised.");
    }

    try {
        const _row = await database.get(`SELECT tags FROM posts WHERE id = ?;`, [req.body.id]);
        const tags = _row.tags;
        if (!tags?.includes("," + req.body.tag + ",")) {
            await database.run(`
                UPDATE posts SET tags = CONCAT(tags, ",", ?, ",") WHERE id = ?;
            `, [req.body.tag, req.body.id]);

            res.status(200).send("Tagging successful.");
        } else {
            res.status(400).send("The specified tag is already applied to this post.");
        }
    } catch(err) {
        console.error(err);
        res.status(500).send("An internal server error occurred.");
    }
});

app.post("/api/tag/remove", async (req, res) => {
    if (!req.session.username) {
        return res.status(403).send("Not authorised.");
    }

    try {
        await database.run(`
            UPDATE posts SET tags = REPLACE(tags, CONCAT(",", ?, ","), "") WHERE id = ?;
        `, [req.body.tag, req.body.id]);

        res.status(200).send("Tagging successful.");
    } catch(err) {
        console.error(err);
        res.status(500).send("An internal server error occurred.");
    }
});

app.post("/api/rate", async (req, res) => {
    if (!req.session.username) {
        return res.status(403).send("Not authorised.");
    } else if (!req.body.rating || !req.body.id) {
        return res.status(400).send("Bad request.");
    }

    try {
        await database.run(`
            UPDATE posts SET rating = ? WHERE id = ?;
        `, [req.body.rating, req.body.id]);

        res.status(200).send("Tagging successful.");
    } catch(err) {
        console.error(err);
        res.status(500).send("An internal server error occurred.");
    }
});

app.post("/api/search", async (req, res) => {
    try {
        const { tag } = req.body;

        if (!tag || typeof tag !== "string") {
            return res.status(400).send("Bad request.");
        }

        const ret = [];
        const posts = await database.all(`
            SELECT * FROM posts WHERE tags LIKE ?
        `, [`%,${tag},%`])

        for (const post of posts) {
            if (post.rating === "explicit" && (!req.session.is_full || !req.session.username)) {
                continue;
            } else {
                ret.push(post);
            }
        }
        
        res.json(ret);

    } catch(err) {
        console.error(err);
        res.status(500).send("An internal server error occurred.");
    }
})

app.get(/^\/([^\.]+)(\..+)?/, (req, res) => {
    res.sendFile(join(__dirname, "public", req.params[0] + (req.params[1] || ".html")), (err) => {
        if (err) {
            res.status(404).sendFile(join(__dirname, "public", "not_found.html"));
        }
    });
});

app.post("/api/delete", async (req, res) => {
    try {
        if (!req.session.is_admin) {
            return res.status(403).send("Not authorised.");
        } else if (!req.body.id) {
            return res.status(400).send("Bad request.");
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
                return res.status(500).send("An internal server error occurred.");
            }
        });

        res.status(200).send("Successfully deleted.");
    } catch(err) {
        console.error(err);
        res.status(500).send("An internal server error occurred.");
    }
});

app.listen(port, hostname, () => {
    console.log(`server running at http://${hostname}:${port}`);
});