import { pool } from "../lib/db/pg";

export class MessageModel {
  static async getLastMessagesByUser(
    chatId: number,
    telegramUserId: number,
    limit: number,
  ) {
    const result = await pool.query(
      `
    SELECT m.text, m.created_at
    FROM messages m
    JOIN users u ON u.id = m.user_id
    WHERE m.chat_id = $1
      AND u.telegram_id = $2
      AND m.text IS NOT NULL
    ORDER BY m.created_at DESC
    LIMIT $3
    `,
      [chatId, telegramUserId, limit],
    );

    return result.rows;
  }

  static async getLastMessagesByUsername(username: string, limit: number) {
    const result = await pool.query(
      `
    SELECT m.text, m.created_at
    FROM messages m
    JOIN users u ON u.id = m.user_id
    WHERE u.username = $1
      AND m.text IS NOT NULL
    ORDER BY m.created_at DESC
    LIMIT $2
    `,
      [username, limit],
    );

    return result.rows;
  }
}
