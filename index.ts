const { google } = require('googleapis');
const { Telegraf } = require('telegraf');
require('dotenv').config();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
console.log('welcome to the g7 bot');
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const credentials = require('./credentials.json');

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function readGoogleSheet(spreadsheetId, range) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId, // ID del archivo GSheet
      range, // Rango a leer, por ejemplo: "Hoja1!A1:D10"
    });

    return response.data.values; // Devuelve los datos como un array de arrays
  } catch (err) {
    console.error('Error leyendo Google Sheet:', err);
    throw err;
  }
}


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

bot.launch();
console.log("El bot está escuchando mensajes en Telegram...");

// bot.on('text', (ctx) => {
//   const username = ctx.from.username;
//   if (ctx.message.text && !ctx.message.text.startsWith('/budget', '/readExcel')) {
//     ctx.reply('Para obtener un presupuesto, utiliza el comando /budget seguido del precio de lista y opcionalmente un porcentaje de descuento que ofrezca el sitio web. Ejemplo: /budget 1000 10');
//   }
//   console.log(`Mensaje de @${username} => ${ctx.message.text}`);
// });

bot.command('budget', async (ctx) => {
  const username = ctx.from.username;
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
    - El precio del dolar blue ahora es: $${await obtenerDolarBlue()}
    - Con tu precio de lista: $${precioLista}
    - Y el descuento ofrecido: ${descuento > 0 ? descuento + '%' : 'No aplica'}
    - Costo final $USD: $${USD}
    - Costo final $ARS: $${ARS}
  `;
  console.log(`Comando de @${username} => ${ctx.message.text}`);
  console.log(mensaje);
  ctx.reply(mensaje);
});

bot.command('stock', async (ctx) => {
  const spreadsheetId = '14S2iz9XPbY1qfyUhPOXTERnp2SO8niATQhIHf8XQGQI'; // ID de Google Sheet
  const range = '🔥STOCK!B1:E100'; // Ajusta según el rango que quieras leer

  const userInputs = ctx.message.text.trim();
  const args = userInputs.split(' ');
  const sizeToFilter = args[1] ? args[1].trim().toUpperCase() : null; // Convertir a mayúsculas y limpiar espacios

  try {
    const data = await readGoogleSheet(spreadsheetId, range);

    // Extraer encabezados y datos
    const headers = data[0]; // Primera fila son los encabezados
    const allData = data.slice(1); // Elimina los encabezados

    // Limpiar datos (por ejemplo, eliminar espacios y convertir todo a mayúsculas para la comparación)
    const cleanedData = allData.map(row => row.map(cell => (cell ? cell.toString().trim().toUpperCase() : null)));

    let filteredData;

    if (sizeToFilter) {
      // Filtrar por talla (columna "D", índice 3)
      filteredData = cleanedData.filter(row => row[2] && row[2] === sizeToFilter);
      if (filteredData.length === 0) {
        ctx.reply(`No se encontraron productos para la talla ${sizeToFilter}.`);
        return;
      }
    } else {
      // Si no se proporciona talla, mostrar todos los productos
      filteredData = cleanedData;
    }

    // Formatear los datos para enviar al usuario
    const formattedData = filteredData.map(row => {
      const articulo = row[0] || 'N/A';
      const descripcion = row[1] || 'N/A';
      const sz = row[2] || 'N/A';
      return `- Artículo: ${articulo}\n  Descripción: ${descripcion}\n  Talla: ${sz}`;
    }).join('\n\n');

    if (sizeToFilter) {
      ctx.reply(`Productos encontrados para talla ${sizeToFilter}:\n\n${formattedData}`);
    } else {
      ctx.reply(`Todos los productos disponibles:\n\n${formattedData}`);
    }
  } catch (err) {
    ctx.reply('Hubo un error al leer el Google Sheet. Verifica los logs para más detalles.');
    console.error('Error leyendo Google Sheet:', err);
  }
});
