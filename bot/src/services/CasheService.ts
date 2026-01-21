import { createClient } from "redis";

export class CacheService {
  private static client: ReturnType<typeof createClient>;
  private static ttl = parseInt(process.env.CACHE_TTL || "1200"); // 20 минут по умолчанию

  static async init() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://redis:6379",
    });

    await this.client.connect();
    console.log("Redis connected");
  }

  static async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async set(key: string, value: any): Promise<void> {
    await this.client.setEx(key, this.ttl, JSON.stringify(value));
  }

  static async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
