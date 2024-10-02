import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from "dotenv";
import { addressDictionary } from "./constants";
dotenv.config();


/**
 * Send a notif on Telegram
 */
export const sendTelegramNotification = async (message: string) => {
    const botToken = process.env.BOT_TOKEN || '';
    const bot = new TelegramBot(botToken, { polling: false });
    const chatId = Number(process.env.CHAT_ID); 
    try {
        const response = await bot.sendMessage(chatId, message);
        // bot.stopPolling();
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        // bot.stopPolling();
        throw error;
    }
};
// (async () => {
//     const response = await sendTelegramNotification('test message');
//     console.log('response', response);
// })();


/**
 * Address formatter
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


