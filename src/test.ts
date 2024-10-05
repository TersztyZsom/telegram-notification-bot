import Web3 from 'web3';
import fs from "fs";
import { AbiItem } from 'web3-utils';
import { handlePunkOffered, handlePunkBidEntered, handlePunkBought, handleOther } from "./handleEvents";
import * as dotenv from "dotenv";
dotenv.config();

console.log('Websocket running...')
const infuraProjectId: string = process.env.INFURA_PROJECT_ID || '';
const webSocketProvider: string = `wss://mainnet.infura.io/ws/v3/${infuraProjectId}`;
const web3: Web3 = new Web3(new Web3.providers.WebsocketProvider(webSocketProvider));
const contractAddress: string = '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB';
const contractABI: AbiItem[] =  JSON.parse(fs.readFileSync("src/abi.json", "utf8"));
const contract = new web3.eth.Contract(contractABI, contractAddress);

/**
 * Main
 */
const getPastEvents = async () => {

    const SPECIFIC_BLOCK = 20896569;
    const PAST_HOURS = 12;
    const currentBlockNumber = Number(await web3.eth.getBlockNumber());
    const events: any = await contract.getPastEvents('allEvents', {
        // fromBlock: currentBlockNumber - (5 * 60 * PAST_HOURS),
        // toBlock: currentBlockNumber
        fromBlock: SPECIFIC_BLOCK-1,
        toBlock: SPECIFIC_BLOCK+1
    });

    const startIndex = 0;
    const endIndex = events.length;
    for (let i = startIndex; i < endIndex; i++) {
        const event = events[i];
        switch (event.event) {
            case 'PunkOffered':
                console.log(`PunkOffered event, Punk ${event.returnValues.punkIndex}`);
                await handlePunkOffered(event);
                break;
            case 'PunkBought':
                console.log(`PunkBought event, Punk ${event.returnValues.punkIndex}`);
                await handlePunkBought(event);
                break;
            case 'PunkBidEntered':
                console.log(`PunkBidEntered event, Punk ${event.returnValues.punkIndex}`);
                await handlePunkBidEntered(event, contract);
                break;
            default:
                console.log(`${event.event} event (other), Punk ${event.returnValues.punkIndex}`);
        }
        // timeout
        await new Promise(resolve => setTimeout(resolve, 1500));
    };

};

// Call the function to fetch and handle past events
getPastEvents();