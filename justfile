# Settings
set dotenv-load
set shell:=['pwsh', '-c']

# List all available recipes
[group("help")]
default:
    @just --list
    @echo "`nUsage: just <recipe>`n"

# Build the application
[group("code")]
build:
    npm run build

# Run the development server
[group("code")]
run:
    npm run dev

# Deploy the application to GitHub Pages
[group("deploy")]
deploy:
    npm run deploy

# Update the package dependencies
[group("code")]
update:
    npm update --save

# Lint the code
[group("code")]
lint:
    npm run lint

# Format the code
[group("code")]
format:
    npm run format
