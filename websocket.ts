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

const contractABI: AbiItem[] =  JSON.parse(fs.readFileSync("abi.json", "utf8"));

const contract = new web3.eth.Contract(contractABI, contractAddress);

contract.events.allEvents({})
    .on('data', async (event: any) => {
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
                await handleOther(event)
                console.log('Other event:', event.event);
        }
    });

// // Listen for the 'PunkBought' event (triggered by acceptBidForPunk)
// contract.events.PunkBought({})
//     .on('data', (event: any) => {
//         console.log('=================================')
//         console.log('event.returnValues', event.returnValues);
//         const { punkIndex, value, fromAddress, toAddress } = event.returnValues;
//         console.log(`Punk #${punkIndex} was bought for ${web3.utils.fromWei(value, 'ether')} ETH from ${fromAddress} to ${toAddress}`);
//         console.log(`Notification: Punk #${punkIndex} was bought!`);
//     });

// // Listen for the 'PunkBidEntered' event (triggered when a bid is entered for a punk)
// contract.events.PunkBidEntered({})
//     .on('data', (event: any) => {
//         console.log('=================================')
//         console.log('event.returnValues', event.returnValues);
//         const { punkIndex, value, fromAddress } = event.returnValues;
//         console.log(`Bid entered for Punk #${punkIndex}: ${web3.utils.fromWei(value, 'ether')} ETH by ${fromAddress}`);
//         console.log(`Notification: Bid entered for Punk #${punkIndex}!`);
//     });

// // Listen for the 'PunkTransfer' event (triggered when a punk is transferred)
// contract.events.PunkTransfer({})
//     .on('data', (event: any) => {
//         console.log('=================================')
//         console.log('event.returnValues', event.returnValues);
//         const { punkIndex, fromAddress, toAddress } = event.returnValues;
//         console.log(`Punk #${punkIndex} was transferred from ${fromAddress} to ${toAddress}`);
//     });

// // Listen for the 'PunkBidWithdrawn' event (triggered when a bid is withdrawn)
// contract.events.PunkBidWithdrawn({})
//     .on('data', (event: any) => {
//         console.log('=================================')
//         console.log('event.returnValues', event.returnValues);
//         const { punkIndex, value, fromAddress } = event.returnValues;
//         console.log(`Bid of ${web3.utils.fromWei(value, 'ether')} ETH was withdrawn for Punk #${punkIndex} by ${fromAddress}`);
//     });

// // Listen for the 'PunkNoLongerForSale' event (triggered when a punk is no longer for sale)
// contract.events.PunkNoLongerForSale({})
//     .on('data', (event: any) => {
//         console.log('=================================')
//         console.log('event.returnValues', event.returnValues);
//         const { punkIndex } = event.returnValues;
//         console.log(`Punk #${punkIndex} is no longer for sale`);
//     });