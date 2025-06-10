#!/bin/bash

MODE=${1:-dev}
ENV=".$MODE.env"

OK="\e[32mOK      =>\e[0m"
WARNING="\e[33mWARNING =>\e[0m"
ERROR="\e[31mERROR   =>\e[0m"
NOTICE="NOTICE  =>"

mkdir -p logs
echo -e "$NOTICE logging to logs/init.sh.log"
exec > >(tee ./logs/init.sh.log) 2>&1

bail() {
    local status_code=${1:-0}
    sleep 5
    exit "$status_code"
}

# must be updated along with the dependencies list in init.sh
declare -A dependencies=(
    ["openssl"]="error"
    ["sqlite3"]="error"
    ["node"]="warning"
    ["npm"]="error"
)

missing=()

for dep in "${!dependencies[@]}"; do
    if ! command -v "$dep" &>/dev/null; then
        if [[ "${dependencies[$dep]}" == "error" ]]; then
            missing+=("$dep")
        else
            echo -e "$WARNING missing (optional for this script) dependency $dep"
        fi
    fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
    echo -e "$ERROR missing the following required dependencies, exiting:"
    for dep in "${missing[@]}"; do
        echo -e "   $dep"
    done
    bail 1
fi

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

echo -e "$OK installing dependencies"
npm install --silent
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
    [ ! -f "$asset" ] && echo -e "$WARNING couldn't find $asset, make sure you add it"
done

if [ ! -f "booru.db" ]; then
    sqlite3 booru.db < init.sql
    echo -e "$OK initialised SQL database"
fi

if [ ! -f "$ENV" ]; then
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
    set values for:
        SESSION_KEY
        HTTP_HOSTNAME
        HTTP_PORT
        HTTPS_PORT
        CN
    then run this script again
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
