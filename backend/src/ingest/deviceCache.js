import { makeDeviceKey } from "#src/ingest/deviceKey.js";

export function createDeviceCache() {
  const configByDevice = new Map();
  const sensorStatusByDevice = new Map();

  function getOrInitConfig(roomId, deviceId) {
    const key = makeDeviceKey(roomId, deviceId);
    if (configByDevice.has(key)) return configByDevice.get(key);

    const init = {
      hbIntervalMs: null,
      sensorRateMs: null,
    };
    configByDevice.set(key, init);
    return init;
  }

  function getOrInitSensorStatus(roomId, deviceId) {
    const key = makeDeviceKey(roomId, deviceId);
    if (sensorStatusByDevice.has(key)) return sensorStatusByDevice.get(key);

    const init = null;
    sensorStatusByDevice.set(key, init);
    return init;
  }

  function setSensorStatus(roomId, deviceId, sensorStatus) {
    const key = makeDeviceKey(roomId, deviceId);
    sensorStatusByDevice.set(key, sensorStatus);
  }

  return {
    getOrInitConfig,
    getOrInitSensorStatus,
    setSensorStatus,
  };
}
