import Web3 from 'web3';
import fs from "fs";
import { AbiItem } from 'web3-utils';
import { sendTelegramNotification, formatAddress } from "./utils";
import * as dotenv from "dotenv";
dotenv.config();

console.log('Websocket running...')

const infuraProjectId: string = process.env.INFURA_PROJECT_ID || '';

const webSocketProvider: string = `wss://mainnet.infura.io/ws/v3/${infuraProjectId}`;

const web3: Web3 = new Web3(new Web3.providers.WebsocketProvider(webSocketProvider));

const contractAddress: string = '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB';

const contractABI: AbiItem[] =  JSON.parse(fs.readFileSync("abi.json", "utf8"));

const contract = new web3.eth.Contract(contractABI, contractAddress);


const types = {
    sale: '💎 SALE 💎', 
    bid: '🟣 BID 🟣', 
    offered: '🔻 OFFERED 🔻'
};

/**
 * Build the message string
 */
const messageBuilder = (messageObject: any) => {
    let message = `${messageObject.type}`;
    message = message + `\n\nFrom: ${messageObject.from}`;
    if (messageObject.to) message = message + `\nTo: ${messageObject.to}`;
    message = message + `\n\nPrice: ${messageObject.price}Ξ`;
    message = message + `\nValuation: ${messageObject.valuation}Ξ`;
    message = message + `\n\nGas: ${messageObject.gas} gwei`;
    message = message + `\n\nhttps://cryptopunks.app/cryptopunks/details/${messageObject.punkId}`;

    // TODO: add blur & nftx bid floor, and overall punkfloor
    return message;
}

/**
 * Handle Punk Offered
 */
const handlePunkOffered = async (event: any) => {
    const transactionHash = event.transactionHash;
    const transactionDetails = await web3.eth.getTransaction(transactionHash);

    const { from, to, gasPrice } = transactionDetails;
    const { punkIndex, minValue, toAddress } = event.returnValues;

    const messageObject: any = {
        type: types.offered,
        from: formatAddress(from),
        price: web3.utils.fromWei(minValue, 'ether'),
        valuation: 888,
        gas: Math.round(Number(web3.utils.fromWei(gasPrice, 'gwei'))),
        punkId: punkIndex
    }
    if (toAddress !== '0x0000000000000000000000000000000000000000') messageObject.to = formatAddress(toAddress);
    const message: string = messageBuilder(messageObject);

    await sendTelegramNotification(message);
}

/**
 * Handle Punk Sale
 */
const handlePunkBought = async (event: any) => {
    const transactionHash = event.transactionHash;
    const transactionDetails = await web3.eth.getTransaction(transactionHash);

    const { gasPrice } = transactionDetails;
    const { fromAddress, toAddress, punkIndex, value } = event.returnValues;

    const messageObject: any = {
        type: types.sale,
        from: formatAddress(fromAddress),
        to: formatAddress(toAddress),
        price: web3.utils.fromWei(value, 'ether'),
        valuation: 888,
        gas: Math.round(Number(web3.utils.fromWei(gasPrice, 'gwei'))),
        punkId: punkIndex
    }
    const message: string = messageBuilder(messageObject);

    await sendTelegramNotification(message);
}

/**
 * Handle Punk Bid
 */
const handlePunkBidEntered = async (event: any) => {
    const transactionHash = event.transactionHash;
    const transactionDetails = await web3.eth.getTransaction(transactionHash);

    const { gasPrice } = transactionDetails;
    const { fromAddress, punkIndex, value } = event.returnValues;

    // filtering out bids that are way below valuation
    const minBidLimit = 20 //eth
    if (Number(web3.utils.fromWei(value, 'ether')) < minBidLimit) {
        console.log(`Bid too low... Skip.`);
        return;
    }
    
    const messageObject: any = {
        type: types.bid,
        from: formatAddress(fromAddress),
        price: web3.utils.fromWei(value, 'ether'),
        valuation: 888,
        gas: Math.round(Number(web3.utils.fromWei(gasPrice, 'gwei'))),
        punkId: punkIndex
    }
    const message: string = messageBuilder(messageObject);

    await sendTelegramNotification(message);
}

/**
 * Handle Other
 */
const handleOther = async (event: any) => {
    const message: string = `${event.event}\n\nhttps://cryptopunks.app/cryptopunks/details/${event.returnValues.punkIndex}`;
    await sendTelegramNotification(message);
}

/**
 * Main
 */
const getPastEvents = async () => {

    const currentBlockNumber = Number(await web3.eth.getBlockNumber());
    const events: any = await contract.getPastEvents('allEvents', {
        fromBlock: currentBlockNumber - (5 * 60 * 2),
        toBlock: currentBlockNumber
        // fromBlock: 20740913-1,
        // toBlock: 20740913+100
    });

    const startIndex = 0;
    const endIndex = events.length;
    for (let i = startIndex; i < endIndex; i++) {
        const event = events[i];
        switch (event.event) {
            case 'PunkOffered':
                console.log('PunkOffered event');
                await handlePunkOffered(event);
                break;
            case 'PunkBought':
                console.log('PunkBough event');
                await handlePunkBought(event);
                break;
            case 'PunkBidEntered':
                console.log('PunkBidEntered event');
                await handlePunkBidEntered(event);
                break;
            default:
                // await handleOther(event)
                console.log('Other event:', event.event);
        }
        // timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
    };

};

// Call the function to fetch and handle past events
getPastEvents();