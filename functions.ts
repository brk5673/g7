
const fetch = require('node-fetch');
import { google } from 'googleapis';
const credentials = require('./credentials.json');
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
})

export async function readGoogleSheet(spreadsheetId: any, range: any) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client as any });

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
  
export async function obtenerDolarBlue() {
  try {
    const response = await fetch('https://api.bluelytics.com.ar/v2/latest');
    const data : any = await response.json();
    const dolarBlueVenta = Number(data.blue.value_sell) + 10;

    return dolarBlueVenta;
  } catch (error) {
    console.error("Error al obtener el precio del dólar blue:", error);
  }
}
  
export async function presupuesto(precioLista: any, descuento: any) {
  const tax = precioLista * 0.08;
  const pyBox = 33;
  const toCtes = 10;
  const desc = descuento ? (precioLista * descuento) / 100 : 0;
  const dolar = await obtenerDolarBlue();

  const totalUSD = (Number(precioLista) - Number(desc)) + Number(tax) + Number(pyBox) + Number(toCtes);
  const totalARS = totalUSD * Number(dolar);
  return { totalUSD, totalARS};
}

export async function handleBudget(ctx: any, args: any) {
  const precioLista = parseFloat(args[0]);
  const descuento = args[1] ? parseFloat(args[1]) : 0;

  if (isNaN(precioLista) || (args[1] && isNaN(descuento))) {
    ctx.reply('Por favor, proporciona un precio de lista y un descuento válido (si aplica).\nEjemplo: /budget 1000 10');
    return;
  }

  const { totalUSD: USD } = await presupuesto(precioLista, descuento);
  const { totalARS: ARS } = await presupuesto(precioLista, descuento);

  const mensaje = `
    Detalle del Presupuesto:
    - El precio del dólar blue ahora es: $${await obtenerDolarBlue()}
    - Con tu precio de lista: $${precioLista}
    - Y el descuento ofrecido: ${descuento > 0 ? descuento + '%' : 'No aplica'}
    - Costo final $USD: $${USD}
    - Costo final $ARS: $${ARS}
  `;
  ctx.reply(mensaje);
}

export async function handleStock(ctx: any, sizesToFilter: any) {
  const spreadsheetId = '14S2iz9XPbY1qfyUhPOXTERnp2SO8niATQhIHf8XQGQI';
  const range = '🔥STOCK!B1:O100';

  try {
    const data : any[][] | null | undefined = await readGoogleSheet(spreadsheetId, range);
    const allData = data?.slice(1) ?? [];
    const cleanedData = allData.map(row => row.map(cell => (cell ? cell.toString().trim() : null)));
    const filteredData = cleanedData.filter(row => row[2] && sizesToFilter.includes(row[2]));
    const productQuantity = filteredData.length === 1 ? 'Producto encontrado para' : 'Productos encontrados para';
    const sizesQuantity = sizesToFilter.length === 1 ? 'la talla' : 'las tallas';

    if (filteredData.length === 0) {
      ctx.reply(`❌ No se encontraron productos para ${sizesQuantity} ${sizesToFilter.join(', ')}.`);
      return;
    }

    const formattedData = filteredData.map(row => {
      const articulo = row[0] || 'N/A';
      const descripcion = row[1] || 'N/A';
      const sz = row[2] || 'N/A';
      const unidad = row[3] || 'N/A';
      const precioContado = row[11] || 'N/A';
      const precioTarjeta = row[13] || 'N/A';
      return `- Artículo: ${articulo}\n  Descripción: ${descripcion}\n  Talla: ${sz} ${unidad}\n  Precio Contado: ${precioContado}\n  Precio Tarjeta: ${precioTarjeta}`;
    }).join('\n\n');

    const response = `✅ ${filteredData.length} ${productQuantity} ${sizesQuantity} ${sizesToFilter.join(', ')}:\n\n${formattedData}`;
    ctx.reply(response);
  } catch (err) {
    ctx.reply('Hubo un error al leer el Google Sheet. Verifica los logs para más detalles.');
    console.error('Error leyendo Google Sheet:', err);
  }
}