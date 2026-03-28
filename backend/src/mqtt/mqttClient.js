import mqtt from "mqtt";
import { parseMqttPayload } from "#src/mqtt/mqttPayloadParser.js";
import { deriveRoomState } from "#src/messageProcessing/roomStateMachine.js";
import { SeqOrderingManager } from "#src/messageProcessing/seqOrderingManager.js";
import {
  dbStoreProcessedEvent,
  dbFlushInfluxWrites,
  dbCloseInfluxWriter,
} from "#src/database/influxWriter.js";

const MQTT_BROKER_URL = "mqtt://localhost:1883";
const TOPIC_RECEIVE = "/test/backend";

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

  client.subscribe(TOPIC_RECEIVE, (err) => {});
});

client.on("message", (topic, message) => {
  const rawPayload = message.toString();

  enqueueProcessing(async () => {
    await processIncomingMqttMessage(rawPayload);
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

async function processIncomingMqttMessage(rawPayload) {
  let parsed;
  try {
    // parse payload + pair with derived room state
    parsed = parseMqttPayload(rawPayload); // return format { room, deviceId, seq, presence, motion }
    const roomState = deriveRoomState(parsed);

    // return format: { accepted: bool, droppedReason: string|null, readyEvents: [] }
    const ingestResult = orderingManager.ingest(
      { ...parsed, roomState },
      Date.now(),
    );

    if (!ingestResult.accepted) {
      console.warn(
        `${TAG} dropped message (${parsed.room}::${parsed.deviceId}) seq=${parsed.seq}`,
      );
      console.warn(`=> reason: ${ingestResult.droppedReason}`);
      return;
    }

    await storeReadyEvents(ingestResult.readyEvents);
  } catch (err) {
    console.warn(
      `${TAG} dropped message (${parsed.room}::${parsed.deviceId}): seq=${parsed.seq}`,
    );
    console.warn(`=> reason: ${err.message}`);
  }
}

async function storeReadyEvents(readyEvents) {
  // event format: { room, deviceId, seq, presence, motion, roomState }
  for (const event of readyEvents) {
    const saved = await dbStoreProcessedEvent({
      ...event,
      processedAt: Date.now(),
    });

    if (saved) {
      console.log(
        `${TAG} stored (${event.room}::${event.deviceId}) seq=${event.seq} (p:${event.presence}, m:${event.motion}) state=${event.roomState}`,
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
