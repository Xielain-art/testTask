import { describe, it, expect, vi, beforeEach } from "vitest";
import { StatsService } from "../src/services/StatsService";
import { MessageModel } from "../src/models/MessageModel";
import { UserModel } from "../src/models/UserModel";
import { CacheService } from "../src/services/CasheService";

vi.mock("../src/models/MessageModel", () => ({
  MessageModel: {
    getTopUsers: vi.fn(),
    getTotalCount: vi.fn(),
    getUniqueUsersCount: vi.fn(),
    getUserMessageCount: vi.fn(),
    getUserRank: vi.fn(),
    getMostActiveWeekdayForChat: vi.fn(),
    getMostActiveWeekdayForUser: vi.fn(),
  },
}));

vi.mock("../src/models/UserModel", () => ({
  UserModel: {
    findByTelegramId: vi.fn(),
  },
}));

vi.mock("../src/services/CasheService", () => ({
  CacheService: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe("StatsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getChatStats", () => {
    it("should return cached stats if available", async () => {
      const mockStats = {
        topUsers: [
          {
            telegramId: 123,
            username: "testuser",
            firstName: "Test",
            messageCount: 100,
          },
        ],
        totalMessages: 500,
        totalUsers: 10,
      };

      vi.mocked(CacheService.get).mockResolvedValue(mockStats);

      const result = await StatsService.getChatStats(1, "all");

      expect(result).toEqual(mockStats);
      expect(CacheService.get).toHaveBeenCalledWith("stats:1:all");
      expect(MessageModel.getTopUsers).not.toHaveBeenCalled();
    });

    it("should fetch and cache stats when cache is empty", async () => {
      const mockTopUsers = [
        {
          telegramId: 123,
          username: "user1",
          firstName: "User",
          messageCount: 50,
        },
      ];

      vi.mocked(CacheService.get).mockResolvedValue(null);
      vi.mocked(MessageModel.getTopUsers).mockResolvedValue(mockTopUsers);
      vi.mocked(MessageModel.getTotalCount).mockResolvedValue(200);
      vi.mocked(MessageModel.getUniqueUsersCount).mockResolvedValue(5);

      const result = await StatsService.getChatStats(1, "week");

      expect(result).toEqual({
        topUsers: mockTopUsers,
        totalMessages: 200,
        totalUsers: 5,
      });
      expect(CacheService.set).toHaveBeenCalledWith("stats:1:week", {
        topUsers: mockTopUsers,
        totalMessages: 200,
        totalUsers: 5,
      });
    });
  });

  describe("getUserStats", () => {
    it("should return cached user stats if available", async () => {
      const mockUserStats = {
        user: {
          id: 1,
          telegramId: 123,
          username: "testuser",
          firstName: "Test",
        },
        messageCount: 50,
        rank: 3,
      };

      vi.mocked(CacheService.get).mockResolvedValue(mockUserStats);

      const result = await StatsService.getUserStats(1, 123, "all");

      expect(result).toEqual(mockUserStats);
      expect(CacheService.get).toHaveBeenCalledWith("user_stats:1:123:all");
    });

    it("should throw error if user not found", async () => {
      vi.mocked(CacheService.get).mockResolvedValue(null);
      vi.mocked(UserModel.findByTelegramId).mockResolvedValue(null);

      await expect(StatsService.getUserStats(1, 999, "all")).rejects.toThrow(
        "User not found",
      );
    });

    it("should fetch and cache user stats when cache is empty", async () => {
      const mockUser = {
        id: 1,
        telegram_id: 123,
        username: "testuser",
        first_name: "Test",
      };

      vi.mocked(CacheService.get).mockResolvedValue(null);
      vi.mocked(UserModel.findByTelegramId).mockResolvedValue(mockUser);
      vi.mocked(MessageModel.getUserMessageCount).mockResolvedValue(25);
      vi.mocked(MessageModel.getUserRank).mockResolvedValue(5);

      const result = await StatsService.getUserStats(1, 123, "month");

      expect(result).toEqual({
        user: {
          id: 1,
          telegramId: 123,
          username: "testuser",
          firstName: "Test",
        },
        messageCount: 25,
        rank: 5,
      });
      expect(CacheService.set).toHaveBeenCalled();
    });
  });

  describe("getMostActiveWeekdayForChat", () => {
    it("should return cached weekday data if available", async () => {
      const mockWeekday = { dow: 1, messageCount: 150 };

      vi.mocked(CacheService.get).mockResolvedValue(mockWeekday);

      const result = await StatsService.getMostActiveWeekdayForChat(1, "week");

      expect(result).toEqual(mockWeekday);
      expect(CacheService.get).toHaveBeenCalledWith("activity:chat:1:week");
    });

    it("should fetch and cache weekday data when cache is empty", async () => {
      const mockWeekday = { dow: 3, messageCount: 200 };

      vi.mocked(CacheService.get).mockResolvedValue(null);
      vi.mocked(MessageModel.getMostActiveWeekdayForChat).mockResolvedValue(
        mockWeekday,
      );

      const result = await StatsService.getMostActiveWeekdayForChat(1, "all");

      expect(result).toEqual(mockWeekday);
      expect(CacheService.set).toHaveBeenCalledWith(
        "activity:chat:1:all",
        mockWeekday,
      );
    });
  });
});
