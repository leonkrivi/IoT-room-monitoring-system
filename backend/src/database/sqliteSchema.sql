PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS devices (
  room_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (room_id, device_id)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS device_status (
  room_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  sensor_status TEXT CHECK (sensor_status IN ('alive', 'dead', 'unknown')),
  connection_status TEXT CHECK (connection_status IN ('online', 'offline')),
  PRIMARY KEY (room_id, device_id),
  FOREIGN KEY (room_id, device_id)
    REFERENCES devices (room_id, device_id)
    ON DELETE CASCADE
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS device_config (
  room_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  hb_interval_ms INTEGER CHECK (hb_interval_ms IS NULL OR hb_interval_ms >= 0),
  sensor_rate_ms INTEGER CHECK (sensor_rate_ms IS NULL OR sensor_rate_ms >= 0),
  PRIMARY KEY (room_id, device_id),
  FOREIGN KEY (room_id, device_id)
    REFERENCES devices (room_id, device_id)
    ON DELETE CASCADE
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_device_status_sensor_status
  ON device_status (sensor_status);

CREATE INDEX IF NOT EXISTS idx_device_status_connection_status
  ON device_status (connection_status);
