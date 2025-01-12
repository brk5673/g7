import { Telegraf } from 'telegraf';
import { setupCommands } from './commands';
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

setupCommands(bot);

bot.launch();
console.log("Welcome to G7's bot on Telegram!");

bot.telegram.setMyCommands([
  { command: 'start', description: 'Iniciar el bot' },
  { command: 'budget', description: 'Obtener un presupuesto' },
  { command: 'stock', description: 'Ver el stock de productos' },
]);
