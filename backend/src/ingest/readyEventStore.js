import { eventBus } from "#src/utils/eventEmitter.js";

const TAG = "[ReadyEventStore]";

export function createReadyEventStore({ cache, persistence }) {
  async function storeReadyEvents(readyEvents) {
    for (const event of readyEvents) {
      const cachedConfig = cache.getOrInitDeviceConfig(
        event.roomId,
        event.deviceId,
      );
      const sensorRateChanged =
        cachedConfig.sensorRateMs !== event.sensorRateMs;

      if (sensorRateChanged) {
        const stored = await persistence.storeSensorRate({
          roomId: event.roomId,
          deviceId: event.deviceId,
          sensorRateMs: event.sensorRateMs,
          receivedAt: new Date(),
          seq: event.seq,
        });

        if (stored) {
          cachedConfig.sensorRateMs = event.sensorRateMs;
        }
      }

      const saved = await persistence.storeProcessedRoomState({
        ...event,
        processedAt: Date.now(),
      });

      if (saved) {
        cache.setDeviceRoomState(event.roomId, event.deviceId, event.roomState);
        eventBus.emit("ws_broadcast", {
          type: "room_state_update",
          data: {
            roomId: event.roomId,
            deviceId: event.deviceId,
            roomState: event.roomState,
          },
        });
        console.log(
          `${TAG} stored (${event.roomId}::${event.deviceId}) seq=${event.seq} (p:${event.presence}, m:${event.motion}) state=${event.roomState}`,
        );
      }
    }

    if (readyEvents.length > 0) {
      await persistence.flushInfluxWrites();
    }
  }

  return {
    storeReadyEvents,
  };
}
