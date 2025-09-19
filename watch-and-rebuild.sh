#!/bin/bash

# Simple file watcher that rebuilds Docker on changes
echo "Watching for changes in src/, prisma/, and .env files..."

# Install fswatch if not available: brew install fswatch (macOS) or apt install inotify-tools (Linux)
if command -v fswatch &> /dev/null; then
    fswatch -o src/ prisma/ .env docker-compose.yml Dockerfile | while read f; do
        echo "Changes detected, rebuilding..."
        docker compose restart app
        echo "Rebuild complete!"
    done
elif command -v inotifywait &> /dev/null; then
    while inotifywait -r -e modify,create,delete src/ prisma/ .env docker-compose.yml Dockerfile; do
        echo "Changes detected, rebuilding..."
        docker compose restart app
        echo "Rebuild complete!"
    done
else
    echo "Please install fswatch (macOS) or inotify-tools (Linux) for file watching"
fi