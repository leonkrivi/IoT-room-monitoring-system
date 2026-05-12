import { z } from "zod";
import { SQLStore } from "./sqliteQueries.js";
import sqliteDbInstance from "./sqliteClient.js";

const TAG = "[SQLite Store]";

// Zod schemas
const RoomIdSchema = z.union([z.string(), z.number()]).transform((val) => String(val).padStart(2, "0"));
const DateSchema = z.preprocess((arg) => {
  if (arg instanceof Date) return arg;
  if (typeof arg === "string" || typeof arg === "number") return new Date(arg);
  return arg;
}, z.date());

const BasePayload = z.object({
  roomId: RoomIdSchema,
  deviceId: RoomIdSchema,
  receivedAt: DateSchema.transform((d) => d.toISOString()),
});

class SqliteStore {
  #db;
  #stmts = {};
  #transactions = {};

  constructor() {
    this.#db = sqliteDbInstance;
    this.#prepareStatements();
    this.#prepareTransactions();
  }

  #prepareStatements() {
    for (const [key, sql] of Object.entries(SQLStore)) {
      this.#stmts[key] = this.#db.prepare(sql);
    }
  }

  #prepareTransactions() {
    this.#transactions.storeSensorStatus = this.#db.transaction((data) => {
      this.#stmts.upsertDeviceSeen.run(
        data.roomId,
        data.deviceId,
        data.receivedAt,
        data.receivedAt,
      );

      if (data.sensorStatus !== undefined) {
        this.#stmts.upsertSensorStatus.run(
          data.roomId,
          data.deviceId,
          data.sensorStatus,
        );
      }
      if (data.hbIntervalMs !== undefined) {
        this.#stmts.upsertHbInterval.run(
          data.roomId,
          data.deviceId,
          data.hbIntervalMs,
        );
      }
      return true;
    });

    this.#transactions.storeDeviceConfig = this.#db.transaction((data) => {
      this.#stmts.upsertDeviceSeen.run(
        data.roomId,
        data.deviceId,
        data.receivedAt,
        data.receivedAt,
      );
      this.#stmts.upsertDeviceConfig.run(
        data.roomId,
        data.deviceId,
        data.hbIntervalMs,
        data.sensorRateMs,
      );
      return true;
    });

    this.#transactions.storeConnectionStatus = this.#db.transaction((data) => {
      this.#stmts.upsertDeviceSeen.run(
        data.roomId,
        data.deviceId,
        data.receivedAt,
        data.receivedAt,
      );
      this.#stmts.upsertConnectionStatus.run(
        data.roomId,
        data.deviceId,
        data.connectionStatus,
      );
      return true;
    });

    this.#transactions.storeSensorRate = this.#db.transaction((data) => {
      this.#stmts.upsertDeviceSeen.run(
        data.roomId,
        data.deviceId,
        data.receivedAt,
        data.receivedAt,
      );
      this.#stmts.upsertSensorRate.run(
        data.roomId,
        data.deviceId,
        data.sensorRateMs,
      );
      return true;
    });
  }

  // --- PUBLIC API ---

  async dbStoreDeviceSeen(payload) {
    const data = BasePayload.parse(payload);
    return this.#stmts.upsertDeviceSeen.run(
      data.roomId,
      data.deviceId,
      data.receivedAt,
      data.receivedAt,
    );
  }

  async dbStoreSensorStatus(payload) {
    const schema = BasePayload.extend({
      sensorStatus: z.string().optional(),
      hbIntervalMs: z.number().int().optional(),
    });
    const data = schema.parse(payload);
    return this.#transactions.storeSensorStatus(data);
  }

  async dbStoreConnectionStatus(payload) {
    const schema = BasePayload.extend({
      connectionStatus: z.string(),
    });
    const data = schema.parse(payload);
    return this.#transactions.storeConnectionStatus(data);
  }

  async dbStoreSensorRate(payload) {
    const schema = BasePayload.extend({
      sensorRateMs: z.number().int(),
    });
    const data = schema.parse(payload);
    return this.#transactions.storeSensorRate(data);
  }

  async dbStoreDeviceConfig(payload) {
    const schema = BasePayload.extend({
      hbIntervalMs: z.number().int(),
      sensorRateMs: z.number().int(),
    });
    const data = schema.parse(payload);
    return this.#transactions.storeDeviceConfig(data);
  }

  async dbCloseSqliteStore() {
    if (this.#db) {
      this.#db.close();
      console.log(`${TAG} connection closed.`);
    }
  }
}

export const sqliteStore = new SqliteStore();
