import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
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
        const response = await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};


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


/**
 * Get punk valuation from DeepNftValue
 */
export async function getValuation(punkId: string): Promise<number> {
    try {
        const url = `https://api.deepnftvalue.com/api/nfts/cryptopunks/${punkId}`;
        const response = await axios.get(url);
        const valuationPrice = response.data?.valuation?.price;
        return valuationPrice ? parseFloat(valuationPrice) : -1;
    } catch (error) {
        console.error('Error fetching valuation:', error);
        return null;
    }
}

