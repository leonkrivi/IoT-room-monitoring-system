#!/bin/sh
set -eu

if [ -z "${DOCKER_INFLUXDB_INIT_ADMIN_TOKEN:-}" ]; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo "ERROR: openssl is not available inside the InfluxDB container." >&2
    exit 1
  fi

  export DOCKER_INFLUXDB_INIT_ADMIN_TOKEN="$(openssl rand -hex 32)"
  echo "Generated DOCKER_INFLUXDB_INIT_ADMIN_TOKEN with openssl before starting influxd"
fi

exec /entrypoint.sh influxd
