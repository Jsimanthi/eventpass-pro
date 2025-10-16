#!/bin/sh
# A script to wait for services to be available before executing a command.

set -e

# Loop through service arguments until we hit the '--' separator
while [ $# -gt 0 ]; do
    # If the argument is '--', stop processing services and break the loop.
    if [ "$1" = '--' ]; then
        shift # remove the '--'
        break
    fi

    SERVICE="$1"
    HOST=$(echo $SERVICE | cut -d: -f1)
    PORT=$(echo $SERVICE | cut -d: -f2)

    echo "Waiting for $HOST:$PORT..."

    # Use a loop with netcat to check for connectivity.
    until nc -z "$HOST" "$PORT"; do
        >&2 echo "$HOST:$PORT is unavailable - sleeping"
        sleep 1
    done

    >&2 echo "$HOST:$PORT is up."
    shift # remove the processed service argument
done

# After the loop, the remaining arguments are the command to execute.
# Print the command for debugging purposes.
>&2 echo "Executing command: $@"

# Execute the command.
exec "$@"
