import { allowedInfluxGranularities } from "#src/utils/constants.js";
import { influxQueryApi, influxEnabled, influxConfig } from "./influxClient.js";

const TAG = "[Influx Reader]";

function parseDurationToMs(durationStr) {
  if (!durationStr) return 0;

  const cleanStr = durationStr.split("#")[0].trim();
  const match = cleanStr.match(/^(\d+)([smhd]?)$/);

  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return value;
  }
}

const DataRetentionMs = parseDurationToMs(process.env.INFLUXDB_DATA_RETENTION);

export async function getRecentRoomStateHistory(
  roomId,
  timeRangeDays = 1,
  granularity = "15m", // if not provided, defaults to 15 minutes granularity
) {
  if (!influxEnabled || !influxQueryApi) {
    throw new Error(`${TAG} InfluxDB reader is not initialized.`);
  }

  // run checks
  if (!Number.isInteger(timeRangeDays) || timeRangeDays <= 0) {
    throw new Error(
      `${TAG} invalid time range: timeRangeDays must be a positive number`,
    );
  }
  if (timeRangeDays > DataRetentionMs / (24 * 60 * 60 * 1000)) {
    throw new Error(
      `${TAG} invalid time range: given range is greater than the allowed maximum (${DataRetentionMs / (24 * 60 * 60 * 1000)}).`,
    );
  }

  const qGranularity =
    granularity && allowedInfluxGranularities.includes(granularity)
      ? granularity
      : "15m";

  const fluxQuery = `
      from(bucket: "${influxConfig.bucket}")
        |> range(start: -${timeRangeDays}d)
        |> filter(fn: (r) => r["_measurement"] == "mmWave_data_interpreted")
        |> filter(fn: (r) => r["_field"] == "room_state")
        |> filter(fn: (r) => r["room_id"] == "${roomId}")
        |> aggregateWindow(every: ${qGranularity}, fn: last, createEmpty: false)
        |> keep(columns: ["_time", "_value", "device_id"])
    `;

  return runQuery(fluxQuery);
}

export async function getRoomStateHistory(
  roomId, // integer
  timeRangeStart,
  timeRangeEnd,
  granularity = "15m", // if not provided, defaults to 15 minutes granularity
) {
  if (!influxEnabled || !influxQueryApi) {
    throw new Error(`${TAG} InfluxDB reader is not initialized.`);
  }

  const start = timeRangeStart
    ? new Date(timeRangeStart)
    : new Date(Date.now() - 24 * 60 * 60 * 1000); // -1d fallback for undefined
  const end = timeRangeEnd ? new Date(timeRangeEnd) : new Date(); // fallback for undefined
  const now = new Date();

  // run checks
  if (isNaN(start.getTime()) || isNaN(end.getTime()))
    throw new Error(`${TAG} Invalid date format`);
  if (start >= end)
    throw new Error(`${TAG} Invalid time range: start must be before end`);
  if (
    start.getTime() > now.getTime() + 60000 ||
    end.getTime() > now.getTime() + 60000 // allow max 1 minute clock skew
  )
    throw new Error(
      `${TAG} Invalid time range: time range cannot be in the future`,
    );

  const timeRangeMs = end.getTime() - start.getTime();
  if (timeRangeMs > DataRetentionMs)
    throw new Error(
      `${TAG} invalid time range: given range is greater than the allowed maximum (${DataRetentionMs / (24 * 60 * 60 * 1000)}).`,
    );

  // validate granularity, fallback to 15m if invalid or not provided
  const qGranularity =
    granularity && allowedInfluxGranularities.includes(granularity)
      ? granularity
      : "15m";

  const fluxQuery = `
      from(bucket: "${influxConfig.bucket}")
        |> range(start: ${start.toISOString()}, stop: ${end.toISOString()})
        |> filter(fn: (r) => r["_measurement"] == "mmWave_data_interpreted")
        |> filter(fn: (r) => r["_field"] == "room_state")
        |> filter(fn: (r) => r["room_id"] == "${roomId}")
        |> aggregateWindow(every: ${qGranularity}, fn: last, createEmpty: false)
        |> keep(columns: ["_time", "_value", "device_id"])
    `;

  return runQuery(fluxQuery);
}

function runQuery(fluxQuery) {
  const results = [];

  return new Promise((resolve, reject) => {
    influxQueryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        results.push({
          time: o._time,
          room_state: o._value,
          device_id: o.device_id,
        });
      },
      error: (error) => {
        console.error(`${TAG} Error during query execution:`, error);
        reject(error);
      },
      complete: () => resolve(results),
    });
  });
}
