import { sqliteStore } from "#src/database/sqliteStore.js";
import {
  dbStoreProcessedRoomState,
  dbFlushInfluxWrites,
} from "#src/database/influxWrite.js";

const TAG = "[Persistence]";

export function createPersistence() {
  async function markDeviceSeen(roomId, deviceId, receivedAt) {
    const stored = await sqliteStore.dbStoreDeviceSeen({
      roomId,
      deviceId,
      receivedAt,
    });

    if (!stored) {
      console.warn(`${TAG} skipped device seen write (${roomId}::${deviceId})`);
    } else {
      console.log(
        `${TAG} successfully wrote device seen (${roomId}::${deviceId})`,
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
    const stored = await sqliteStore.dbStoreSensorStatus({
      roomId,
      deviceId,
      sensorStatus,
      hbIntervalMs,
      receivedAt,
    });

    if (!stored) {
      console.warn(
        `${TAG} skipped sensor/status write (${roomId}::${deviceId})`,
      );
    } else {
      console.log(
        `${TAG} successfully wrote sensor/status (${roomId}::${deviceId})`,
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
    const stored = await sqliteStore.dbStoreConnectionStatus({
      roomId,
      deviceId,
      connectionStatus,
      receivedAt,
    });

    if (!stored) {
      console.warn(
        `${TAG} skipped connection/status write (${roomId}::${deviceId})`,
      );
    } else {
      console.log(
        `${TAG} successfully wrote connection/status (${roomId}::${deviceId})`,
      );
    }

    return stored;
  }

  async function storeSensorRate({
    roomId,
    deviceId,
    sensorRateMs,
    receivedAt,
    seq,
  }) {
    const stored = await sqliteStore.dbStoreSensorRate({
      roomId,
      deviceId,
      sensorRateMs,
      receivedAt,
    });

    if (!stored) {
      console.warn(
        `${TAG} skipped sensor_rate write (${roomId}::${deviceId}) seq=${seq}`,
      );
    } else {
      console.log(
        `${TAG} successfully wrote sensor_rate (${roomId}::${deviceId})`,
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
    const stored = await sqliteStore.dbStoreDeviceConfig({
      roomId,
      deviceId,
      hbIntervalMs,
      sensorRateMs,
      receivedAt,
    });

    if (!stored) {
      console.warn(
        `${TAG} skipped reset config write (${roomId}::${deviceId})`,
      );
    } else {
      console.log(
        `${TAG} successfully wrote reset config (${roomId}::${deviceId})`,
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
