import { GoogleGenAI } from "@google/genai";
import { AnalyzeResult, ErrorResult, Message } from "@/types/analyze.types";

export class AnalyzeService {
  private static ai =
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0
      ? new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        })
      : null;

  static async analyzeUser(params: {
    messages: Message[];
  }): Promise<AnalyzeResult | ErrorResult> {
    const { messages } = params;

    if (!this.ai) {
      return {
        ok: false,
        error: "Gemini API key is not configured",
      };
    }

    if (messages.length < 5) {
      return {
        ok: false,
        error: "Слишком мало сообщений для анализа",
      };
    }

    const messagesWithTime = messages.map((m) => {
      return `[${m.created_at}] ${m.text}`;
    });

    const prompt = this.buildPrompt(messagesWithTime);

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    const analysisText = response.text;

    if (!analysisText) {
      return {
        ok: false,
        error: "Не удалось получить анализ",
      };
    }

    return {
      ok: true,
      analysis: analysisText,
      messagesCount: messagesWithTime.length,
    };
  }

  private static buildPrompt(messages: string[]) {
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
