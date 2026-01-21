import { pool } from "../db/pg";
import { TimeFilter } from "../services/StatsService";

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
  static getDateFilter(filter: TimeFilter): string {
    switch (filter) {
      case "today":
        return "AND m.created_at >= CURRENT_DATE";
      case "week":
        return "AND m.created_at >= CURRENT_DATE - INTERVAL '7 days'";
      case "month":
        return "AND m.created_at >= CURRENT_DATE - INTERVAL '30 days'";
      case "all":
      default:
        return "";
    }
  }

  static async getTopUsers(
    chatId: number,
    filter: TimeFilter,
    limit: number = 10,
  ) {
    const dateFilter = this.getDateFilter(filter);

    const result = await pool.query(
      `SELECT 
        u.telegram_id as "telegramId",
        u.username,
        u.first_name as "firstName",
        COUNT(m.id) as "messageCount"
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.chat_id = $1 ${dateFilter}
      GROUP BY u.id, u.telegram_id, u.username, u.first_name
      ORDER BY "messageCount" DESC
      LIMIT $2`,
      [chatId, limit],
    );

    return result.rows;
  }

  static async getTotalCount(
    chatId: number,
    filter: TimeFilter,
  ): Promise<number> {
    const dateFilter = this.getDateFilter(filter);

    const result = await pool.query(
      `SELECT COUNT(*) as count
      FROM messages m
      WHERE m.chat_id = $1 ${dateFilter}`,
      [chatId],
    );

    return parseInt(result.rows[0].count);
  }

  static async getUniqueUsersCount(
    chatId: number,
    filter: TimeFilter,
  ): Promise<number> {
    const dateFilter = this.getDateFilter(filter);

    const result = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as count
      FROM messages m
      WHERE m.chat_id = $1 ${dateFilter}`,
      [chatId],
    );

    return parseInt(result.rows[0].count);
  }

  static async getUserMessageCount(
    chatId: number,
    userId: number,
    filter: TimeFilter,
  ): Promise<number> {
    const dateFilter = this.getDateFilter(filter);

    const result = await pool.query(
      `SELECT COUNT(*) as count
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.chat_id = $1 AND u.telegram_id = $2 ${dateFilter}`,
      [chatId, userId],
    );

    return parseInt(result.rows[0].count);
  }

  static async getUserRank(
    chatId: number,
    userId: number,
    filter: TimeFilter,
  ): Promise<number> {
    const dateFilter = this.getDateFilter(filter);

    const result = await pool.query(
      `WITH ranked AS (
        SELECT 
          u.telegram_id,
          COUNT(m.id) as msg_count,
          RANK() OVER (ORDER BY COUNT(m.id) DESC) as rank
        FROM messages m
        JOIN users u ON m.user_id = u.id
        WHERE m.chat_id = $1 ${dateFilter}
        GROUP BY u.telegram_id
      )
      SELECT rank FROM ranked WHERE telegram_id = $2`,
      [chatId, userId],
    );

    return result.rows[0]?.rank || 0;
  }
  static async getUsersWithMessages(
    chatId: number,
    filter: TimeFilter,
    limit: number = 10,
    offset: number = 0,
  ) {
    const dateFilter = this.getDateFilter(filter);

    const result = await pool.query(
      `SELECT 
      u.telegram_id as "telegramId",
      u.username,
      u.first_name as "firstName",
      COUNT(m.id) as "messageCount"
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.chat_id = $1 ${dateFilter}
    GROUP BY u.id, u.telegram_id, u.username, u.first_name
    ORDER BY "messageCount" DESC
    LIMIT $2 OFFSET $3`,
      [chatId, limit, offset],
    );

    return result.rows;
  }
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
}
