import { parseSensorStatusPayload } from "#src/mqtt/mqttPayloadParser.js";
import { makeDeviceKey } from "#src/utils/deviceKey.js";

const TAG = "[SensorStatusHandler]";

export function createSensorStatusHandler({ cache, persistence, tracker }) {
  return async function handleSensorStatusMessage(topicMeta, payload) {
    const sensorStatusPayload = parseSensorStatusPayload(payload);
    const receivedAt = new Date();

    const key = makeDeviceKey(topicMeta.roomId, topicMeta.deviceId);
    if (tracker.isStale(key, sensorStatusPayload.seq)) {
      console.warn(
        `${TAG} dropped stale sensor/status seq (${topicMeta.roomId}::${topicMeta.deviceId}) seq=${sensorStatusPayload.seq}`,
      );
      return;
    }

    tracker.remember(key, sensorStatusPayload.seq);

    const cachedSensorStatus = cache.getOrInitSensorStatus(
      topicMeta.roomId,
      topicMeta.deviceId,
    );
    const cachedConfig = cache.getOrInitDeviceConfig(
      topicMeta.roomId,
      topicMeta.deviceId,
    );
    const sensorStatusChanged =
      cachedSensorStatus !== sensorStatusPayload.sensor;
    const hbIntervalChanged =
      cachedConfig.hbIntervalMs !== sensorStatusPayload.hbIntervalMs;

    await persistence.storeSensorStatus({
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
      cache.setSensorStatus(
        topicMeta.roomId,
        topicMeta.deviceId,
        sensorStatusPayload.sensor,
      );
    }

    if (hbIntervalChanged) {
      cachedConfig.hbIntervalMs = sensorStatusPayload.hbIntervalMs;
    }

    console.log(
      `${TAG} validated sensor/status message (${topicMeta.roomId}::${topicMeta.deviceId}) seq=${sensorStatusPayload.seq} sensor=${sensorStatusPayload.sensor} hb_interval=${sensorStatusPayload.hbIntervalMs}ms`,
    );
  };
}
