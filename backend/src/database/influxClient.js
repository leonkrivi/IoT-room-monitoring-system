import "dotenv/config";
import { InfluxDB } from "@influxdata/influxdb-client";

const TAG = "[Influx Client]";

let influxWriteApi = null;
let influxQueryApi = null;
let influxEnabled = false;

const influxConfig = {
  url: process.env.INFLUXDB_URL,
  org: process.env.INFLUXDB_ORG,
  token: process.env.INFLUXDB_BACKEND_TOKEN,
  bucket: process.env.INFLUXDB_BUCKET || "room_monitoring",
};

if (!influxConfig.org || !influxConfig.token) {
  console.warn(`${TAG} disabled, missing env variables`);
} else {
  try {
    const influxDB = new InfluxDB({
      url: influxConfig.url,
      token: influxConfig.token,
    });
    influxWriteApi = influxDB.getWriteApi(
      influxConfig.org,
      influxConfig.bucket,
      "ms",
    );
    influxQueryApi = influxDB.getQueryApi(influxConfig.org);
    influxEnabled = true;
    console.log(`${TAG} running on ${influxConfig.url}`);
  } catch (err) {
    console.error(`${TAG} failed to initialize: ${err.message}`);
  }
}

export { influxWriteApi, influxQueryApi, influxEnabled, influxConfig };
