
import { Telegraf } from "telegraf";
import { handleBudget , handleStock } from "./functions";
require('dotenv').config();
const TELEGRAM_BOT_TOKEN : string | undefined = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const credentials = require('./credentials.json');



let awaitingCommand : any;
bot.telegram.setMyCommands([
  { command: 'start', description: 'Iniciar el bot' },
  { command: 'budget', description: 'Obtener un presupuesto' },
  { command: 'stock', description: 'Ver el stock de productos' },
]);

bot.command('start', (ctx) => {
  const username = ctx.from.username;
  console.log(`Comando de @${username} => ${ctx.message.text}`);
  ctx.reply('¡Hola!\nSoy el bot de G7, creado para obtener presupuesto y consultar stock.\n\n' +
    'Usa:\n' +
    '/budget <precioLista> <descuento> - Obtener un presupuesto\n' +
    '/stock <talla> - Ver el stock de productos\n'
  );
});

bot.launch();
console.log("Welcome to G7's bot on Telegram!");

bot.command('budget', (ctx) => {
  const username = ctx.from.username;
  console.log(`Mensaje de @${username} => ${ctx.message.text}`);

  const text = ctx.message.text.trim();
  const args = text.split(' ').slice(1);

  if (args.length >= 1) {
    handleBudget(ctx, args);
  } else {
    ctx.reply('Para obtener un PRESUPUESTO, proporciona un precio de lista del producto (en dolares) y un descuento que ofrezca el sitio web (en porcentaje - si corresponde).\nEjemplo: 128 10');
    awaitingCommand = 'budget';
  }
});

bot.command('stock', (ctx) => {
  const username = ctx.from.username;
  console.log(`Mensaje de @${username} => ${ctx.message.text}`);

  const text = ctx.message.text.trim().toUpperCase();
  const args = text.split(' ').slice(1);

  if (args.length >= 1) {
    handleStock(ctx, args);
  } else {
    ctx.reply('Para conocer los PRODUCTOS EN STOCK, proporciona una o más tallas.\nEjemplo: 9 10.5 M');
    awaitingCommand = 'stock';
  }
});

bot.on('text', async (ctx) => {
  const username = ctx.from.username;
  console.log(`Mensaje de @${username} => ${ctx.message.text}`);
  const text = ctx.message.text.trim().toUpperCase();
  const args = text.split(' ');

  if (awaitingCommand === 'budget') {
    awaitingCommand = null;
    handleBudget(ctx, args);
  } else if (awaitingCommand === 'stock') {
    awaitingCommand = null;
    handleStock(ctx, args);
  } else {
    ctx.reply('Usa /start para comenzar.');
  }
});
