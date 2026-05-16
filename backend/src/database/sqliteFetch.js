import { z } from "zod";
import { SQLFetch } from "../utils/sqliteQueries.js";
import sqliteDbInstance from "./sqliteClient.js";

const TAG = "[SQLite Fetch]";

// Zod schemas
const IdSchema = z
  .union([z.string(), z.number()])
  .transform((val) => String(val).padStart(2, "0"));

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

  async dbGetAllIdPairs() {
    const stmt = this.#stmts.getAllDevices;
    const rows = stmt.all();
    return rows.map((row) => ({
      roomId: IdSchema.parse(row.room_id),
      deviceId: IdSchema.parse(row.device_id),
    }));
  }

  async dbGetAllRoomIds() {
    const stmt = this.#stmts.getAllRoomIds;
    const rows = stmt.all();
    return rows.map((row) => IdSchema.parse(row.room_id));
  }

  async dbGetAllDeviceIdsForRoom(roomId) {
    const stmt = this.#stmts.getAllDeviceIdsForRoom;
    const rows = stmt.all(roomId);
    return rows.map((row) => IdSchema.parse(row.device_id));
  }

  async dbGetAllDeviceStatuses() {
    const stmt = this.#stmts.getAllDeviceStatuses;
    const rows = stmt.all();
    return rows.map((row) => ({
      roomId: IdSchema.parse(row.room_id),
      deviceId: IdSchema.parse(row.device_id),
      sensorStatus: row.sensor_status,
      connectionStatus: row.connection_status,
    }));
  }
}

export const sqliteFetch = new SqliteFetch();
