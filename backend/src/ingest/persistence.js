import { statusStore } from "#src/database/sqliteStore.js";
import {
  dbStoreProcessedRoomState,
  dbFlushInfluxWrites,
} from "#src/database/influxWrite.js";

const TAG = "[Persistence]";

export function createPersistence() {
  async function markDeviceSeen(roomId, deviceId, receivedAt) {
    const stored = await statusStore.dbStoreDeviceSeen({
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
    const stored = await statusStore.dbStoreSensorStatus({
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
    return statusStore.dbStoreConnectionStatus({
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
    const stored = await statusStore.dbStoreSensorRate({
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
    const stored = await statusStore.dbStoreDeviceConfig({
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

  async function storeProcessedRoomState(event) {
    return dbStoreProcessedRoomState(event);
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
    storeProcessedRoomState,
    flushInfluxWrites,
  };
}
