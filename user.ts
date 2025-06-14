// FIXME: needs i18n

import * as database from "./database.ts";
import bcrypt from "bcryptjs";

export async function create_user(username: string, password: string) {
    if (username.length > 20 || password.length > 20) {
        return {
            response : "Username or password is too long.",
            status   : 400,
        };
    }
    
    const hash = bcrypt.hashSync(password, 10);

    try { 
        await database.run(`
            INSERT INTO users (username, password)
            VALUES (?, ?);
        `, [username, hash]);
    } catch (e) {
        console.error(e);
        return {
            response : "Please pick a different username; the one you have chosen already exists.",
            status   : 409,
        }
    }
    
    return {
        response : "Creation succeeded! This tab should now automatically refresh.",
        status   : 201,
    };
}

export async function sign_in(username: string, password: string) {
    const row = await database.get(`
        SELECT * FROM users WHERE username = ?;
    `, [username]);

    if (!row || row?.deleted === 1) {
        return {
            response : "Incorrect username or password.",
            status   : 403,
        };
    }

    const hash = row.password;
    const id = row.id;

    if (await bcrypt.compare(password, hash)) {
        const is_admin = row.user_groups?.includes("admin") || false;
        const is_full = row.user_groups?.includes("full") || is_admin;

        var response = "Authorisation succeeded! This tab should now automatically refresh."

        if (is_admin) {
            response = response + "\nYou are logged in as an admin.";
        }

        return {
            response : response,
            username : username,
            is_admin : is_admin,
            user_id  : id,
            is_full  : is_full,
            status   : 200,
        };
    } else {
        return {
            response : "Incorrect username or password.",
            status   : 403,
        };
    }
}

export async function new_api_key(user_id: bigint) {
    if (!user_id) {
        return {
            response : "new_api_key did not receive user ID",
            status   : 400,
        }
    }

    const key = (Math.random() + 1).toString(36).substring(2);

    try {
        await database.run(`
            UPDATE users SET key = ? WHERE id = ?;
        `, [key, user_id]);

        return {
            response : "Successfully updated API key.",
            key      : key,
            status   : 200,
        }
    } catch(err) {
        return {
            response : "An internal server error occurred.",
            status   : 500,
        }
    }
}