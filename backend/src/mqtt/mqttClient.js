import mqtt from "mqtt";
import { createMqttMessageProcessor } from "#src/mqtt/mqttMessageProcessor.js";
import { createProcessingQueue } from "#src/mqtt/processingQueue.js";
import {
  dbFlushInfluxWrites,
  dbCloseInfluxWriter,
} from "#src/database/influxWriter.js";
import { statusStore } from "#src/database/sqliteStore.js";

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const TOPIC_RECEIVE_PATTERNS = [
  "/room/+/device/+/room_state",
  "/room/+/device/+/sensor/status",
  "/room/+/device/+/connection/status",
  "/room/+/device/+/reset",
];

const TAG = "[MQTT Client]";
const EXPIRED_MESSAGES_FLUSH_INTERVAL_MS = 250;
const messageProcessor = createMqttMessageProcessor();
const { enqueue: enqueueProcessing } = createProcessingQueue({
  tag: TAG,
});

// ==================== MQTT Client Setup ====================

const client = mqtt.connect(MQTT_BROKER_URL);
export { client };

client.on("connect", () => {
  console.log(`${TAG} connected to broker at ` + MQTT_BROKER_URL);

  client.subscribe(TOPIC_RECEIVE_PATTERNS, (err) => {
    if (err) {
      console.error(`${TAG} failed to subscribe: ${err.message}`);
      return;
    }
    console.log(
      `${TAG} subscribed to: \n\t${TOPIC_RECEIVE_PATTERNS.join("\n\t")}`,
    );
  });
});

client.on("message", (topic, message) => {
  const rawPayload = message.toString();

  enqueueProcessing(async () => {
    await messageProcessor.processIncomingMqttMessage(topic, rawPayload);
  });
});

client.on("offline", () => {
  console.log(`${TAG} client disconnected`);
});

// ==================== periodic Force Flush Logic ====================

// flush expired messages for all devices to prevent messages from being stuck in the buffer indefinitely
// scheduled for every EXPIRED_MESSAGES_FLUSH_INTERVAL_MS miliseconds
const expiredBufferFlushTimer = setInterval(() => {
  enqueueProcessing(async () => {
    await messageProcessor.flushExpiredBuffers();
  });
}, EXPIRED_MESSAGES_FLUSH_INTERVAL_MS);

// ==================== Graceful Shutdown Logic ====================

export async function shutdownMqttPipeline() {
  clearInterval(expiredBufferFlushTimer);
  await dbFlushInfluxWrites();
  await statusStore.dbCloseSqliteStore();
  await dbCloseInfluxWriter();
}
