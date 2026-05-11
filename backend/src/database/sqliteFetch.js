import { z } from "zod";
import { SQLFetch } from "./sqliteQueries.js";
import sqliteDbInstance from "./sqliteClient.js";

const TAG = "[SQLite Fetch]";

// Zod schemas
const DeviceIdSchema = z.coerce.number().int();

class SqliteFetch {
  #db;
  #stmts = {};

  constructor() {
    this.#db = sqliteDbInstance;
    this.#prepareStatements();
  }

  #prepareStatements() {
    for (const [key, sql] of Object.entries(SQLFetch)) {
      this.#stmts[key] = this.#db.prepare(sql);
    }
  }

  async dbGetAllRoomIds() {
    const stmt = this.#stmts.getAllRoomIds;
    const rows = stmt.all();
    return rows.map((row) => row.room_id);
  }

  async dbGetAllDeviceIdsForRoom(roomId) {
    const stmt = this.#stmts.getAllDeviceIdsForRoom;
    const rows = stmt.all(roomId);
    return rows.map((row) => DeviceIdSchema.parse(row.device_id));
  }
}

export const sqliteFetch = new SqliteFetch();
