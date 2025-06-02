# Settings
set dotenv-load
set shell:=['pwsh', '-c']

default:
    @just --list
    @echo "`nUsage: just <recipe>`n"

build:
    npm run build

run:
    npm run dev
