import { parseConnectionStatusPayload } from "#src/mqtt/mqttPayloadParser.js";

const TAG = "[ConnectionStatusHandler]";

export function createConnectionStatusHandler({ persistence }) {
  return async function handleConnectionStatusMessage(topicMeta, payload) {
    const connectionPayload = parseConnectionStatusPayload(payload);
    const receivedAt = new Date();

    await persistence.storeConnectionStatus({
      roomId: topicMeta.roomId,
      deviceId: topicMeta.deviceId,
      connectionStatus: connectionPayload.status,
      receivedAt,
    });

    console.log(
      `${TAG} validated connection/status message (${topicMeta.roomId}::${topicMeta.deviceId}) status=${connectionPayload.status}`,
    );
  };
}
