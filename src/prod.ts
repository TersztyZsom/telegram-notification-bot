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

contract.events.allEvents({})
    .on('data', async (event: any) => {
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
                await handlePunkBidEntered(event);
                break;
            default:
                console.log(`${event.event} event (other), Punk ${event.returnValues.punkIndex}`);
                await handleOther(event);
        }
    });
