import { Telegraf } from 'telegraf';
import { setupCommands } from './commands';
import express from 'express';
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bot.webhookCallback('/bot'));
bot.telegram.setWebhook(`${process.env.VERCEL_URL}/bot`);


setupCommands(bot);

app.get('/', (req: any, res: any) => {
  res.send('bot running');
});

app.listen(PORT, () => {
  console.log(`bot running on port ${PORT}`);
});

// bot.launch();
// console.log("Welcome to G7's bot on Telegram!");

// bot.telegram.setMyCommands([
//   { command: 'start', description: 'Iniciar el bot' },
// ]);
