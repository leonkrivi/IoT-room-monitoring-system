import { makeDeviceKey } from "#src/utils/deviceKey.js";

export function createDeviceCache() {
  const roomStateByDevice = new Map();
  const configByDevice = new Map();
  const sensorStatusByDevice = new Map();
  const connectionByDevice = new Map();

  // ==================== Room State Methods ====================
  function getOrInitDeviceRoomState(roomId, deviceId) {
    const key = makeDeviceKey(roomId, deviceId);
    if (roomStateByDevice.has(key)) return roomStateByDevice.get(key);

    const init = null;
    roomStateByDevice.set(key, init);
    return init;
  }

  function getRoomStateAll(roomId, deviceId) {
    return roomStateByDevice;
  }

  function setDeviceRoomState(roomId, deviceId, roomState) {
    const key = makeDeviceKey(roomId, deviceId);
    roomStateByDevice.set(key, roomState);
  }

  // ==================== Config Methods ====================
  function getOrInitDeviceConfig(roomId, deviceId) {
    const key = makeDeviceKey(roomId, deviceId);
    if (configByDevice.has(key)) return configByDevice.get(key);

    const init = {
      hbIntervalMs: null,
      sensorRateMs: null,
    };
    configByDevice.set(key, init);
    return init;
  }

  // ==================== Sensor Status Methods ====================
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

  // ==================== Connection Methods ====================
  function getOrInitDeviceConnection(roomId, deviceId) {
    const key = makeDeviceKey(roomId, deviceId);
    if (connectionByDevice.has(key)) return connectionByDevice.get(key);

    const init = null;
    connectionByDevice.set(key, init);
    return init;
  }

  function setDeviceConnection(roomId, deviceId, connection) {
    const key = makeDeviceKey(roomId, deviceId);
    connectionByDevice.set(key, connection);
  }

  // ==================== Hydration ====================
  function hydrateCache(statuses, roomStates) {
    for (const row of statuses) {
      const { roomId, deviceId, sensorStatus, connectionStatus } = row;
      const key = makeDeviceKey(roomId, deviceId);

      if (sensorStatus !== undefined && sensorStatus !== null) {
        sensorStatusByDevice.set(key, sensorStatus);
      }
      if (connectionStatus !== undefined && connectionStatus !== null) {
        connectionByDevice.set(key, connectionStatus);
      }
    }

    for (const row of roomStates) {
      const { roomId, deviceId, roomState } = row;
      const key = makeDeviceKey(roomId, deviceId);

      if (roomState !== undefined && roomState !== null) {
        roomStateByDevice.set(key, roomState);
      }
    }
  }

  return {
    getOrInitDeviceRoomState,
    setDeviceRoomState,
    getOrInitDeviceConfig,
    getOrInitSensorStatus,
    setSensorStatus,
    getOrInitDeviceConnection,
    setDeviceConnection,
    hydrateCache,
  };
}
