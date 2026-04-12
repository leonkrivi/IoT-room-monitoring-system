import mqtt from "mqtt";
import {
  parseConnectionStatusPayload,
  parseJsonPayload,
  parseMqttTopic,
  parseRoomStatePayload,
  parseSensorStatusPayload,
} from "#src/mqtt/mqttPayloadParser.js";
import { deriveRoomState } from "#src/messageProcessing/roomStateMachine.js";
import { SeqOrderingManager } from "#src/messageProcessing/seqOrderingManager.js";
import {
  dbStoreProcessedEvent,
  dbFlushInfluxWrites,
  dbCloseInfluxWriter,
} from "#src/database/influxWriter.js";

const MQTT_BROKER_URL = "mqtt://localhost:1883";
const TOPIC_RECEIVE_PATTERNS = [
  "/room/+/device/+/room_state",
  "/room/+/device/+/sensor/status",
  "/room/+/device/+/connection/status",
];

const TAG = "[MQTT Client]";
const orderingManager = new SeqOrderingManager({
  maxBufferSize: 3,
  flushWindowMs: 1000,
});
const EXPIRED_MESSAGES_FLUSH_INTERVAL_MS = 250;

// ==================== MQTT Client Setup ====================

export const client = mqtt.connect(MQTT_BROKER_URL);

client.on("connect", () => {
  console.log(`${TAG} connected to broker at ` + MQTT_BROKER_URL);

  client.subscribe(TOPIC_RECEIVE_PATTERNS, (err) => {
    if (err) {
      console.error(`${TAG} failed to subscribe: ${err.message}`);
      return;
    }

    console.log(`${TAG} subscribed to: ${TOPIC_RECEIVE_PATTERNS.join(", ")}`);
  });
});

client.on("message", (topic, message) => {
  const rawPayload = message.toString();

  enqueueProcessing(async () => {
    await processIncomingMqttMessage(topic, rawPayload);
  });
});

client.on("offline", () => {
  console.log(`${TAG} client disconnected`);
});

export function publishMessage(topic, payload, options = {}) {
  return new Promise((resolve, reject) => {
    if (!client.connected)
      return reject(new Error("MQTT client not connected"));
    client.publish(topic, payload, options, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ==================== Message Processing Logic ====================

let processingChain = Promise.resolve();

// ensures that message processing happens sequentially in the order they were received by the MQTT client
function enqueueProcessing(job) {
  processingChain = processingChain
    .then(() => job())
    .catch((err) => {
      console.error(`${TAG} processing error: ${err.message}`);
    });

  return processingChain;
}

async function processIncomingMqttMessage(topic, rawPayload) {
  try {
    const topicMeta = parseMqttTopic(topic);
    const payload = parseJsonPayload(rawPayload);

    if (topicMeta.type === "unknown") {
      console.warn(`${TAG} ignored unsupported topic: ${topic}`);
      return;
    }

    if (topicMeta.type === "room_state") {
      const roomStatePayload = parseRoomStatePayload(payload);
      const roomState = deriveRoomState(roomStatePayload);

      // return format: { accepted: bool, droppedReason: string|null, readyEvents: [] }
      const ingestResult = orderingManager.ingest(
        {
          roomId: topicMeta.roomId,
          deviceId: topicMeta.deviceId,
          ...roomStatePayload,
          roomState,
        },
        Date.now(),
      );

      if (!ingestResult.accepted) {
        console.warn(
          `${TAG} dropped room_state message (${topicMeta.roomId}::${topicMeta.deviceId}) seq=${roomStatePayload.seq}`,
        );
        console.warn(`=> reason: ${ingestResult.droppedReason}`);
        return;
      }

      await storeReadyEvents(ingestResult.readyEvents);
      return;
    }

    if (topicMeta.type === "sensor_status") {
      const sensorStatusPayload = parseSensorStatusPayload(payload);
      console.log(
        `${TAG} validated sensor/status message (${topicMeta.roomId}::${topicMeta.deviceId}) seq=${sensorStatusPayload.seq} sensor=${sensorStatusPayload.sensor} hb_interval=${sensorStatusPayload.hbIntervalMs}ms`,
      );
      return;
    }

    if (topicMeta.type === "connection_status") {
      const connectionPayload = parseConnectionStatusPayload(payload);
      console.log(
        `${TAG} validated connection/status message (${topicMeta.roomId}::${topicMeta.deviceId}) status=${connectionPayload.status}`,
      );
      return;
    }
  } catch (err) {
    console.warn(`${TAG} dropped message on topic=${topic}`);
    console.warn(`=> reason: ${err.message}`);
  }
}

async function storeReadyEvents(readyEvents) {
  // event format: { roomId, deviceId, seq, presence, motion, sensorRateMs, roomState }
  for (const event of readyEvents) {
    const saved = await dbStoreProcessedEvent({
      ...event,
      processedAt: Date.now(),
    });

    if (saved) {
      console.log(
        `${TAG} stored (${event.roomId}::${event.deviceId}) seq=${event.seq} (p:${event.presence}, m:${event.motion}) state=${event.roomState}`,
      );
    }
  }

  if (readyEvents.length > 0) {
    await dbFlushInfluxWrites(); // moment when db Write occurs
  }
}

// ==================== periodic Force Flush Logic ====================

async function flushExpiredBuffers() {
  const readyEvents = orderingManager.flushExpired(Date.now());
  await storeReadyEvents(readyEvents);
}

// flush expired messages for all devices to prevent messages from being stuck in the buffer indefinitely
// scheduled for every EXPIRED_MESSAGES_FLUSH_INTERVAL_MS miliseconds
const expiredBufferFlushTimer = setInterval(() => {
  enqueueProcessing(async () => {
    await flushExpiredBuffers();
  });
}, EXPIRED_MESSAGES_FLUSH_INTERVAL_MS);

// ==================== Graceful Shutdown Logic ====================

export async function shutdownMqttPipeline() {
  clearInterval(expiredBufferFlushTimer);
  await processingChain;
  await dbFlushInfluxWrites();
  await dbCloseInfluxWriter();
}
