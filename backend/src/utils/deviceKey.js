export function makeDeviceKey(roomId, deviceId) {
  const rId = String(roomId).padStart(2, "0");
  const dId = String(deviceId).padStart(2, "0");
  return `${rId}::${dId}`;
}
