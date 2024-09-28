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
    sale: '💎 Sale 💎', 
    bid: '🟣 Bid 🟣', 
    offered: '🔻 Offered 🔻'
};


const getPastEvents = async () => {

    const events: any = await contract.getPastEvents('PunkOffered' as any, {
        fromBlock: 20779738, 
        toBlock: 'latest'
    });

    for (let i = 0; i < 2; i++) {
        const event = events[i];
        
        // HERE...
        const transactionHash = event.transactionHash;
        const transactionDetails = await web3.eth.getTransaction(transactionHash);

        const { from, to, gasPrice } = transactionDetails;

        const { punkIndex, minValue } = event.returnValues;

        const punkId = punkIndex;
        const fromLabel = formatAddress(from);
        const toLabel = formatAddress(to || '');
        const price = web3.utils.fromWei(minValue, 'ether');
        const valuation = 888;
        const gas = Math.round(Number(web3.utils.fromWei(gasPrice, 'gwei')));

        const message: string = `${types.offered}\n\nFrom: ${fromLabel}\nTo: ${toLabel}\n\nPrice: ${price}Ξ\nValuation: ${valuation}Ξ\n\nGas: ${gas} gwei\n\nhttps://cryptopunks.app/cryptopunks/details/${punkId}`;

        await sendTelegramNotification(message);

        // timeout
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
};

// Call the function to fetch and handle past events
getPastEvents();