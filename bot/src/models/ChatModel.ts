import { pool } from "../db/pg";

export class ChatModel {
  static async findOrCreate(data: { telegramId: number; title?: string }) {
    const res = await pool.query(
      `
      INSERT INTO chats (telegram_id, title)
      VALUES ($1, $2)
      ON CONFLICT (telegram_id)
      DO UPDATE SET title = EXCLUDED.title
      RETURNING *
      `,
      [data.telegramId, data.title],
    );

    return res.rows[0];
  }
}
