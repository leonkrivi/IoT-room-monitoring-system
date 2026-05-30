import { parseResetPayload } from "#src/mqtt/mqttPayloadParser.js";
import { makeDeviceKey } from "#src/utils/deviceKey.js";
import { eventBus } from "#src/utils/eventEmitter.js";

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

    await persistence.storeDeviceConfig({
      roomId: topicMeta.roomId,
      deviceId: topicMeta.deviceId,
      hbIntervalMs: resetPayload.hbRateMs,
      sensorRateMs: resetPayload.sensorRateMs,
      receivedAt,
    });

    cache.setDeviceConfig(topicMeta.roomId, topicMeta.deviceId, {
      hbIntervalMs: resetPayload.hbRateMs,
      sensorRateMs: resetPayload.sensorRateMs,
    });
    eventBus.emit("ws_broadcast", {
      type: "device_config_update",
      data: {
        roomId: topicMeta.roomId,
        deviceId: topicMeta.deviceId,
        hbIntervalMs: resetPayload.hbRateMs,
        sensorRateMs: resetPayload.sensorRateMs,
      },
    });

    cache.setSensorStatus(topicMeta.roomId, topicMeta.deviceId, "unknown");
    eventBus.emit("ws_broadcast", {
      type: "sensor_update",
      data: {
        roomId: topicMeta.roomId,
        deviceId: topicMeta.deviceId,
        status: "unknown",
      },
    });

    console.log(
      `${TAG} applied reset (${topicMeta.roomId}::${topicMeta.deviceId}) state_seq=${resetPayload.stateSeq} sensor_seq=${resetPayload.sensorSeq} hb_rate=${resetPayload.hbRateMs} sensor_rate=${resetPayload.sensorRateMs}`,
    );
  };
}
