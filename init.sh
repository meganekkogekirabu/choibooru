npm install
mkdir -p public/assets/posts
[ ! -f "public/assets/logo.png" ] && printf "\ncouldn't find logo, make sure you add one to public/assets/logo.png\n"

sqlite3 booru.db <<EOF
    CREATE TABLE IF NOT EXISTS posts(
        src TEXT UNIQUE NOT NULL,
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uploader TEXT NOT NULL,
        date TIMESTAMP, 
        score INTEGER DEFAULT 0,
        voters TEXT,
        rating VARCHAR(20)
            CHECK (rating IN ('general', 'sensitive', 'questionable', 'explicit')),
        tags VARCHAR
    );

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        user_groups TEXT,
        deleted BOOL
    );
.quit
EOF

printf "\n"

node server.js