const TAG = "[mqttPayloadParser]";

const TOPIC_TYPES = {
  ROOM_STATE: "room_state",
  SENSOR_STATUS: "sensor_status",
  CONNECTION_STATUS: "connection_status",
  RESET: "reset",
  UNKNOWN: "unknown",
};

const TOPIC_PATTERNS = [
  {
    type: TOPIC_TYPES.ROOM_STATE,
    regex: /^\/room\/([^/]+)\/device\/([^/]+)\/room_state$/,
  },
  {
    type: TOPIC_TYPES.SENSOR_STATUS,
    regex: /^\/room\/([^/]+)\/device\/([^/]+)\/sensor\/status$/,
  },
  {
    type: TOPIC_TYPES.CONNECTION_STATUS,
    regex: /^\/room\/([^/]+)\/device\/([^/]+)\/connection\/status$/,
  },
  {
    type: TOPIC_TYPES.RESET,
    regex: /^\/room\/([^/]+)\/device\/([^/]+)\/reset$/,
  },
];

function ensureNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(
      `${TAG} invalid ${fieldName}: expected non-negative integer`,
    );
  }
}

function ensureEnumString(value, fieldName, allowedValues) {
  if (typeof value !== "string") {
    throw new Error(`${TAG} invalid ${fieldName}: expected string`);
  }

  const normalized = value.toLowerCase();
  if (!allowedValues.includes(normalized)) {
    throw new Error(
      `${TAG} invalid ${fieldName}: expected one of ${allowedValues.join(", ")}`,
    );
  }

  return normalized;
}

export function parseJsonPayload(rawPayload) {
  let parsed;

  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    throw new Error(`${TAG} payload must be valid JSON`);
  }

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error(`${TAG} payload must be a JSON object`);
  }

  return parsed;
}

export function parseMqttTopic(topic) {
  if (typeof topic !== "string") {
    return {
      type: TOPIC_TYPES.UNKNOWN,
      streamKey: String(topic),
    };
  }

  for (const { type, regex } of TOPIC_PATTERNS) {
    const match = topic.match(regex);
    if (match) {
      const [, roomId, deviceId] = match;
      return { type, roomId, deviceId, streamKey: topic };
    }
  }

  return {
    type: TOPIC_TYPES.UNKNOWN,
    streamKey: topic,
  };
}

export function parseRoomStatePayload(payload) {
  const { seq, presence, motion, sensor_rate: sensorRate } = payload;

  ensureNonNegativeInteger(seq, "seq");
  ensureNonNegativeInteger(sensorRate, "sensor_rate");

  if (presence !== 0 && presence !== 1) {
    throw new Error(`${TAG} invalid presence: expected 0 or 1`);
  }

  if (motion !== 0 && motion !== 1 && motion !== 2) {
    throw new Error(`${TAG} invalid motion: expected 0, 1, or 2`);
  }

  return {
    seq,
    presence,
    motion,
    sensorRateMs: sensorRate,
  };
}

export function parseSensorStatusPayload(payload) {
  const { seq, sensor, hb_interval: hbInterval } = payload;

  ensureNonNegativeInteger(seq, "seq");
  ensureNonNegativeInteger(hbInterval, "hb_interval");

  return {
    seq,
    sensor: ensureEnumString(sensor, "sensor", ["alive", "dead"]),
    hbIntervalMs: hbInterval,
  };
}

export function parseConnectionStatusPayload(payload) {
  return {
    status: ensureEnumString(payload.status, "status", ["online", "offline"]),
  };
}

export function parseResetPayload(payload) {
  const {
    hb_rate: hbRate,
    sensor_rate: sensorRate,
    state_seq: stateSeq,
    sensor_seq: sensorSeq,
  } = payload;

  ensureNonNegativeInteger(hbRate, "hb_rate");
  ensureNonNegativeInteger(sensorRate, "sensor_rate");
  ensureNonNegativeInteger(stateSeq, "state_seq");
  ensureNonNegativeInteger(sensorSeq, "sensor_seq");

  return {
    hbRateMs: hbRate,
    sensorRateMs: sensorRate,
    stateSeq,
    sensorSeq,
  };
}
