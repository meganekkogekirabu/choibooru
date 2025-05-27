#!/bin/bash

MODE=${1:-dev}
ENV=".$MODE.env"

exec > >(tee init.sh.log) 2>&1

# check if node is already running
if pgrep -f "node server.js" > /dev/null; then
    echo "node is already running, exiting..."
    exit 1
fi

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

if [ ! -f "$ENV" ]; then
    cat > "$ENV" <<EOF
SESSION_KEY=""
HOSTNAME=""
PORT=0
EOF
    <<EOF
$ENV created with default configuration
set values for:
    SESSION_KEY
    HOSTNAME
    PORT
EOF
    sleep 5
    exit 1
else
    echo
    echo "starting in $MODE mode"
    set -a && source $ENV && set +a
    exec node -r dotenv/config server.js dotenv_config_path=$ENV
fi