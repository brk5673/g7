
import { Telegraf } from "telegraf";
import { handleBudget, handleStock, handleMarkAsSold, writeGoogleSheet, userStates } from "./functions";
require('dotenv').config();
const spreadsheetId = process.env.SPREADSHEET_ID!;

export const setupCommands = (bot: Telegraf) => {
  bot.command('start', (ctx) => {
    const username = ctx.from.username;
    console.log(`Comando de @${username} => ${ctx.message.text}`);
    ctx.reply('¡Hola!\nSoy el bot de G7, creado para obtener presupuesto y consultar stock.\n\n' +
      'Usa:\n' +
      '/budget <precioLista> *<descuento>*\nObtener un presupuesto\n\n' +
      '/stock <talla>\nProductos en stock\n\n' +
      '*Opcional'
    );
  });

  bot.command('budget', (ctx) => {
    const username = ctx.from.username;
    console.log(`@${username} quiere obtener un PRESUPUESTO`);

    const text = ctx.message.text.trim();
    const args = text.split(' ').slice(1);

    if (args.length >= 1) {
      handleBudget(ctx, args);
    } else {
      ctx.reply('Para obtener un PRESUPUESTO, proporciona el comando /budget + un precio de lista del producto (en dolares) + un descuento que ofrezca el sitio web (si corresponde).\nEjemplo: /budget 128 10');
    }
  });

  bot.command('stock', (ctx) => {
    const username = ctx.from.username;
    console.log(`@${username} quiere consultar el STOCK`);

    const text = ctx.message.text.trim().toUpperCase();
    const args = text.split(' ').slice(1);

    if (args.length >= 1) {
      handleStock(ctx, args);
    } else {
      ctx.reply('Para conocer los PRODUCTOS EN STOCK, proporciona el comando /stock + una o más tallas.\nEjemplo: /stock 9 10.5 M');
    }
  });

  bot.command('sold', (ctx) => {
    const username = ctx.from.username;
    console.log(`@${username} quiere registrar una VENTA`);

    if (username !== 'jossefc') {
      ctx.reply('No tienes permisos para usar este comando.');
      return;
    } else {
      const text = ctx.message.text.trim();
      const args = text.split(' ').slice(1);
      if (args.length >= 1) {
        handleMarkAsSold(ctx, args);
      } else {
        ctx.reply('Para registrar un producto como VENDIDO, proporciona el comando /sold + número de artículo.\nEjemplo: /sold 245');
      }
    }
  });

  bot.on('text', async (ctx) => {
    const username = ctx.from.username;
    const userId = ctx.from.id.toString();
    const userStatesData = userStates.get(userId);
    console.log(`Mensaje de @${username} => ${ctx.message.text}`);

    if (userStatesData) {
      const userResponse = ctx.message.text.trim().toString();
      const buyerCell = `compras seguimiento!AL${userStatesData.rowIndex + 1}`;
      const priceCell = `compras seguimiento!AM${userStatesData.rowIndex + 1}`;

      if (userStatesData.step === 'askBuyerName') {
        try {
          await writeGoogleSheet(spreadsheetId, buyerCell, [userResponse]);
          userStates.set(userId, { 
            ...userStatesData, 
            step: 'askPrice', 
            buyerName: userResponse // Almacena el comprador
          });
            ctx.reply('¿A qué precio se vendió?');
        } catch (error) {
          console.error('Error escribiendo nombre del comprador:', error);
          ctx.reply('⚠️ Hubo un error al intentar guardar el nombre del comprador.');
        }
      } else if (userStatesData.step === 'askPrice') {
        try {
          const buyerName = userStatesData.buyerName; // Recupera el comprador
          const price = `$${parseFloat(userResponse).toLocaleString('en-US')}` // Precio actual
          await writeGoogleSheet(spreadsheetId, priceCell, [price]);
          ctx.reply(
            `✅ Venta registrada:\n` +
            `Artículo: ${userStatesData.articleNumber}\n` +
            `Nombre: ${userStatesData.productName}\n` +
            `Comprador: ${buyerName}\n` +
            `Precio: ${price}`
          );
          userStates.delete(userId);
        } catch (error) {
          console.error('Error escribiendo precio de venta:', error);
          ctx.reply('⚠️ Hubo un error al intentar guardar el precio de venta.');
        }
        return;
      }
      ctx.reply('Hola! Usa /start para comenzar.');
    }
  });
}
