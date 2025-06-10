#!/bin/bash

MODE=${1:-dev}
ENV=".$MODE.env"

OK="\e[32mOK      =>\e[0m"
WARNING="\e[33mWARNING =>\e[0m"
ERROR="\e[31mERROR   =>\e[0m"
NOTICE="NOTICE  =>"
INDENT="        =>"

mkdir -p logs
echo -e "$NOTICE logging to logs/start.sh.log"
exec > >(tee ./logs/start.sh.log) 2>&1

bail() {
    local status_code=${1:-0}
    sleep 5
    exit "$status_code"
}

# must be updated along with the dependencies list in init.sh
declare -A dependencies=(
    ["openssl"]="warning"
    ["sqlite3"]="warning"
    ["node"]="error"
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
        echo -e "$INDENT $dep"
    done
    bail 1
fi

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

echo -e "$OK checking dependencies"
npm install --silent
echo -e "$OK transpiling frontend scripts to JavaScript"
cd public/scripts
tsc
cd ../..
echo -e "$OK starting in $MODE mode"
set -a && source $ENV && set +a
exec node -r dotenv/config server.ts dotenv_config_path=$ENV