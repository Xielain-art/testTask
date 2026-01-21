import { pool } from "./pg";

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT UNIQUE,
      username TEXT,
      first_name TEXT
    );

    CREATE TABLE IF NOT EXISTS chats (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT UNIQUE,
      title TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      chat_id INTEGER REFERENCES chats(id),
      user_id INTEGER REFERENCES users(id),
      text TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("DB initialized");
}
