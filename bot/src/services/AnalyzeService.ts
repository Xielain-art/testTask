import { GoogleGenAI } from "@google/genai";
import { MessageModel } from "../models/MessageModel";

export class AnalyzeService {
  private static ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  static async analyzeUser(params: {
    chatId: number;
    telegramUserId: number;
    username: string;
    limit?: number;
  }) {
    const { chatId, telegramUserId, username, limit = 80 } = params;

    // 1. Получаем последние сообщения пользователя
    const messages = await MessageModel.getLastMessagesByUser(
      chatId,
      telegramUserId,
      limit,
    );

    if (messages.length < 5) {
      return {
        ok: false,
        error: "Слишком мало сообщений для анализа",
      };
    }

    const messagesWithTime = messages.map((m) => {
      return `[${m.created_at}] ${m.text}`;
    });

    console.log(messagesWithTime);

    // 2. Собираем промпт
    const prompt = this.buildPrompt(username, messagesWithTime);

    // 3. Запрос в Gemini
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const analysisText = response.text;

    return {
      ok: true,
      analysis: analysisText,
      messagesCount: messagesWithTime.length,
    };
  }

  private static buildPrompt(username: string, messages: string[]) {
    return `
Ниже приведены сообщения пользователя из чата.
Каждое сообщение имеет формат:

[YYYY-MM-DD HH:MM] текст сообщения

Проанализируй:
1. Общий стиль общения
2. Эмоциональный тон
3. Темы, которые чаще всего обсуждает
4. Уровень токсичности / агрессии
5. Активность по времени суток:
   - в какие часы он наиболее активен
   - скорее "сова" или "жаворонок"
   - есть ли ночная активность
6. Сделай краткий психологический портрет.

Сообщения:
${messages.map((m, i) => `${i + 1}. ${m}`).join("\n")}
`;
  }
}
