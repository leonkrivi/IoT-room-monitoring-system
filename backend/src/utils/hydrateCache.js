import { dataFetcher } from "#src/globals/dataFetcher.js";
import { deviceCache } from "#src/globals/cache.js";

export async function hydrateCacheOnStartup() {
  try {
    const statuses = await dataFetcher.getAllDeviceStatuses(); // returns [{ roomId, deviceId, sensorStatus, connectionStatus }, ...]
    const roomStates = await dataFetcher.getAllLastRoomState(); // returns [{ roomId, deviceId, roomState }, ...]
    deviceCache.hydrateCache(statuses, roomStates);
    console.log(
      `Cache hydrated with ${statuses.length} device statuses and ${roomStates.length} room states.`,
    );
    return true;
  } catch (err) {
    console.error("Failed to hydrate cache:", err.message);
    return false;
  }
}
