import { z } from "zod";

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

// ====================== Validation Schemas ====================

const RoomStateSchema = z
  .object({
    seq: z.number().int().nonnegative(),
    presence: z.union([z.literal(0), z.literal(1)]),
    motion: z.union([z.literal(0), z.literal(1), z.literal(2)]),
    sensor_rate: z.number().int().nonnegative(),
  })
  .transform((data) => ({
    seq: data.seq,
    presence: data.presence,
    motion: data.motion,
    sensorRateMs: data.sensor_rate,
  }));

const SensorStatusSchema = z
  .object({
    seq: z.number().int().nonnegative(),
    sensor: z.preprocess(
      (val) => (typeof val === "string" ? val.toLowerCase() : val),
      z.enum(["alive", "dead"]),
    ),
    hb_interval: z.number().int().nonnegative(),
  })
  .transform((data) => ({
    seq: data.seq,
    sensor: data.sensor,
    hbIntervalMs: data.hb_interval,
  }));

const ConnectionStatusSchema = z
  .object({
    status: z.preprocess(
      (val) => (typeof val === "string" ? val.toLowerCase() : val),
      z.enum(["online", "offline"]),
    ),
  })
  .transform((data) => ({
    status: data.status,
  }));

const ResetSchema = z
  .object({
    hb_rate: z.number().int().nonnegative(),
    sensor_rate: z.number().int().nonnegative(),
    state_seq: z.number().int().nonnegative(),
    sensor_seq: z.number().int().nonnegative(),
  })
  .transform((data) => ({
    hbRateMs: data.hb_rate,
    sensorRateMs: data.sensor_rate,
    stateSeq: data.state_seq,
    sensorSeq: data.sensor_seq,
  }));

// ==================== Exported Functions ====================

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
  try {
    return RoomStateSchema.parse(payload);
  } catch (err) {
    throw new Error(`${TAG} validation failed for room_state: ${err.message}`);
  }
}

export function parseSensorStatusPayload(payload) {
  try {
    return SensorStatusSchema.parse(payload);
  } catch (err) {
    throw new Error(
      `${TAG} validation failed for sensor_status: ${err.message}`,
    );
  }
}

export function parseConnectionStatusPayload(payload) {
  try {
    return ConnectionStatusSchema.parse(payload);
  } catch (err) {
    throw new Error(
      `${TAG} validation failed for connection_status: ${err.message}`,
    );
  }
}

export function parseResetPayload(payload) {
  try {
    return ResetSchema.parse(payload);
  } catch (err) {
    throw new Error(`${TAG} validation failed for reset: ${err.message}`);
  }
}
