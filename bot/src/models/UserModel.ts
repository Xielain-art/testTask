import { pool } from "../db/pg";

export class UserModel {
  static async findOrCreate(data: {
    telegramId: number;
    username?: string;
    firstName?: string;
  }) {
    const res = await pool.query(
      `
      INSERT INTO users (telegram_id, username, first_name)
      VALUES ($1, $2, $3)
      ON CONFLICT (telegram_id)
      DO UPDATE SET username = EXCLUDED.username
      RETURNING *
      `,
      [data.telegramId, data.username, data.firstName],
    );

    return res.rows[0];
  }
  static async findByTelegramId(telegramId: number) {
    const result = await pool.query(
      "SELECT id, telegram_id, username, first_name FROM users WHERE telegram_id = $1",
      [telegramId],
    );
    return result.rows[0] || null;
  }
}
