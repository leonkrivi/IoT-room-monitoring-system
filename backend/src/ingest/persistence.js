import {
  dbStoreDeviceSeen,
  dbStoreDeviceConfig,
  dbStoreConnectionStatus,
  dbStoreSensorRate,
  dbStoreSensorStatus,
} from "#src/database/sqliteStatusStore.js";
import {
  dbStoreProcessedEvent,
  dbFlushInfluxWrites,
} from "#src/database/influxWriter.js";

const TAG = "[Persistence]";

export function createPersistence() {
  async function markDeviceSeen(roomId, deviceId, receivedAt) {
    const stored = await dbStoreDeviceSeen({
      roomId,
      deviceId,
      receivedAt,
    });

    if (!stored) {
      console.warn(
        `${TAG} skipped SQLite devices write (${roomId}::${deviceId})`,
      );
    }
  }

  async function storeSensorStatus({
    roomId,
    deviceId,
    sensorStatus,
    hbIntervalMs,
    receivedAt,
  }) {
    const stored = await dbStoreSensorStatus({
      roomId,
      deviceId,
      sensorStatus,
      hbIntervalMs,
      receivedAt,
    });

    if (!stored) {
      console.warn(
        `${TAG} skipped SQLite sensor/status write (${roomId}::${deviceId})`,
      );
    }

    return stored;
  }

  async function storeConnectionStatus({
    roomId,
    deviceId,
    connectionStatus,
    receivedAt,
  }) {
    return dbStoreConnectionStatus({
      roomId,
      deviceId,
      connectionStatus,
      receivedAt,
    });
  }

  async function storeSensorRate({
    roomId,
    deviceId,
    sensorRateMs,
    receivedAt,
    seq,
  }) {
    const stored = await dbStoreSensorRate({
      roomId,
      deviceId,
      sensorRateMs,
      receivedAt,
    });

    if (!stored) {
      console.warn(
        `${TAG} skipped SQLite sensor_rate write (${roomId}::${deviceId}) seq=${seq}`,
      );
    }

    return stored;
  }

  async function storeDeviceConfig({
    roomId,
    deviceId,
    hbIntervalMs,
    sensorRateMs,
    receivedAt,
  }) {
    const stored = await dbStoreDeviceConfig({
      roomId,
      deviceId,
      hbIntervalMs,
      sensorRateMs,
      receivedAt,
    });

    if (!stored) {
      console.warn(
        `${TAG} skipped SQLite reset config write (${roomId}::${deviceId})`,
      );
    }

    return stored;
  }

  async function storeProcessedEvent(event) {
    return dbStoreProcessedEvent(event);
  }

  async function flushInfluxWrites() {
    await dbFlushInfluxWrites();
  }

  return {
    markDeviceSeen,
    storeSensorStatus,
    storeConnectionStatus,
    storeSensorRate,
    storeDeviceConfig,
    storeProcessedEvent,
    flushInfluxWrites,
  };
}
