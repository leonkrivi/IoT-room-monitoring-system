import {
  parseJsonPayload,
  parseMqttTopic,
} from "#src/mqtt/mqttPayloadParser.js";
import { SeqOrderingManager } from "#src/services/seqOrderingManager.js";
import { deviceCache } from "#src/globals/instances.js";
import { createLastSeqTracker } from "#src/ingest/lastSeqTracker.js";
import { createPersistence } from "#src/services/persistence.js";
import { createReadyEventStore } from "#src/ingest/readyEventStore.js";
import { createRoomStateHandler } from "#src/ingest/handlers/roomStateHandler.js";
import { createSensorStatusHandler } from "#src/ingest/handlers/sensorStatusHandler.js";
import { createConnectionStatusHandler } from "#src/ingest/handlers/connectionStatusHandler.js";
import { createResetHandler } from "#src/ingest/handlers/resetHandler.js";

const TAG = "[MQTT MessageProcessor]";

export function createMqttMessageProcessor({
  maxBufferSize = 3,
  flushWindowMs = 1000,
} = {}) {
  const orderingManager = new SeqOrderingManager({
    maxBufferSize,
    flushWindowMs,
  });
  const sensorStatusSeqTracker = createLastSeqTracker();
  const persistence = createPersistence();
  const readyEventStore = createReadyEventStore({
    cache: deviceCache,
    persistence,
  });

  const handlers = {
    room_state: createRoomStateHandler({
      orderingManager,
      persistence,
      readyEventStore,
    }),
    sensor_status: createSensorStatusHandler({
      cache: deviceCache,
      persistence,
      tracker: sensorStatusSeqTracker,
    }),
    connection_status: createConnectionStatusHandler({
      persistence,
    }),
    reset: createResetHandler({
      orderingManager,
      cache: deviceCache,
      persistence,
      tracker: sensorStatusSeqTracker,
    }),
  };

  async function processIncomingMqttMessage(topic, rawPayload) {
    try {
      const topicMeta = parseMqttTopic(topic);
      const payload = parseJsonPayload(rawPayload);

      if (topicMeta.type === "unknown") return;

      const handler = handlers[topicMeta.type];
      if (handler) {
        await handler(topicMeta, payload);
      }
    } catch (err) {
      console.warn(`${TAG} dropped message on topic=${topic}`);
      console.warn(`=> reason: ${err.message}`);
    }
  }

  async function flushExpiredBuffers() {
    const readyEvents = orderingManager.flushExpired(Date.now());
    await readyEventStore.storeReadyEvents(readyEvents);
  }

  return {
    processIncomingMqttMessage,
    flushExpiredBuffers,
  };
}
