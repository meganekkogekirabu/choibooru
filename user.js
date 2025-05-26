// FIXME: needs i18n

import * as database from "./database.js";
import bcrypt from "bcryptjs";

export async function create_user(username, password) {
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
            status   : 400,
        }
    }
    
    return {
        response : "Creation succeeded! This tab should now automatically refresh.",
        status   : 201,
    };
}

export async function sign_in(username, password) {
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