# !/bin/bash

# run after you made valid .env file

# need:
#   openssl
#   docker CLI

check=$(which openssl)
if [ -z "$check" ]; then
  echo "openssl not found, please install it first"
  exit 1
fi

token=$(openssl rand -hex 32)
echo "DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=$token" >> .env

check=$(which docker)
if [ -z "$check" ]; then
  echo "docker CLI not found, please install it first"
  exit 1
fi

echo "==> Starting InfluxDB container to initialize the database..."
docker compose up -d influxdb

echo "==> Next steps:"
echo -e "\t1. from the InfluxDB UI get backend token with read/write perissions"
echo -e "\t2. run `bash startup2.sh <token>`"