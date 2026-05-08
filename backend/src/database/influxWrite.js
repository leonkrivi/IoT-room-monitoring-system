import { Point } from "@influxdata/influxdb-client";
import { influxWriteApi, influxEnabled } from "./influxClient.js";

const TAG = "[Influx Writer]";

export async function dbStoreProcessedRoomState(event) {
  if (!influxEnabled || !influxWriteApi) {
    return false;
  }

  const point = new Point("mmWave_data_interpreted")
    .tag("room_id", event.roomId)
    .tag("device_id", event.deviceId)
    // .intField("presence", event.presence)
    // .intField("motion", event.motion)
    .stringField("room_state", event.roomState)
    .timestamp(new Date(event.processedAt));

  influxWriteApi.writePoint(point);
  return true;
}

export async function dbFlushInfluxWrites() {
  if (!influxEnabled || !influxWriteApi) return;
  await influxWriteApi.flush();
}

export async function dbCloseinfluxWrite() {
  if (!influxEnabled || !influxWriteApi) return;
  await influxWriteApi.close();
}
