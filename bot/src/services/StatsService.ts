import { MessageModel } from "../models/MessageModel";
import { UserModel } from "../models/UserModel";
import { CacheService } from "./CasheService";

export interface TopUser {
  telegramId: number;
  username?: string;
  firstName?: string;
  messageCount: number;
}

export interface ChatStats {
  topUsers: TopUser[];
  totalMessages: number;
  totalUsers: number;
}

export interface UserStats {
  user: {
    id: number;
    telegramId: number;
    username?: string;
    firstName?: string;
  };
  messageCount: number;
  rank: number;
}

export interface MostActiveWeekday {
  dow: number; // 0=Sunday..6=Saturday (Postgres EXTRACT(DOW))
  messageCount: number;
}

export type TimeFilter = "today" | "week" | "month" | "all";

export class StatsService {
  static async getChatStats(
    chatId: number,
    filter: TimeFilter = "all",
  ): Promise<ChatStats> {
    const cacheKey = `stats:${chatId}:${filter}`;

    const cached = await CacheService.get<ChatStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const topUsers = await MessageModel.getTopUsers(chatId, filter, 10);
    const totalMessages = await MessageModel.getTotalCount(chatId, filter);
    const totalUsers = await MessageModel.getUniqueUsersCount(chatId, filter);

    const stats: ChatStats = {
      topUsers,
      totalMessages,
      totalUsers,
    };

    await CacheService.set(cacheKey, stats);

    return stats;
  }

  static async getUserStats(
    chatId: number,
    userId: number,
    filter: TimeFilter = "all",
  ): Promise<UserStats> {
    const cacheKey = `user_stats:${chatId}:${userId}:${filter}`;

    const cached = await CacheService.get<UserStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await UserModel.findByTelegramId(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const messageCount = await MessageModel.getUserMessageCount(
      chatId,
      userId,
      filter,
    );
    const rank = await MessageModel.getUserRank(chatId, userId, filter);

    const stats: UserStats = {
      user: {
        id: user.id,
        telegramId: user.telegram_id || user.telegramId,
        username: user.username,
        firstName: user.first_name || user.firstName,
      },
      messageCount,
      rank,
    };

    await CacheService.set(cacheKey, stats);

    return stats;
  }

  static async getMostActiveWeekdayForChat(
    chatId: number,
    filter: TimeFilter = "all",
  ): Promise<MostActiveWeekday | null> {
    const cacheKey = `activity:chat:${chatId}:${filter}`;

    const cached = await CacheService.get<MostActiveWeekday | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await MessageModel.getMostActiveWeekdayForChat(chatId, filter);
    await CacheService.set(cacheKey, result);
    return result;
  }

  static async getMostActiveWeekdayForUser(
    chatId: number,
    telegramUserId: number,
    filter: TimeFilter = "all",
  ): Promise<MostActiveWeekday | null> {
    const cacheKey = `activity:user:${chatId}:${telegramUserId}:${filter}`;

    const cached = await CacheService.get<MostActiveWeekday | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    const result = await MessageModel.getMostActiveWeekdayForUser(
      chatId,
      telegramUserId,
      filter,
    );
    await CacheService.set(cacheKey, result);
    return result;
  }
}
