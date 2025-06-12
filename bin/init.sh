#!/bin/bash

MODE=${1:-dev}
ENV=".$MODE.env"

source bin/common.sh
log_to_file "bin/logs/init.sh.log"

# update along with the list in init.sh
# dependencies used in this file should throw an error
declare -A dependencies=(
    ["openssl"]="error"
    ["sqlite3"]="error"
    ["node"]="warning"
    ["npm"]="error"
    ["tsc"]="warning"
)

check_dependencies dependencies
check_assets

if [ -f "$ENV" ]; then
    source "$ENV"

    if [ -f "keys/certificate.pem" ]; then
        echo -e "$ERROR this installation has already been initialised for $MODE mode, exiting..."
        bail 1
    elif [ "$CN" == "" ]; then
        echo -e "$ERROR you must set a value for CN before running the script again, exiting..."
        bail 1
    fi
fi

if [ ! -f "booru.db" ]; then
    sqlite3 booru.db < init.sql
    echo -e "$OK initialised SQL database"
fi

if [ ! -f "$ENV" ]; then
    echo -e "$OK installing dependencies"
    npm install --silent
    mkdir -p public/assets/posts
    mkdir -p keys
    
    cat > "$ENV" <<EOF
SESSION_KEY=""
HTTP_HOSTNAME=""
HTTP_PORT=0
HTTPS_PORT=0
ENVIRONMENT="$MODE"
CN=""
EOF
    printf "%b\n" "$(cat <<EOF
$OK created $ENV with default configuration
$INDENT set values for:
$INDENT    SESSION_KEY
$INDENT    HTTP_HOSTNAME
$INDENT    HTTP_PORT
$INDENT    HTTPS_PORT
$INDENT    CN
$INDENT then run this script again
$OK exiting...
EOF
)"
else
    openssl req -x509 -newkey rsa:2048 -nodes -subj "/CN=$CN" \
        -keyout keys/private-key.pem -out keys/certificate.pem \
        > /dev/null 2>&1 # silent
    echo -e "$OK created private key and certificate, exiting..."
    bail
fi
