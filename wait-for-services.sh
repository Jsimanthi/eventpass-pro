#!/bin/sh
# wait-for-services.sh

set -e

# First argument is the command to execute
CMD="$@"

# Wait for each service in a loop
# Example usage: wait-for-services.sh postgres:5432 rabbitmq:5672 -- my-command
while [ $# -gt 0 ]; do
    SERVICE="$1"
    shift
    if [ "$SERVICE" = "--" ]; then
        break
    fi

    HOST=$(echo $SERVICE | cut -d: -f1)
    PORT=$(echo $SERVICE | cut -d: -f2)

    echo "Waiting for $HOST:$PORT..."

    # Use netcat (nc) to check if the port is open
    # Loop until the port is open
    until nc -z "$HOST" "$PORT"; do
        >&2 echo "$HOST:$PORT is unavailable - sleeping"
        sleep 1
    done

    >&2 echo "$HOST:$PORT is up - executing command"
done

# Execute the command that was passed in
exec $CMD
