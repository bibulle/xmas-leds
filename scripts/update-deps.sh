#!/usr/bin/env bash
set -euo pipefail

# Update package.json to the latest minor/patch versions, install and test.
echo "Running npm-check-updates (minor/patch) and installing"
npx -y npm-check-updates --target minor -u
npm install

echo "Running tests"
npm test

echo "If tests pass, commit package changes and push a branch for PR."
