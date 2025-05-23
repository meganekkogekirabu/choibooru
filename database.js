import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function run(sql, params = []) {
    const db = await open({
        filename : join(__dirname, "booru.db"),
        driver   : sqlite3.Database,
    });
    
    const result = await db.run(sql, params);
    await db.close();
    return result;
};

export async function get(sql, params = []) {
    const db = await open({
        filename : join(__dirname, "booru.db"),
        driver   : sqlite3.Database,
    });

    const result = await db.get(sql, params);
    await db.close();
    return result;
};

export async function all(sql, params = []) {
    const db = await open({
        filename : join(__dirname, "booru.db"),
        driver   : sqlite3.Database,
    });

    const result = await db.all(sql, params);
    await db.close();
    return result;
}