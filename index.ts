require('dotenv').config();
const { Telegraf } = require('telegraf');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
console.log('welcome to the g7 budget bot');
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

async function obtenerDolarBlue() {
  try {
    const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
    const data = await response.json();
    const dolarBlueVenta = Number(data.blue.value_sell)+10;

    return dolarBlueVenta;
  } catch (error) {
    console.error("Error al obtener el precio del dólar blue:", error);
  }
}

async function presupuesto(precioLista, descuento) {
  const tax = precioLista * 0.08;
  const pyBox = 33;
  const toCtes = 10;
  const desc = descuento ? (precioLista * descuento) / 100 : 0;
  const dolar = await obtenerDolarBlue();

  const totalUSD = (Number(precioLista) - Number(desc)) + Number(tax) + Number(pyBox) + Number(toCtes);
  const totalARS = totalUSD * Number(dolar);
  return { totalUSD, totalARS};
}

bot.command('budget', async (ctx) => {
  if (!ctx.message.text) {
    ctx.reply('Para obtener costo final, usa el comando /budget seguido del precio de lista y opcionalmente un descuento. Ejemplo: /budget 1000 10');
    return;
  }

  const text = ctx.message.text.trim();
  const args = text.split(' ').slice(1);

  if (args.length < 1 || args.length > 2) {
    ctx.reply('Uso incorrecto. Usa: /budget <precioLista> [descuento]');
    return;
  }

  const precioLista = parseFloat(args[0]); // Primer argumento
  const descuento = args[1] ? parseFloat(args[1]) : 0; // Segundo argumento (opcional)

  if (isNaN(precioLista) || (args[1] && isNaN(descuento))) {
    ctx.reply('Por favor, proporciona un precio de lista y un descuento válido (si aplica).');
    return;
  }

  const {totalUSD: USD} = await presupuesto(precioLista, descuento);
  const {totalARS: ARS} = await presupuesto(precioLista, descuento);

  const mensaje = `
    Detalle del Presupuesto:
    - Precio de lista: ${precioLista}
    - Descuento: ${descuento > 0 ? descuento + '%' : 'No aplica'}
    - Costo final $USD en Ctes: $${USD}
    - Costo final $ARS en Ctes: $${ARS}
  `;
  
  ctx.reply(mensaje);
});

bot.launch();
console.log("El bot está escuchando mensajes en Telegram...");
