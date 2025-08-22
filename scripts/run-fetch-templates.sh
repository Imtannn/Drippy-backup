#!/bin/bash

# Load environment variables from .env file if it exists
if [ -f scripts/.env ]; then
    export $(cat scripts/.env | grep -v '^#' | xargs)
fi

# Run the TypeScript script
cd scripts && npx ts-node --project ./tsconfig.json --transpile-only imports/fetch-drive-templates.ts
