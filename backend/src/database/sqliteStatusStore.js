import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const TAG = "[SQLite Status Store]";
const defaultPath = path.resolve(process.cwd(), "data", "app.db");
const sqlitePath = path.resolve(process.env.SQLITE_PATH || defaultPath);

let db = null;
let enabled = false;

const SQL = {
  upsertDeviceSeen: `
    INSERT INTO devices (room_id, device_id, first_seen_at, last_seen_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(room_id, device_id)
    DO UPDATE SET last_seen_at = excluded.last_seen_at
  `,
  upsertSensorStatus: `
    INSERT INTO device_status (
      room_id, device_id, sensor_status
    )
    VALUES (?, ?, ?)
    ON CONFLICT(room_id, device_id)
    DO UPDATE SET
      sensor_status = excluded.sensor_status
  `,
  upsertConnectionStatus: `
    INSERT INTO device_status (
      room_id, device_id, connection_status
    )
    VALUES (?, ?, ?)
    ON CONFLICT(room_id, device_id)
    DO UPDATE SET
      connection_status = excluded.connection_status
  `,
  upsertHbInterval: `
    INSERT INTO device_config (
      room_id, device_id, hb_interval_ms
    )
    VALUES (?, ?, ?)
    ON CONFLICT(room_id, device_id)
    DO UPDATE SET
      hb_interval_ms = excluded.hb_interval_ms
  `,
  upsertSensorRate: `
    INSERT INTO device_config (
      room_id, device_id, sensor_rate_ms
    )
    VALUES (?, ?, ?)
    ON CONFLICT(room_id, device_id)
    DO UPDATE SET
      sensor_rate_ms = excluded.sensor_rate_ms
  `,
  upsertDeviceConfig: `
    INSERT INTO device_config (
      room_id, device_id, hb_interval_ms, sensor_rate_ms
    )
    VALUES (?, ?, ?, ?)
    ON CONFLICT(room_id, device_id)
    DO UPDATE SET
      hb_interval_ms = excluded.hb_interval_ms,
      sensor_rate_ms = excluded.sensor_rate_ms
  `,
};

let stmts = null;
let txStoreSensorStatus = null;
let txStoreSensorRate = null;
let txStoreDeviceConfig = null;

function parseNumericId(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${TAG} invalid ${fieldName}: expected integer id`);
  }
  return parsed;
}

function asIsoDateString(value, fieldName) {
  let date;

  if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${TAG} invalid ${fieldName}: expected valid Date`);
  }

  return date.toISOString();
}

function normalizeIds(roomId, deviceId) {
  return {
    roomId: parseNumericId(roomId, "roomId"),
    deviceId: parseNumericId(deviceId, "deviceId"),
  };
}

function ensureEnabled() {
  if (!enabled || !db || !stmts) {
    return false;
  }
  return true;
}

function buildStatements() {
  stmts = {
    upsertDeviceSeen: db.prepare(SQL.upsertDeviceSeen),
    upsertSensorStatus: db.prepare(SQL.upsertSensorStatus),
    upsertConnectionStatus: db.prepare(SQL.upsertConnectionStatus),
    upsertHbInterval: db.prepare(SQL.upsertHbInterval),
    upsertSensorRate: db.prepare(SQL.upsertSensorRate),
    upsertDeviceConfig: db.prepare(SQL.upsertDeviceConfig),
  };

  txStoreSensorStatus = db.transaction(
    ({ roomId, deviceId, sensorStatus, hbIntervalMs, receivedAt }) => {
      stmts.upsertDeviceSeen.run(roomId, deviceId, receivedAt, receivedAt);
      if (sensorStatus !== undefined) {
        stmts.upsertSensorStatus.run(roomId, deviceId, sensorStatus);
      }

      if (hbIntervalMs !== undefined) {
        stmts.upsertHbInterval.run(roomId, deviceId, hbIntervalMs);
      }

      return true;
    },
  );

  txStoreSensorRate = db.transaction(
    ({ roomId, deviceId, sensorRateMs, receivedAt }) => {
      stmts.upsertDeviceSeen.run(roomId, deviceId, receivedAt, receivedAt);
      stmts.upsertSensorRate.run(roomId, deviceId, sensorRateMs);

      return true;
    },
  );

  txStoreDeviceConfig = db.transaction(
    ({ roomId, deviceId, hbIntervalMs, sensorRateMs, receivedAt }) => {
      stmts.upsertDeviceSeen.run(roomId, deviceId, receivedAt, receivedAt);
      stmts.upsertDeviceConfig.run(
        roomId,
        deviceId,
        hbIntervalMs,
        sensorRateMs,
      );

      return true;
    },
  );
}

function initSqlite() {
  try {
    const dbDir = path.dirname(sqlitePath);
    fs.mkdirSync(dbDir, { recursive: true });

    db = new Database(sqlitePath);
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 3000");

    const schemaPath = new URL("./sqliteSchema.sql", import.meta.url);
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schemaSql);

    buildStatements();
    enabled = true;

    console.log(`${TAG} initialized at ${sqlitePath}`);
  } catch (err) {
    enabled = false;
    db = null;
    console.error(`${TAG} failed to initialize: ${err.message}`);
  }
}

initSqlite();

export async function dbStoreSensorStatus({
  roomId,
  deviceId,
  sensorStatus,
  hbIntervalMs,
  receivedAt,
}) {
  if (!ensureEnabled()) {
    return false;
  }

  const ids = normalizeIds(roomId, deviceId);
  const normalizedReceivedAt = asIsoDateString(receivedAt, "receivedAt");

  return txStoreSensorStatus({
    roomId: ids.roomId,
    deviceId: ids.deviceId,
    sensorStatus,
    hbIntervalMs,
    receivedAt: normalizedReceivedAt,
  });
}

export async function dbStoreConnectionStatus({
  roomId,
  deviceId,
  connectionStatus,
  receivedAt,
}) {
  if (!ensureEnabled()) {
    return false;
  }

  const ids = normalizeIds(roomId, deviceId);
  const normalizedReceivedAt = asIsoDateString(receivedAt, "receivedAt");

  stmts.upsertDeviceSeen.run(
    ids.roomId,
    ids.deviceId,
    normalizedReceivedAt,
    normalizedReceivedAt,
  );

  const result = stmts.upsertConnectionStatus.run(
    ids.roomId,
    ids.deviceId,
    connectionStatus,
  );

  return result.changes > 0;
}

export async function dbStoreSensorRate({
  roomId,
  deviceId,
  sensorRateMs,
  receivedAt,
}) {
  if (!ensureEnabled()) {
    return false;
  }

  const ids = normalizeIds(roomId, deviceId);
  const normalizedReceivedAt = asIsoDateString(receivedAt, "receivedAt");

  return txStoreSensorRate({
    roomId: ids.roomId,
    deviceId: ids.deviceId,
    sensorRateMs,
    receivedAt: normalizedReceivedAt,
  });
}

export async function dbStoreDeviceConfig({
  roomId,
  deviceId,
  hbIntervalMs,
  sensorRateMs,
  receivedAt,
}) {
  if (!ensureEnabled()) {
    return false;
  }

  const ids = normalizeIds(roomId, deviceId);
  const normalizedReceivedAt = asIsoDateString(receivedAt, "receivedAt");

  return txStoreDeviceConfig({
    roomId: ids.roomId,
    deviceId: ids.deviceId,
    hbIntervalMs,
    sensorRateMs,
    receivedAt: normalizedReceivedAt,
  });
}

export async function dbCloseSqliteStore() {
  if (!enabled || !db) return;

  db.close();
  enabled = false;
  db = null;
}
