const TAG = "[mqttPayloadParser]";

export function parseMqttPayload(rawPayload) {
  let parsed;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    throw new Error(`${TAG} payload must be valid JSON`);
  }

  const { room, device_id, seq, presence, motion } = parsed;

  if (
    !room ||
    !device_id ||
    !Number.isInteger(seq) ||
    seq < 0 ||
    (presence !== 0 && presence !== 1) ||
    (motion !== 0 && motion !== 1 && motion !== 2)
  ) {
    throw new Error(`${TAG} invalid payload structure or values`);
  }

  return {
    room: String(room),
    deviceId: String(device_id),
    seq,
    presence,
    motion,
  };
}
