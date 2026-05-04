import { makeDeviceKey } from "#src/ingest/deviceKey.js";

export function createDeviceCache() {
  const configByDevice = new Map();
  const statusByDevice = new Map();

  function getOrInitConfig(roomId, deviceId) {
    const key = makeDeviceKey(roomId, deviceId);
    const cached = configByDevice.get(key);
    if (cached) {
      return cached;
    }

    const hydrated = {
      hbIntervalMs: null,
      sensorRateMs: null,
    };
    configByDevice.set(key, hydrated);
    return hydrated;
  }

  function getOrInitStatus(roomId, deviceId) {
    const key = makeDeviceKey(roomId, deviceId);
    const cached = statusByDevice.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const hydrated = null;
    statusByDevice.set(key, hydrated);
    return hydrated;
  }

  function setStatus(roomId, deviceId, status) {
    const key = makeDeviceKey(roomId, deviceId);
    statusByDevice.set(key, status);
  }

  return {
    getOrInitConfig,
    getOrInitStatus,
    setStatus,
  };
}
