#!/bin/bash

exec > >(tee .log) 2>&1

npm install
mkdir -p public/assets/posts

declare -a assets=(
    "public/assets/logo.png"
    "public/assets/404.png"
    "public/assets/posts/deleted.png"
    "public/assets/favicon.ico"
)

for asset in "${assets[@]}"
do
    [ ! -f "$asset" ] && printf "\ncouldn't find $asset, make sure you add it"
done

sqlite3 booru.db <<EOF
    CREATE TABLE IF NOT EXISTS "posts" (
        "src" TEXT NOT NULL UNIQUE,
        "id" INTEGER,
        "uploader" TEXT NOT NULL,
        "date" TIMESTAMP,
        "score" INTEGER DEFAULT 0,
        "voters" TEXT,
        "rating" VARCHAR(20) CHECK("rating" IN ('general', 'sensitive', 'questionable', 'explicit')),
        "tags" TEXT,
        "deleted" BOOL DEFAULT 0 CHECK("deleted" IN (0, 1)),
        PRIMARY KEY("id" AUTOINCREMENT)
    );

    CREATE TABLE IF NOT EXISTS users (
        "id" INTEGER,
        "username" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "user_groups" TEXT,
        "deleted" BOOL DEFAULT 0 CHECK("deleted" IN (0,1)),
        PRIMARY KEY("id" AUTOINCREMENT)
    );
.quit
EOF

if [ ! -f ".env" ]; then
    cat > ".env" <<EOF
SESSION_KEY=""
HOSTNAME=""
PORT=0
EOF
    printf "\n.env created with default configuration\n"
    printf "\nset values for:\n"
    printf "  SESSION_KEY\n  HOSTNAME\n  PORT\n"
    sleep 5
    exit 1
else
    echo
    set -a && source .env && set +a
    node server.js "$HOSTNAME" "$PORT"
fi