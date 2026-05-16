import { deviceCache } from "#src/globals/cache.js";
import { dataFetcher } from "#src/globals/dataFetcher.js";

// returns state per device
// { "roomId::deviceId" : { roomState, sensorStatus, connection }, ... }
export async function getInitialState() {
  const initialState = {};
  const keys = await dataFetcher.getAllIdPairs(); //returns [{ roomId, deviceId }, ...]
  keys.forEach(({ roomId, deviceId }) => {
    const key = `${roomId}::${deviceId}`;
    initialState[key] = getInitialStatePerDevice(roomId, deviceId);
  });
  return initialState;
}

function getInitialStatePerDevice(roomId, deviceId) {
  const roomState = deviceCache.getOrInitDeviceRoomState(roomId, deviceId);
  const sensorStatus = deviceCache.getOrInitSensorStatus(roomId, deviceId);
  const connection = deviceCache.getOrInitDeviceConnection(roomId, deviceId);

  return {
    roomState,
    sensorStatus,
    connection,
  };
}
