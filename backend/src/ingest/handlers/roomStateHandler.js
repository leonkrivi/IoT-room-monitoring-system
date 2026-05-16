import { parseRoomStatePayload } from "#src/mqtt/mqttPayloadParser.js";
import { deriveRoomState } from "#src/ingest/roomState.js";

const TAG = "[RoomStateHandler]";

export function createRoomStateHandler({
  orderingManager,
  persistence,
  readyEventStore,
}) {
  return async function handleRoomStateMessage(topicMeta, payload) {
    const roomStatePayload = parseRoomStatePayload(payload);
    const roomState = deriveRoomState(roomStatePayload);
    const receivedAt = new Date();

    await persistence.markDeviceSeen(
      topicMeta.roomId,
      topicMeta.deviceId,
      receivedAt,
    );

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

    await readyEventStore.storeReadyEvents(ingestResult.readyEvents);
  };
}
