# Dependency update process

This repository uses a combination of Dependabot and a scheduled GitHub Action to keep dependencies up to date.

- Dependabot (`.github/dependabot.yml`) opens weekly PRs for available updates.
- A scheduled workflow (`.github/workflows/dependency-update.yml`) runs weekly and attempts to update minor and patch versions with `npm-check-updates` and opens a PR if changes are found.
- Run the helper script locally: `scripts/update-deps.sh` to update and run tests before opening a PR.

If a PR updates major versions, review and test carefully—run the locally relevant build/test commands for the `api`, `frontend`, and `led-simulator` apps.
