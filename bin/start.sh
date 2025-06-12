#!/bin/bash

MODE="dev"
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            MODE="$1"
            shift
            ;;
    esac
done

ENV=".$MODE.env"

source bin/common.sh
log_to_file "logs/start.sh.log"

# update along with the list in start.sh
# dependencies used in this file should throw an error
declare -A dependencies=(
    ["openssl"]="warning"
    ["sqlite3"]="warning"
    ["node"]="error"
    ["npm"]="error"
    ["tsc"]="error"
)
check_dependencies dependencies
check_assets

if [ ! -f "$ENV" ]; then
    echo -e "$ERROR this installation has not been initialised with init.sh, exiting..."
    bail 1
fi

# check if node is already running
if pgrep -f "node server.js" > /dev/null; then
    echo -e "$ERROR node is already running, exiting..."
    bail 1
fi

# check that environment variables have been configured

declare -A defaults=(
    ["SESSION_KEY"]="\"\""
    ["HTTP_HOSTNAME"]="\"\""
    ["HTTP_PORT"]="0"
    ["HTTPS_PORT"]="0"
    ["CN"]="\"\""
)

while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue

    if [[ -v DEFAULTS["$key"] ]]; then
        default_value="${DEFAULTS["$key"]}"

        if [[ "$value" == "$default_value" ]]; then
            echo -e "$ERROR a value for $key has not been configured, exiting..."
            bail 1
        fi
    fi
done < "$ENV"

# ANSI shadow font (https://patorjk.com/software/taag)
printf "%b\n" "$(cat <<EOF
\e[1;36m
 ██████╗██╗  ██╗ ██████╗ ██╗██████╗  ██████╗  ██████╗ ██████╗ ██╗   ██╗     ██████╗    ██╗
██╔════╝██║  ██║██╔═══██╗██║██╔══██╗██╔═══██╗██╔═══██╗██╔══██╗██║   ██║    ██╔═████╗  ███║
██║     ███████║██║   ██║██║██████╔╝██║   ██║██║   ██║██████╔╝██║   ██║    ██║██╔██║  ╚██║
██║     ██╔══██║██║   ██║██║██╔══██╗██║   ██║██║   ██║██╔══██╗██║   ██║    ████╔╝██║   ██║
╚██████╗██║  ██║╚██████╔╝██║██████╔╝╚██████╔╝╚██████╔╝██║  ██║╚██████╔╝    ╚██████╔╝██╗██║
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝      ╚═════╝ ╚═╝╚═╝
\e[0m
EOF
)"

echo -e "$OK checking dependencies"
npm install --silent
echo -e "$OK transpiling frontend scripts to JavaScript"
cd public/scripts
tsc
cd ../..

if [ "$VERBOSE" == true ]; then
    echo "$NOTICE verbose mode enabled"
fi

echo -e "$OK starting in $MODE mode"
set -a && source $ENV && set +a

start=(node -r dotenv/config server.ts "dotenv_config_path=$ENV")

if [ $VERBOSE == true ]; then
    echo "$NOTICE verbose mode enabled"
    start+=(--verbose)
fi

exec "${start[@]}"