import Database from "better-sqlite3";
import type { EducationConfig } from "kit_models";

export class SqliteEducationStore {
  private _db: Database.Database;

  constructor(dbPath: string) {
    this._db = new Database(dbPath);
    this._db.exec(`
      CREATE TABLE IF NOT EXISTS education_configs (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
  }

  getAll(): EducationConfig[] {
    return this._db
      .prepare("SELECT key, value FROM education_configs")
      .all() as EducationConfig[];
  }

  add(config: EducationConfig): void {
    this._db
      .prepare(
        `INSERT INTO education_configs (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(config.key, config.value);
  }

  remove(key: string): void {
    this._db.prepare("DELETE FROM education_configs WHERE key = ?").run(key);
  }
}
