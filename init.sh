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
mkdir -p keys

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
        "rating" VARCHAR(20) DEFAULT 'general' CHECK("rating" IN ('general', 'sensitive', 'questionable', 'explicit')),
        "tags" TEXT,
        "deleted" BOOL DEFAULT 0 CHECK("deleted" IN (0, 1)),
        "source" TEXT,
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
HTTP_HOSTNAME=""
HTTP_PORT=0
HTTPS_PORT=0
ENVIRONMENT="$MODE"
EOF
    echo
    cat <<EOF
$ENV created with default configuration
set values for:
    SESSION_KEY
    HTTP_HOSTNAME
    HTTP_PORT
    HTTPS_PORT
EOF
    sleep 5
    exit 1
else
    echo
    echo "starting in $MODE mode"
    openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
        -keyout keys/private-key.pem -out keys/certificate.pem
    set -a && source $ENV && set +a
    exec node -r dotenv/config server.js dotenv_config_path=$ENV
fi
