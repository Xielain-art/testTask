import { pool } from "../db/pg";

export class MessageModel {
  static async create(data: { chatId: number; userId: number; text: string }) {
    await pool.query(
      `
      INSERT INTO messages (chat_id, user_id, text)
      VALUES ($1, $2, $3)
      `,
      [data.chatId, data.userId, data.text],
    );
  }
}
