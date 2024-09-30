import Web3 from 'web3';
import fs from "fs";
import { AbiItem } from 'web3-utils';
import { sendTelegramNotification } from "./utils";
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


// Listen for the 'PunkOffered' event (triggered by offerPunkForSale)
contract.events.PunkOffered({})
    .on('data', async (event: any) => {
        console.log('=================================')
        console.log(types.offered);
        console.log('event.returnValues', event.returnValues);

        const { punkIndex, minValue, toAddress } = event.returnValues;

        const punkId = punkIndex;
        const fromLabel = 'xxx';
        const toLabel = toAddress;
        const price = web3.utils.fromWei(minValue, 'ether');
        const valuation = 888;
        const gas = 99;

        const message: string = `
        ${types.offered}

        from ${fromLabel}
        to ${toLabel}

        price ${price}Ξ  

        valuation ${valuation}Ξ 

        gas ${gas} gwei

        https://cryptopunks.app/cryptopunks/details/${punkId}
        `;

        await sendTelegramNotification(message);
    })

// Listen for the 'PunkBought' event (triggered by acceptBidForPunk)
contract.events.PunkBought({})
    .on('data', (event: any) => {
        console.log('=================================')
        console.log('event.returnValues', event.returnValues);
        const { punkIndex, value, fromAddress, toAddress } = event.returnValues;
        console.log(`Punk #${punkIndex} was bought for ${web3.utils.fromWei(value, 'ether')} ETH from ${fromAddress} to ${toAddress}`);
        console.log(`Notification: Punk #${punkIndex} was bought!`);
    });

// Listen for the 'PunkBidEntered' event (triggered when a bid is entered for a punk)
contract.events.PunkBidEntered({})
    .on('data', (event: any) => {
        console.log('=================================')
        console.log('event.returnValues', event.returnValues);
        const { punkIndex, value, fromAddress } = event.returnValues;
        console.log(`Bid entered for Punk #${punkIndex}: ${web3.utils.fromWei(value, 'ether')} ETH by ${fromAddress}`);
        console.log(`Notification: Bid entered for Punk #${punkIndex}!`);
    });

// Listen for the 'PunkTransfer' event (triggered when a punk is transferred)
contract.events.PunkTransfer({})
    .on('data', (event: any) => {
        console.log('=================================')
        console.log('event.returnValues', event.returnValues);
        const { punkIndex, fromAddress, toAddress } = event.returnValues;
        console.log(`Punk #${punkIndex} was transferred from ${fromAddress} to ${toAddress}`);
    });

// Listen for the 'PunkBidWithdrawn' event (triggered when a bid is withdrawn)
contract.events.PunkBidWithdrawn({})
    .on('data', (event: any) => {
        console.log('=================================')
        console.log('event.returnValues', event.returnValues);
        const { punkIndex, value, fromAddress } = event.returnValues;
        console.log(`Bid of ${web3.utils.fromWei(value, 'ether')} ETH was withdrawn for Punk #${punkIndex} by ${fromAddress}`);
    });

// Listen for the 'PunkNoLongerForSale' event (triggered when a punk is no longer for sale)
contract.events.PunkNoLongerForSale({})
    .on('data', (event: any) => {
        console.log('=================================')
        console.log('event.returnValues', event.returnValues);
        const { punkIndex } = event.returnValues;
        console.log(`Punk #${punkIndex} is no longer for sale`);
    });