npm install
mkdir -p public/assets

sqlite3 booru.db <<EOF
    CREATE TABLE IF NOT EXISTS posts(
        src TEXT UNIQUE NOT NULL,
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uploader TEXT NOT NULL,
        date TIMESTAMP, 
        score integer default 0,
        voters text,
        rating varchar(20)
            check (rating in ('general', 'sensitive', 'questionable', 'explicit')), tags varchar
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

echo ""

node server.js