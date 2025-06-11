#!/bin/bash
# This file is not meant to be used directly. It provides code used by both init.sh and start.sh.

# ANSI styles
OK="\e[32mOK      =>\e[0m"
WARNING="\e[33mWARNING =>\e[0m"
ERROR="\e[31mERROR   =>\e[0m"
NOTICE="NOTICE  =>"
INDENT="        =>"

log_to_file() {
    mkdir -p logs
    echo -e "$NOTICE logging to $1"
    exec > >(tee "$1") 2>&1
}

bail() {
    local status_code=${1:-0}
    sleep 5
    exit "$status_code"
}

check_dependencies() {
    declare -n deps=$1 # use nameref for associative array
    missing=()
    for dep in "${!deps[@]}"; do
        if ! command -v "$dep" &>/dev/null; then
            if [[ "${deps[$dep]}" == "error" ]]; then
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
}

check_assets() {
    declare -a assets=(
        "public/assets/logo.png"
        "public/assets/404.png"
        "public/assets/posts/deleted.png"
        "public/assets/favicon.ico"
        "public/assets/gulim.ttf"
    )
    for asset in "${assets[@]}"; do
        [ ! -f "$asset" ] && echo -e "$WARNING couldn't find $asset, make sure you add it"
    done
}