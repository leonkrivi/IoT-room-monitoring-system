import "dotenv/config";
import { InfluxDB } from "@influxdata/influxdb-client";

const TAG = "[Influx Client]";

let influxWriteApi = null;
let influxQueryApi = null;
let influxEnabled = false;

const influxConfig = {
  url: process.env.INFLUXDB_URL || "http://localhost:8086",
  org: process.env.INFLUXDB_ORG || "iot_final_project",
  token:
    process.env.INFLUXDB_BACKEND_TOKEN ||
    "628be9ef60e6fccb5108405c538fa063b897583748ee0d911c97fc19366cc900",
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
      {
        maxRetries: 2, // two retries if write fails (e.g., if InfluxDB is temporarily unavailable)
        maxBufferLines: 1000, // buffer up to 1000 points before flushing
      },
    );
    influxQueryApi = influxDB.getQueryApi(influxConfig.org);
    influxEnabled = true;
    console.log(`${TAG} running on ${influxConfig.url}`);
  } catch (err) {
    console.error(`${TAG} failed to initialize: ${err.message}`);
  }
}

export { influxWriteApi, influxQueryApi, influxEnabled, influxConfig };
