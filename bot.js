import { Telegraf, Markup } from 'telegraf';

const TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(TOKEN);


const sessions = {};

// Команда /event
bot.command('event', async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  sessions[userId] = {
    step: 1,
    data: {},
    chatId,
  };

  return ctx.reply('🔹 Введіть назву заходу:');
});

// Обробка повідомлень адміна по кроках
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;

  if (!sessions[userId]) return;

  const session = sessions[userId];
  const text = ctx.message.text;

  // Крок 1 — Назва
  if (session.step === 1) {
    session.data.title = text;
    session.step = 2;
    return ctx.reply('🕒 Введіть дату та час (наприклад: "Завтра 18:00")');
  }

  // Крок 2 — Дата і час
  if (session.step === 2) {
    session.data.datetime = text;
    session.step = 3;
    return ctx.reply('📍 Введіть опис (необов’язково) або напишіть "-":');
  }

  // Крок 3 — Опис
  if (session.step === 3) {
    session.data.description = text === '-' ? '' : text;
    session.step = 4;

    return ctx.reply(
      `Підтвердити подію?\n\n` +
      `📌 *${session.data.title}*\n` +
      `🕒 ${session.data.datetime}\n` +
      (session.data.description ? `📍 ${session.data.description}\n` : '') ,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('✅ Підтвердити', 'CONFIRM_EVENT'),
          Markup.button.callback('❌ Скасувати', 'CANCEL_EVENT'),
        ])
      }
    );
  }
});

// Підтвердження події
bot.action('CONFIRM_EVENT', async (ctx) => {
  await ctx.answerCbQuery();

  const userId = ctx.from.id;
  const session = sessions[userId];
  if (!session) return;

  const { title, datetime, description } = session.data;

  // Публікація події в групі
  await ctx.telegram.sendMessage(
    session.chatId,
    `🎯 *${title}*\n🕒 ${datetime}\n${description ? `📍 ${description}\n` : ''}\n\nХто буде?`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        Markup.button.callback('👍 Буду', `JOIN_${userId}`),
        Markup.button.callback('👎 Не буду', `NO_${userId}`)
      ])
    }
  );

  delete sessions[userId];

  return ctx.editMessageText('Подію опубліковано ✅');
});

// Скасування
bot.action('CANCEL_EVENT', async (ctx) => {
  await ctx.answerCbQuery();
  delete sessions[ctx.from.id];
  return ctx.editMessageText('❌ Подію скасовано');
});

// WEBHOOK handler for Vercel
export default async function handler(req, res) {
  try {
    await bot.handleUpdate(req.body);
  } catch (e) {
    console.error('Webhook error:', e);
  }
  res.status(200).send('OK');
}

export const config = {
  api: {
    bodyParser: false,
  },
};