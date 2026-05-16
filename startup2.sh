# !/bin/bash
# script for setting up the environment variable for the backend token and starting the system

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backend_token>"
    exit 1
fi

echo "INFLUXDB_BACKEND_TOKEN=$1" >> .env

echo "==> Backend token set. Starting the system..."

docker compose down -d
docker compose up