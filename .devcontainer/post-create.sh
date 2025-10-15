#!/bin/bash
# This script is executed when the container is created and started.

set -e # Exit immediately if a command exits with a non-zero status.

echo "--- Starting container setup script ---"

# The nix-shell command will run the rest of the script in the correct environment.
# This ensures all our tools from dev.nix are available.
nix-shell .idx/dev.nix --run "
  echo '--- Inside nix-shell ---'

  echo '--- Running go mod tidy ---'
  go mod tidy

  echo '--- Starting Docker services (database) ---'
  # We change to the backend directory to find the docker-compose.yml
  cd apps/backend
  docker-compose up -d

  echo '--- Waiting for database to initialize (15s) ---'
  sleep 15

  echo '--- Running database migrations ---'
  # The DATABASE_URL environment variable is available inside the nix-shell
  migrate -path db/migrations -database \"\$DATABASE_URL\" up

  echo '--- Generating SQLC code from queries ---'
  sqlc generate -f sqlc.yaml

  echo '--- Nix-shell setup complete ---'
"

echo "--- Container setup finished successfully! ---"
