import * as database from "./database.js";

export async function grab() {
    try {
        return await database.all(`
            SELECT * FROM posts;
        `);
    } catch(err) {
        console.error(err);
        return [];
    }
}

export async function upload(src, uploader) {
    try {
        await database.run(`
            INSERT INTO posts (src, uploader, date)
        `, [src, uploader, Date.now()]);
    } catch(err) {
        console.error(err);
    }
}