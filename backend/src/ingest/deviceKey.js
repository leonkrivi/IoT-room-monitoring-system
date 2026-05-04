export function makeDeviceKey(roomId, deviceId) {
  return `${roomId}::${deviceId}`;
}
