import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const TAG = "[SQLite Client]";

function initSQLite() {
  try {
    const sqlitePath = path.resolve(process.env.SQLITE_PATH);
    const dbDir = path.dirname(sqlitePath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new Database(sqlitePath);
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 3000");

    const schemaPath = new URL("./sqliteSchema.sql", import.meta.url);
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    db.exec(schemaSql);

    console.log(`${TAG} initialized at ${sqlitePath}`);
    return db;
  } catch (err) {
    console.error(`${TAG} CRITICAL FAILURE: ${err.message}`);
    throw err;
  }
}

const sqliteDbInstance = initSQLite();

export default sqliteDbInstance;
