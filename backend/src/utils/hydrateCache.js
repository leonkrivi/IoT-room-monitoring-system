import { dataFetcher } from "#src/globals/dataFetcher.js";
import { deviceCache } from "#src/globals/cache.js";

const TAG = "[Hydrate Cache]";

export async function hydrateCacheOnStartup() {
  try {
    const statuses = await dataFetcher.getAllDeviceStatuses(); // returns [{ roomId, deviceId, sensorStatus, connectionStatus }, ...]
    const roomStates = await dataFetcher.getAllLastRoomState(); // returns [{ roomId, deviceId, roomState }, ...]
    const configs = await dataFetcher.getAllDeviceConfigs(); // returns [{ roomId, deviceId, hbIntervalMs, sensorRateMs }, ...]
    deviceCache.hydrateCache(statuses, roomStates, configs);
    console.log(
      `${TAG} Cache hydrated with:
      \t${statuses.length} device statuses
      \t${roomStates.length} room states
      \t${configs.length} device configs`,
    );
    return true;
  } catch (err) {
    console.error(`${TAG} Failed to hydrate cache:`, err.message);
    return false;
  }
}
