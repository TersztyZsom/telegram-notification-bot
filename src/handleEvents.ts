import Web3 from 'web3';
import { sendTelegramNotification, formatAddress, getValuation, getTopBlurBid, getTopNFTXBid } from "./utils";
import { actionTypes } from "./constants";
import * as dotenv from "dotenv";
dotenv.config();

const infuraProjectId: string = process.env.INFURA_PROJECT_ID || '';

const webSocketProvider: string = `wss://mainnet.infura.io/ws/v3/${infuraProjectId}`;

const web3: Web3 = new Web3(new Web3.providers.WebsocketProvider(webSocketProvider));


/**
 * Build the message string
 */
const messageBuilder = async (messageObject: any) => {
    let message = `${messageObject.type}`;

    message = message + `\n\nPunk: [${messageObject.punkId}](https://cryptopunks.app/cryptopunks/details/${messageObject.punkId})`;
    message = message + `\n\nFrom: [${(await formatAddress(messageObject.from))}](https://cryptopunks.app/cryptopunks/accountinfo?account=${messageObject.from})`;
    if (messageObject.to) message = message + `\nTo: [${(await formatAddress(messageObject.to))}](https://cryptopunks.app/cryptopunks/accountinfo?account=${messageObject.to})`;
    message = message + `\n\nPrice: [${messageObject.price}Ξ](https://cryptopunks.app/cryptopunks/details/${messageObject.punkId})`;
    message = message + `\nValuation: [${messageObject.valuation}Ξ](https://www.deepnftvalue.com/asset/cryptopunks/${messageObject.punkId})`;
    message = message + `\n\nNFTX: [${messageObject.nftx}Ξ](https://v2.nftx.io/vault/0x269616d549d7e8eaa82dfb17028d0b212d11232a/info/)`;
    message = message + `\nBlur: [${messageObject.blur}Ξ](https://blur.io/eth/collection/wrapped-cryptopunks/bids)`;
    message = message + `\nPunk: [Floor](https://cryptopunks.app/cryptopunks/forsale)`;
    message = message + `\nGas: ${messageObject.gas}`;

    return message;
}

/**
 * Handle Punk Offered
 */
export const handlePunkOffered = async (event: any) => {
    const transactionHash = event.transactionHash;
    const transactionDetails = await web3.eth.getTransaction(transactionHash);

    const { from, gasPrice } = transactionDetails;
    const { punkIndex, minValue, toAddress } = event.returnValues;
    const valuation = await getValuation(punkIndex);
    const topBlurBid = await getTopBlurBid();
    const topNFTBid = await getTopNFTXBid();

    const messageObject: any = {
        type: actionTypes.offered,
        from: from,
        price: web3.utils.fromWei(minValue, 'ether'),
        valuation: valuation,
        blur: topBlurBid,
        nftx: topNFTBid,
        gas: Math.round(Number(web3.utils.fromWei(gasPrice, 'gwei'))),
        punkId: punkIndex
    }
    if (toAddress !== '0x0000000000000000000000000000000000000000') messageObject.to = toAddress;
    const message: string = await messageBuilder(messageObject);

    await sendTelegramNotification(message);
}

/**
 * Handle Punk Sale
 */
export const handlePunkBought = async (event: any) => {
    const transactionHash = event.transactionHash;
    const transactionDetails = await web3.eth.getTransaction(transactionHash);

    const { gasPrice } = transactionDetails;
    const { fromAddress, punkIndex } = event.returnValues;
    let { toAddress, value } = event.returnValues;
    const valuation = await getValuation(punkIndex);
    const topBlurBid = await getTopBlurBid();
    const topNFTBid = await getTopNFTXBid();

    if (toAddress === '0x0000000000000000000000000000000000000000') { // bid accepted sale
        const transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
        toAddress = '0x' + transactionReceipt.logs[0].topics[2].slice(26);
        const decodedParams = web3.eth.abi.decodeParameters([{name: 'punkIndex', type: 'uint256' }, { name: 'minPrice', type: 'uint256' }], transactionDetails.data.slice(10));
        value = decodedParams.minPrice;
    }

    const messageObject: any = {
        type: actionTypes.sale,
        from: fromAddress,
        to: toAddress,
        price: web3.utils.fromWei(value, 'ether'),
        valuation: valuation,
        blur: topBlurBid,
        nftx: topNFTBid,
        gas: Math.round(Number(web3.utils.fromWei(gasPrice, 'gwei'))),
        punkId: punkIndex
    }
    const message: string = await messageBuilder(messageObject);

    await sendTelegramNotification(message);
}

/**
 * Handle Punk Bid
 */
export const handlePunkBidEntered = async (event: any, contract: any) => {
    const transactionHash = event.transactionHash;
    const transactionDetails = await web3.eth.getTransaction(transactionHash);

    const { gasPrice } = transactionDetails;
    const { fromAddress, punkIndex, value } = event.returnValues;
    const toAddress = (await contract.methods.punkIndexToAddress(punkIndex).call()).toLowerCase();
    const valuation = await getValuation(punkIndex);
    const topBlurBid = await getTopBlurBid();
    const topNFTBid = await getTopNFTXBid();

    // filtering out bids that are way below valuation
    const minBidLimit = 20 //eth
    if (Number(web3.utils.fromWei(value, 'ether')) < minBidLimit) {
        console.log(`Bid too low... Skip.`);
        return;
    }
    
    const messageObject: any = {
        type: actionTypes.bid,
        from: fromAddress,
        to: toAddress,
        price: web3.utils.fromWei(value, 'ether'),
        valuation: valuation,
        blur: topBlurBid,
        nftx: topNFTBid,
        gas: Math.round(Number(web3.utils.fromWei(gasPrice, 'gwei'))),
        punkId: punkIndex
    }
    const message: string = await messageBuilder(messageObject);

    await sendTelegramNotification(message);
}

/**
 * Handle Other
 */
export const handleOther = async (event: any) => {
    const message: string = `${event.event}\n\nhttps://cryptopunks.app/cryptopunks/details/${event.returnValues.punkIndex}`;
    await sendTelegramNotification(message);
}
