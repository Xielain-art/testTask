import { Telegraf } from "telegraf";
import { initDb } from "./db/init";
import { UserModel } from "./models/UserModel";
import { ChatModel } from "./models/ChatModel";
import { MessageModel } from "./models/MessageModel";

async function start() {
  await initDb();

  const bot = new Telegraf(process.env.BOT_TOKEN!);

  bot.on("text", async (ctx) => {
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

  await bot.launch();
  console.log("Bot started");
}

start();
