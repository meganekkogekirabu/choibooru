import "express-session";

declare module "express-session" {
    interface SessionData {
        lang?     : string,
        username? : string,
        is_admin? : boolean,
        is_full?  : boolean,
        user_id?  : number,
    }
}

declare module "./user.ts" {
    export interface BasicResponse {
        status   : number;
        response?: string;
        error?   : string;
    }

    export interface CreateUserResponse extends BasicResponse {}

    export interface SignInSuccessResponse extends BasicResponse {
        username : string;
        is_admin : boolean;
        user_id  : number;
        is_full  : boolean;
    }

    export interface SignInFailureResponse extends BasicResponse {
        username? : string;
        is_admin? : boolean;
        user_id?  : number;
        is_full?  : boolean;
    }

    export type SignInResponse = SignInSuccessResponse | SignInFailureResponse;

    export interface NewApiKeyResponse extends BasicResponse {
        key? : string;
    }

    export function create_user(username: string, password: string): Promise<CreateUserResponse>;

    export function sign_in(username: string, password: string): Promise<SignInResponse>;

    export function new_api_key(user_id: bigint): Promise<NewApiKeyResponse>;
}

declare module "./posts.ts" {
    export interface Post {
        id       : number;
        src      : string;
        uploader : string;
        date     : number;
        score    : number;
        voters   : string;
        tags     : string;
        rating   : string;
        deleted  : number;
        source?  : string;
    }

    /**
     * Retrieves all posts from the database.
     * @returns Promise resolving to an array of posts.
     */
    export function grab(): Promise<Post[]>;

    /**
     * Uploads a new post to the database.
     * @param src - The source URL or identifier of the post.
     * @param uploader - The uploader's username or identifier.
     * @returns Promise that resolves when the upload is complete.
     */
    export function upload(src: string, uploader: string): Promise<void>;
}

declare module "database" {
    /**
     * Result object returned by sqlite's run() method.
     */
    export interface RunResult {
        lastID? : number;
        changes : number;
    }

    /**
     * Executes a SQL statement without returning rows (e.g., INSERT, UPDATE, DELETE).
     * @param sql - The SQL query string.
     * @param params - Optional array of parameters for the query.
     * @returns A Promise resolving to a result object.
     */
    export function run(sql: string, params?: any[]): Promise<RunResult>;

    /**
     * Executes a SQL query and returns the first row of the result set.
     * @param sql - The SQL query string.
     * @param params - Optional array of parameters for the query.
     * @returns A Promise resolving to a single row object or undefined.
     */
    export function get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;

    /**
     * Executes a SQL query and returns all rows of the result set.
     * @param sql - The SQL query string.
     * @param params - Optional array of parameters for the query.
     * @returns A Promise resolving to an array of row objects.
     */
    export function all<T = any>(sql: string, params?: any[]): Promise<T[]>;
}