import {
  dbGetRecentRoomStateHistory,
  dbGetRoomStateHistory,
} from "#src/database/influxRead.js";
import { sqliteFetch } from "#src/database/sqliteFetch.js";

const TAG = "[Data Fetcher]";

export function createDataFetcher() {
  async function getRecentRoomStateHistory(roomId, timeRangeDays, granularity) {
    const history = await dbGetRecentRoomStateHistory(
      roomId,
      timeRangeDays,
      granularity,
    );
    return history;
  }

  async function getRoomStateHistory(
    roomId,
    timeRangeStart,
    timeRangeEnd,
    granularity,
  ) {
    const history = await dbGetRoomStateHistory(
      roomId,
      timeRangeStart,
      timeRangeEnd,
      granularity,
    );
    return history;
  }

  return {
    getRecentRoomStateHistory,
    getRoomStateHistory,
    getAllRoomIds: sqliteFetch.dbGetAllRoomIds,
  };
}
