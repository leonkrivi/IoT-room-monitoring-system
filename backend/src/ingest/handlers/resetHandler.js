import { parseResetPayload } from "#src/mqtt/mqttPayloadParser.js";
import { makeDeviceKey } from "#src/ingest/deviceKey.js";

const TAG = "[ResetHandler]";

export function createResetHandler({
  orderingManager,
  cache,
  persistence,
  tracker,
}) {
  return async function handleResetMessage(topicMeta, payload) {
    const resetPayload = parseResetPayload(payload);
    const key = makeDeviceKey(topicMeta.roomId, topicMeta.deviceId);
    const receivedAt = new Date();

    orderingManager.resetDeviceState(
      topicMeta.roomId,
      topicMeta.deviceId,
      resetPayload.stateSeq,
    );
    tracker.resetToBefore(key, resetPayload.sensorSeq);

    const cachedConfig = cache.getOrInitConfig(
      topicMeta.roomId,
      topicMeta.deviceId,
    );
    cachedConfig.hbIntervalMs = resetPayload.hbRateMs;
    cachedConfig.sensorRateMs = resetPayload.sensorRateMs;

    await persistence.storeDeviceConfig({
      roomId: topicMeta.roomId,
      deviceId: topicMeta.deviceId,
      hbIntervalMs: resetPayload.hbRateMs,
      sensorRateMs: resetPayload.sensorRateMs,
      receivedAt,
    });

    cache.setStatus(topicMeta.roomId, topicMeta.deviceId, null);

    console.log(
      `${TAG} applied reset (${topicMeta.roomId}::${topicMeta.deviceId}) state_seq=${resetPayload.stateSeq} sensor_seq=${resetPayload.sensorSeq} hb_rate=${resetPayload.hbRateMs} sensor_rate=${resetPayload.sensorRateMs}`,
    );
  };
}
