import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from "dotenv";
import { addressDictionary } from "./constants";
dotenv.config();


/**
 * Send a notif on Telegram
 */
export const sendTelegramNotification = async (message: string) => {
    const botToken = process.env.BOT_TOKEN || '';
    const bot = new TelegramBot(botToken, { polling: true });
    const chatId = Number(process.env.CHAT_ID); 
    try {
        const response = await bot.sendMessage(chatId, message);
        bot.stopPolling();
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        bot.stopPolling();
        throw error;
    }
};

/**
 * Send a notif on Telegram
 */
export const formatAddress = (address: string) => {
    let formattedAddress;
    if (Object.keys(addressDictionary).includes(address.toLowerCase())) {
        formattedAddress = addressDictionary[address.toLowerCase()];
    }
    else {
        formattedAddress = address.slice(0, 6);
    }
    return formattedAddress;
};


/**
 * Example
 */
// (async () => {
//     const types = ['💎 SALE', '🟣 Bid', '🔻 Offered'];
//     const fromLabel = 'xxx';
//     const toLabel = 'yyy';
//     const price = 999;
//     const valuation = 888;
//     const punkId = 4882;
//     const gas = 99;
    
//     const message: string = `
//     ${types[0]}
    
//     from ${fromLabel}
//     to ${toLabel}
    
//     price ${price}Ξ  
    
//     valuation ${valuation}Ξ 
    
//     gas ${gas} gwei
    
//     https://cryptopunks.app/cryptopunks/details/${punkId}
//     `;
    
//     const response = await sendTelegramNotification(message);
//     console.log('response', response);
// })();