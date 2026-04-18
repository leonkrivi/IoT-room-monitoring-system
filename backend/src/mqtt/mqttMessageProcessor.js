import {
  parseConnectionStatusPayload,
  parseJsonPayload,
  parseMqttTopic,
  parseResetPayload,
  parseRoomStatePayload,
  parseSensorStatusPayload,
} from "#src/mqtt/mqttPayloadParser.js";
import { deriveRoomState } from "#src/messageProcessing/roomState.js";
import { SeqOrderingManager } from "#src/messageProcessing/seqOrderingManager.js";
import {
  dbStoreProcessedEvent,
  dbFlushInfluxWrites,
} from "#src/database/influxWriter.js";
import {
  dbStoreDeviceConfig,
  dbStoreConnectionStatus,
  dbStoreSensorRate,
  dbStoreSensorStatus,
} from "#src/database/sqliteStatusStore.js";

export function createMqttMessageProcessor({
  tag,
  maxBufferSize = 3,
  flushWindowMs = 1000,
}) {
  const orderingManager = new SeqOrderingManager({
    maxBufferSize,
    flushWindowMs,
  });

  const sensorStatusSeqByDevice = new Map();
  const deviceConfigByDevice = new Map();
  const deviceStatusByDevice = new Map();

  function getDeviceKey(roomId, deviceId) {
    return `${roomId}::${deviceId}`;
  }

  function isStaleSensorStatusSeq(roomId, deviceId, seq) {
    const key = getDeviceKey(roomId, deviceId);
    const lastSeq = sensorStatusSeqByDevice.get(key);
    return lastSeq !== undefined && seq <= lastSeq;
  }

  function rememberSensorStatusSeq(roomId, deviceId, seq) {
    const key = getDeviceKey(roomId, deviceId);
    sensorStatusSeqByDevice.set(key, seq);
  }

  function getOrInitDeviceConfig(roomId, deviceId) {
    const key = getDeviceKey(roomId, deviceId);
    const cached = deviceConfigByDevice.get(key);
    if (cached) {
      return cached;
    }

    const hydrated = {
      hbIntervalMs: null,
      sensorRateMs: null,
    };
    deviceConfigByDevice.set(key, hydrated);
    return hydrated;
  }

  function getOrInitDeviceStatus(roomId, deviceId) {
    const key = getDeviceKey(roomId, deviceId);
    const cached = deviceStatusByDevice.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const hydrated = null;
    deviceStatusByDevice.set(key, hydrated);
    return hydrated;
  }

  async function processIncomingMqttMessage(topic, rawPayload) {
    try {
      const topicMeta = parseMqttTopic(topic);
      const payload = parseJsonPayload(rawPayload);

      if (topicMeta.type === "unknown") {
        console.warn(`${tag} ignored unsupported topic: ${topic}`);
        return;
      }

      if (topicMeta.type === "room_state") {
        await handleRoomStateMessage(topicMeta, payload);
        return;
      }

      if (topicMeta.type === "sensor_status") {
        await handleSensorStatusMessage(topicMeta, payload);
        return;
      }

      if (topicMeta.type === "connection_status") {
        await handleConnectionStatusMessage(topicMeta, payload);
        return;
      }

      if (topicMeta.type === "reset") {
        await handleResetMessage(topicMeta, payload);
      }
    } catch (err) {
      console.warn(`${tag} dropped message on topic=${topic}`);
      console.warn(`=> reason: ${err.message}`);
    }
  }

  async function handleRoomStateMessage(topicMeta, payload) {
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
        `${tag} dropped room_state message (${topicMeta.roomId}::${topicMeta.deviceId}) seq=${roomStatePayload.seq}`,
      );
      console.warn(`=> reason: ${ingestResult.droppedReason}`);
      return;
    }

    await storeReadyEvents(ingestResult.readyEvents);
  }

  async function handleSensorStatusMessage(topicMeta, payload) {
    const sensorStatusPayload = parseSensorStatusPayload(payload);

    if (
      isStaleSensorStatusSeq(
        topicMeta.roomId,
        topicMeta.deviceId,
        sensorStatusPayload.seq,
      )
    ) {
      console.warn(
        `${tag} dropped stale sensor/status seq (${topicMeta.roomId}::${topicMeta.deviceId}) seq=${sensorStatusPayload.seq}`,
      );
      return;
    }

    rememberSensorStatusSeq(
      topicMeta.roomId,
      topicMeta.deviceId,
      sensorStatusPayload.seq,
    );

    const receivedAt = new Date();
    const cachedSensorStatus = getOrInitDeviceStatus(
      topicMeta.roomId,
      topicMeta.deviceId,
    );
    const cachedConfig = getOrInitDeviceConfig(
      topicMeta.roomId,
      topicMeta.deviceId,
    );
    const sensorStatusChanged =
      cachedSensorStatus !== sensorStatusPayload.sensor;
    const hbIntervalChanged =
      cachedConfig.hbIntervalMs !== sensorStatusPayload.hbIntervalMs;

    const stored = await dbStoreSensorStatus({
      roomId: topicMeta.roomId,
      deviceId: topicMeta.deviceId,
      sensorStatus: sensorStatusChanged
        ? sensorStatusPayload.sensor
        : undefined,
      hbIntervalMs: hbIntervalChanged
        ? sensorStatusPayload.hbIntervalMs
        : undefined,
      receivedAt,
    });

    if (sensorStatusChanged) {
      const key = getDeviceKey(topicMeta.roomId, topicMeta.deviceId);
      deviceStatusByDevice.set(key, sensorStatusPayload.sensor);
    }

    if (hbIntervalChanged) {
      cachedConfig.hbIntervalMs = sensorStatusPayload.hbIntervalMs;
    }

    if (!stored) {
      console.warn(
        `${tag} skipped SQLite sensor/status write (${topicMeta.roomId}::${topicMeta.deviceId})`,
      );
    }

    console.log(
      `${tag} validated sensor/status message (${topicMeta.roomId}::${topicMeta.deviceId}) seq=${sensorStatusPayload.seq} sensor=${sensorStatusPayload.sensor} hb_interval=${sensorStatusPayload.hbIntervalMs}ms`,
    );
  }

  async function handleConnectionStatusMessage(topicMeta, payload) {
    const connectionPayload = parseConnectionStatusPayload(payload);

    await dbStoreConnectionStatus({
      roomId: topicMeta.roomId,
      deviceId: topicMeta.deviceId,
      connectionStatus: connectionPayload.status,
      receivedAt: new Date(),
    });

    console.log(
      `${tag} validated connection/status message (${topicMeta.roomId}::${topicMeta.deviceId}) status=${connectionPayload.status}`,
    );
  }

  async function handleResetMessage(topicMeta, payload) {
    const resetPayload = parseResetPayload(payload);
    const key = getDeviceKey(topicMeta.roomId, topicMeta.deviceId);

    orderingManager.resetDeviceState(
      topicMeta.roomId,
      topicMeta.deviceId,
      resetPayload.stateSeq,
    );
    sensorStatusSeqByDevice.set(key, resetPayload.sensorSeq);

    const cachedConfig = getOrInitDeviceConfig(
      topicMeta.roomId,
      topicMeta.deviceId,
    );
    cachedConfig.hbIntervalMs = resetPayload.hbRateMs;
    cachedConfig.sensorRateMs = resetPayload.sensorRateMs;

    const stored = await dbStoreDeviceConfig({
      roomId: topicMeta.roomId,
      deviceId: topicMeta.deviceId,
      hbIntervalMs: resetPayload.hbRateMs,
      sensorRateMs: resetPayload.sensorRateMs,
      receivedAt: new Date(),
    });

    if (!stored) {
      console.warn(
        `${tag} skipped SQLite reset config write (${topicMeta.roomId}::${topicMeta.deviceId})`,
      );
    }

    deviceStatusByDevice.set(key, null);

    console.log(
      `${tag} applied reset (${topicMeta.roomId}::${topicMeta.deviceId}) state_seq=${resetPayload.stateSeq} sensor_seq=${resetPayload.sensorSeq} hb_rate=${resetPayload.hbRateMs} sensor_rate=${resetPayload.sensorRateMs}`,
    );
  }

  async function storeReadyEvents(readyEvents) {
    // event format: { roomId, deviceId, seq, presence, motion, sensorRateMs, roomState }
    for (const event of readyEvents) {
      const cachedConfig = getOrInitDeviceConfig(event.roomId, event.deviceId);
      const sensorRateChanged =
        cachedConfig.sensorRateMs !== event.sensorRateMs;

      if (sensorRateChanged) {
        const stored = await dbStoreSensorRate({
          roomId: event.roomId,
          deviceId: event.deviceId,
          sensorRateMs: event.sensorRateMs,
          receivedAt: new Date(),
        });

        if (!stored) {
          console.warn(
            `${tag} skipped SQLite sensor_rate write (${event.roomId}::${event.deviceId}) seq=${event.seq}`,
          );
        } else {
          cachedConfig.sensorRateMs = event.sensorRateMs;
        }
      }

      const saved = await dbStoreProcessedEvent({
        ...event,
        processedAt: Date.now(),
      });

      if (saved) {
        console.log(
          `${tag} stored (${event.roomId}::${event.deviceId}) seq=${event.seq} (p:${event.presence}, m:${event.motion}) state=${event.roomState}`,
        );
      }
    }

    if (readyEvents.length > 0) {
      await dbFlushInfluxWrites(); // moment when db Write occurs
    }
  }

  async function flushExpiredBuffers() {
    const readyEvents = orderingManager.flushExpired(Date.now());
    await storeReadyEvents(readyEvents);
  }

  return {
    processIncomingMqttMessage,
    flushExpiredBuffers,
  };
}
