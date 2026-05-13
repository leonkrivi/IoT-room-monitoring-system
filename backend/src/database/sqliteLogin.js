import sqliteDbInstance from "./sqliteClient.js";

class SqliteLogin {
  #db;
  #stmts = {};

  constructor() {
    this.#db = sqliteDbInstance;
    this.#prepareStatements();
  }

  #prepareStatements() {
    this.#stmts.createUser = this.#db.prepare(
      "INSERT INTO user (id, password_hash) VALUES (1, ?)",
    );
    this.#stmts.getUser = this.#db.prepare("SELECT * FROM user WHERE id = 1");
    this.#stmts.createSession = this.#db.prepare(
      "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, 1, ?)",
    );
    this.#stmts.getSessionById = this.#db.prepare(
      "SELECT * FROM sessions WHERE id = ?",
    );
    this.#stmts.updateSessionExpiration = this.#db.prepare(
      "UPDATE sessions SET expires_at = ? WHERE id = ?",
    );
    this.#stmts.deleteSessionById = this.#db.prepare(
      "DELETE FROM sessions WHERE id = ?",
    );
    this.#stmts.getPasswordHash = this.#db.prepare(
      "SELECT password_hash FROM user WHERE id = 1",
    );
    this.#stmts.setPasswordHash = this.#db.prepare(
      "UPDATE user SET password_hash = ? WHERE id = 1",
    );
  }

  async createUser(passwordHash) {
    return this.#stmts.createUser.run(passwordHash);
  }

  async getUser() {
    return this.#stmts.getUser.get();
  }

  async createSession(sessionId, expiresAt) {
    return this.#stmts.createSession.run(sessionId, expiresAt);
  }

  async getSessionById(sessionId) {
    return this.#stmts.getSessionById.get(sessionId);
  }

  async updateSessionExpiration(sessionId, newExpiresAt) {
    return this.#stmts.updateSessionExpiration.run(newExpiresAt, sessionId);
  }

  async deleteSessionById(sessionId) {
    return this.#stmts.deleteSessionById.run(sessionId);
  }

  async getPasswordHash() {
    const row = this.#stmts.getPasswordHash.get();
    return row ? row.password_hash : null;
  }

  async setPasswordHash(passwordHash) {
    return this.#stmts.setPasswordHash.run(passwordHash);
  }
}

export const sqliteLogin = new SqliteLogin();
