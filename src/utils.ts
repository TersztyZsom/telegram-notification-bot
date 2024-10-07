import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import * as dotenv from "dotenv";
import { addressDictionary } from "./constants";
import { timezone } from "./timezone";
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
export async function formatAddress(address: string) {
    let formattedAddress;
    if (Object.keys(addressDictionary).includes(address.toLowerCase())) {
        formattedAddress = addressDictionary[address.toLowerCase()];
    }
    else {
        formattedAddress = address.slice(0, 6);
    }
    const addressTimezone = await timezone(address);
    formattedAddress = formattedAddress + ` (${addressTimezone})`
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


export async function getTopBlurBid(): Promise<number> {
    try {
        const url = `https://api.reservoir.tools/orders/bids/v6?sources=blur.io&contracts=0xb7f7f6c52f2e2fdb1963eab30438024864c313f6`;
        const response = await axios.get(url);
        const orders = response.data.orders;
        const collectionBids = orders.filter((o: any) => o.criteria.kind === 'collection');
        const topCollectionBid = collectionBids.length > 0 ? collectionBids[0].price.amount.native : -1;
        return topCollectionBid;
    } catch (error) {
        console.error('Error fetching valuation:', error);
        return null;
    }
}

/**
 * Get top NFTX sell price
 */
export async function getTopNFTXBid(): Promise<number> {
    try {
        return -1;
    } catch (error) {
        console.error('Error fetching valuation:', error);
        return null;
    }
}

