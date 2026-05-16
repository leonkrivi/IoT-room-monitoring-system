import { parseConnectionStatusPayload } from "#src/mqtt/mqttPayloadParser.js";
import { eventBus } from "#src/utils/eventEmitter.js";

const TAG = "[ConnectionStatusHandler]";

export function createConnectionStatusHandler({ cache, persistence }) {
  return async function handleConnectionStatusMessage(topicMeta, payload) {
    const connectionPayload = parseConnectionStatusPayload(payload);
    const receivedAt = new Date();

    await persistence.storeConnectionStatus({
      roomId: topicMeta.roomId,
      deviceId: topicMeta.deviceId,
      connectionStatus: connectionPayload.status,
      receivedAt,
    });

    cache.setDeviceConnection(
      topicMeta.roomId,
      topicMeta.deviceId,
      connectionPayload.status,
    );
    eventBus.emit("ws_broadcast", {
      type: "connection_update",
      data: {
        roomId: topicMeta.roomId,
        deviceId: topicMeta.deviceId,
        status: connectionPayload.status,
      },
    });

    if (connectionPayload.status === "offline") {
      cache.setSensorStatus(topicMeta.roomId, topicMeta.deviceId, "unknown");
      eventBus.emit("ws_broadcast", {
        type: "sensor_update",
        data: {
          roomId: topicMeta.roomId,
          deviceId: topicMeta.deviceId,
          status: "unknown",
        },
      });
    }

    console.log(
      `${TAG} validated connection/status message (${topicMeta.roomId}::${topicMeta.deviceId}) status=${connectionPayload.status}`,
    );
  };
}
