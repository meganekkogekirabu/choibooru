import * as database from "./database.ts";

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

export async function upload(src: string, uploader: string) {
    try {
        await database.run(`
            INSERT INTO posts (src, uploader, date)
        `, [src, uploader, Date.now()]);
    } catch(err) {
        console.error(err);
    }
}