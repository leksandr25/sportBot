from aiogram import Bot, Dispatcher, types
import asyncio
import os

TOKEN = os.getenv("BOT_TOKEN")

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message()
async def echo(message: types.Message):
    await message.answer("Ви написали: " + message.text)

async def handle_update(update: dict):
    """
    Функція обробки апдейтів для Vercel
    """
    await dp.feed_raw_update(bot, update)
