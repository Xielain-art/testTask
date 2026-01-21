import { Telegraf, Markup } from "telegraf";
import { initDb } from "./db/init";
import { UserModel } from "./models/UserModel";
import { ChatModel } from "./models/ChatModel";
import { MessageModel } from "./models/MessageModel";
import { StatsService, TimeFilter } from "./services/StatsService";
import { CacheService } from "./services/CasheService";

async function start() {
  await initDb();
  await CacheService.init();

  const bot = new Telegraf(process.env.BOT_TOKEN!);

  // Сохранение сообщений
  bot.hears(/^[^/].*/, async (ctx) => {
    const user = await UserModel.findOrCreate({
      telegramId: ctx.from.id,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
    });

    const chat = await ChatModel.findOrCreate({
      telegramId: ctx.chat.id,
      title: "title" in ctx.chat ? ctx.chat.title : undefined,
    });

    await MessageModel.create({
      chatId: chat.id,
      userId: user.id,
      text: ctx.message.text,
    });

    console.log("Message saved");
  });

  // Команда /stats - общая статистика
  bot.command("stats", async (ctx) => {
    const chat = await ChatModel.findOrCreate({
      telegramId: ctx.chat.id,
      title: "title" in ctx.chat ? ctx.chat.title : undefined,
    });

    await showMainMenu(ctx, chat.id);
  });

  // Главное меню статистики
  async function showMainMenu(ctx: any, chatId: number) {
    const message = "📊 Статистика чата\n\nВыберите действие:";

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "📈 Общая статистика",
          `general_stats:${chatId}`,
        ),
      ],
      [
        Markup.button.callback(
          "👤 Статистика пользователя",
          `user_list:${chatId}:all:1`,
        ),
      ],
    ]);

    if (ctx.update.callback_query) {
      try {
        await ctx.editMessageText(message, keyboard);
      } catch (error: any) {
        if (error.response?.error_code === 400) {
          await ctx.answerCbQuery("Уже в главном меню");
        }
      }
    } else {
      await ctx.reply(message, keyboard);
    }
  }

  // Обработка общей статистики
  bot.action(/^general_stats:(\d+)$/, async (ctx) => {
    const chatId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    await showGeneralStats(ctx, chatId, "all");
  });

  // Обработка фильтров общей статистики
  bot.action(/^stats:(.+):(\d+)$/, async (ctx) => {
    const filter = ctx.match[1] as TimeFilter;
    const chatId = parseInt(ctx.match[2]);

    await ctx.answerCbQuery();
    await showGeneralStats(ctx, chatId, filter);
  });

  // Показ общей статистики
  async function showGeneralStats(
    ctx: any,
    chatId: number,
    filter: TimeFilter,
  ) {
    const stats = await StatsService.getChatStats(chatId, filter);

    const filterNames = {
      today: "сегодня",
      week: "неделю",
      month: "месяц",
      all: "все время",
    };

    let message = `📊 Общая статистика чата за ${filterNames[filter]}:\n\n`;

    if (stats.topUsers.length === 0) {
      message += "Нет сообщений за этот период\n";
    } else {
      stats.topUsers.forEach((user, index) => {
        const name = user.username
          ? `@${user.username}`
          : user.firstName || "Без имени";
        const msgText = declension(user.messageCount, [
          "сообщение",
          "сообщения",
          "сообщений",
        ]);
        message += `${index + 1}. ${name} — ${user.messageCount} ${msgText}\n`;
      });

      message += `\n📈 Всего: ${stats.totalMessages} ${declension(stats.totalMessages, ["сообщение", "сообщения", "сообщений"])} от ${stats.totalUsers} ${declension(stats.totalUsers, ["пользователя", "пользователей", "пользователей"])}`;
    }

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          filter === "today" ? "• Сегодня" : "Сегодня",
          `stats:today:${chatId}`,
        ),
        Markup.button.callback(
          filter === "week" ? "• Неделя" : "Неделя",
          `stats:week:${chatId}`,
        ),
      ],
      [
        Markup.button.callback(
          filter === "month" ? "• Месяц" : "Месяц",
          `stats:month:${chatId}`,
        ),
        Markup.button.callback(
          filter === "all" ? "• Все время" : "Все время",
          `stats:all:${chatId}`,
        ),
      ],
      [Markup.button.callback("« Назад", `back_to_menu:${chatId}`)],
    ]);

    try {
      await ctx.editMessageText(message, keyboard);
    } catch (error: any) {
      if (
        error.response?.error_code === 400 &&
        error.response?.description?.includes("message is not modified")
      ) {
        await ctx.answerCbQuery("Этот период уже выбран");
      } else {
        throw error;
      }
    }
  }

  // Список пользователей с пагинацией
  bot.action(/^user_list:(\d+):(.+):(\d+)$/, async (ctx) => {
    const chatId = parseInt(ctx.match[1]);
    const filter = ctx.match[2] as TimeFilter;
    const page = parseInt(ctx.match[3]);

    await ctx.answerCbQuery();
    await showUserList(ctx, chatId, filter, page);
  });

  async function showUserList(
    ctx: any,
    chatId: number,
    filter: TimeFilter,
    page: number = 1,
  ) {
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const users = await MessageModel.getUsersWithMessages(
      chatId,
      filter,
      pageSize,
      offset,
    );
    const totalUsers = await MessageModel.getUniqueUsersCount(chatId, filter);
    const totalPages = Math.ceil(totalUsers / pageSize);

    const filterNames = {
      today: "сегодня",
      week: "за неделю",
      month: "за месяц",
      all: "за все время",
    };

    let message = `👥 Выберите пользователя (${filterNames[filter]}):\n`;
    message += `Страница ${page} из ${totalPages || 1}\n\n`;

    if (users.length === 0) {
      message += "Нет пользователей за этот период";
    }

    const buttons = users.map((user) => {
      const name = user.username
        ? `@${user.username}`
        : user.firstName || "Без имени";
      return [
        Markup.button.callback(
          `${name} (${user.messageCount})`,
          `user_stats:${chatId}:${user.telegramId}:${filter}`,
        ),
      ];
    });

    // Кнопки пагинации
    const paginationButtons = [];
    if (page > 1) {
      paginationButtons.push(
        Markup.button.callback(
          "⬅️ Назад",
          `user_list:${chatId}:${filter}:${page - 1}`,
        ),
      );
    }
    if (page < totalPages) {
      paginationButtons.push(
        Markup.button.callback(
          "Вперед ➡️",
          `user_list:${chatId}:${filter}:${page + 1}`,
        ),
      );
    }

    if (paginationButtons.length > 0) {
      buttons.push(paginationButtons);
    }

    // Фильтры времени
    buttons.push([
      Markup.button.callback(
        filter === "today" ? "• Сегодня" : "Сегодня",
        `user_list:${chatId}:today:1`,
      ),
      Markup.button.callback(
        filter === "week" ? "• Неделя" : "Неделя",
        `user_list:${chatId}:week:1`,
      ),
    ]);
    buttons.push([
      Markup.button.callback(
        filter === "month" ? "• Месяц" : "Месяц",
        `user_list:${chatId}:month:1`,
      ),
      Markup.button.callback(
        filter === "all" ? "• Все время" : "Все время",
        `user_list:${chatId}:all:1`,
      ),
    ]);

    buttons.push([
      Markup.button.callback("« Назад в меню", `back_to_menu:${chatId}`),
    ]);

    const keyboard = Markup.inlineKeyboard(buttons);

    try {
      await ctx.editMessageText(message, keyboard);
    } catch (error: any) {
      if (
        error.response?.error_code === 400 &&
        error.response?.description?.includes("message is not modified")
      ) {
        await ctx.answerCbQuery("Уже на этой странице");
      } else {
        throw error;
      }
    }
  }

  // Статистика конкретного пользователя
  bot.action(/^user_stats:(\d+):(\d+):(.+)$/, async (ctx) => {
    const chatId = parseInt(ctx.match[1]);
    const userId = parseInt(ctx.match[2]);
    const filter = ctx.match[3] as TimeFilter;

    await ctx.answerCbQuery();
    await showUserStats(ctx, chatId, userId, filter);
  });

  async function showUserStats(
    ctx: any,
    chatId: number,
    userId: number,
    filter: TimeFilter,
  ) {
    try {
      const stats = await StatsService.getUserStats(chatId, userId, filter);

      const filterNames = {
        today: "сегодня",
        week: "за неделю",
        month: "за месяц",
        all: "за все время",
      };

      const name = stats.user.username
        ? `@${stats.user.username}`
        : stats.user.firstName || "Без имени";

      let message = `👤 Статистика пользователя ${name}\n`;
      message += `Период: ${filterNames[filter]}\n\n`;
      message += `📊 Сообщений: ${stats.messageCount}\n`;
      message += `🏆 Место в рейтинге: ${stats.rank}\n`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            filter === "today" ? "• Сегодня" : "Сегодня",
            `user_stats:${chatId}:${userId}:today`,
          ),
          Markup.button.callback(
            filter === "week" ? "• Неделя" : "Неделя",
            `user_stats:${chatId}:${userId}:week`,
          ),
        ],
        [
          Markup.button.callback(
            filter === "month" ? "• Месяц" : "Месяц",
            `user_stats:${chatId}:${userId}:month`,
          ),
          Markup.button.callback(
            filter === "all" ? "• Все время" : "Все время",
            `user_stats:${chatId}:${userId}:all`,
          ),
        ],
        [
          Markup.button.callback(
            "« К списку",
            `user_list:${chatId}:${filter}:1`,
          ),
        ],
        [Markup.button.callback("« В меню", `back_to_menu:${chatId}`)],
      ]);

      try {
        await ctx.editMessageText(message, keyboard);
      } catch (error: any) {
        if (
          error.response?.error_code === 400 &&
          error.response?.description?.includes("message is not modified")
        ) {
          await ctx.answerCbQuery("Этот период уже выбран");
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error showing user stats:", error);
      await ctx.editMessageText(
        "Ошибка при получении статистики пользователя",
        Markup.inlineKeyboard([
          [Markup.button.callback("« Назад", `back_to_menu:${chatId}`)],
        ]),
      );
    }
  }

  // Возврат в главное меню
  bot.action(/^back_to_menu:(\d+)$/, async (ctx) => {
    const chatId = parseInt(ctx.match[1]);
    await ctx.answerCbQuery();
    await showMainMenu(ctx, chatId);
  });

  function declension(number: number, words: [string, string, string]): string {
    const cases = [2, 0, 1, 1, 1, 2];
    return words[
      number % 100 > 4 && number % 100 < 20
        ? 2
        : cases[Math.min(number % 10, 5)]
    ];
  }

  await bot.launch();
  console.log("Bot started");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

start();
