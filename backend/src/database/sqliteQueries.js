export const SQL = {
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
        connection_status = excluded.connection_status,
        sensor_status = CASE
          WHEN excluded.connection_status = 'offline' THEN 'unknown'
          ELSE sensor_status
        END
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
