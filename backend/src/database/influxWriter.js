import "dotenv/config";
import { InfluxDB, Point } from "@influxdata/influxdb-client";

const TAG = "[Influx Writer]";

const config = {
  url: `http://localhost:${process.env.INFLUXDB_PORT || 8086}`,
  org: process.env.INFLUXDB_ORG,
  token: process.env.DOCKER_INFLUXDB_INIT_ADMIN_TOKEN,
  bucket: process.env.INFLUXDB_BUCKET || "room_monitoring",
};

let writeApi = null;
let enabled = false;

if (!config.org || !config.token) {
  console.warn(
    `${TAG} disabled, missing INFLUXDB_ORG or INFLUXDB_BACKEND_TOKEN`,
  );
} else {
  try {
    const influxDB = new InfluxDB({ url: config.url, token: config.token });
    writeApi = influxDB.getWriteApi(config.org, config.bucket, "ms");
    enabled = true;
  } catch (err) {
    console.error(`${TAG} failed to initialize: ${err.message}`);
  }
}

export async function dbStoreProcessedEvent(event) {
  if (!enabled || !writeApi) {
    return false;
  }

  const point = new Point("mmWave_data_interpreted")
    .tag("room_id", event.roomId)
    .tag("device_id", event.deviceId)
    // .intField("presence", event.presence)
    // .intField("motion", event.motion)
    .stringField("room_state", event.roomState)
    .timestamp(new Date(event.processedAt));

  writeApi.writePoint(point);
  return true;
}

export async function dbFlushInfluxWrites() {
  if (!enabled || !writeApi) return;
  await writeApi.flush();
}

export async function dbCloseInfluxWriter() {
  if (!enabled || !writeApi) return;
  await writeApi.close();
}
