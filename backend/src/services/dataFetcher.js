import {
  dbGetRoomStateHistoryRecent,
  dbGetRoomStateHistoryPeriod,
  dbGetLastRoomStateForDevice,
} from "#src/database/influxRead.js";
import { sqliteFetch } from "#src/database/sqliteFetch.js";

const TAG = "[Data Fetcher]";

export function createDataFetcher() {
  async function getAllLastRoomState() {
    try {
      const ids = await sqliteFetch.dbGetAllIdPairs();

      const results = [];
      for (const { roomId, deviceId } of ids) {
        const key = `${roomId}::${deviceId}`;
        results.push(await dbGetLastRoomStateForDevice(roomId, deviceId));
      }
      return results;
    } catch (err) {
      console.error(TAG, "Error fetching last room states:", err.message);
      throw err;
    }
  }

  return {
    getRoomStateHistoryRecent: dbGetRoomStateHistoryRecent,
    getRoomStateHistoryPeriod: dbGetRoomStateHistoryPeriod,
    getAllLastRoomState: getAllLastRoomState,
    getAllIdPairs: () => sqliteFetch.dbGetAllIdPairs(),
    getAllRoomIds: () => sqliteFetch.dbGetAllRoomIds(),
    getAllDeviceStatuses: () => sqliteFetch.dbGetAllDeviceStatuses(),
  };
}
