import axios from 'axios';

export async function getTopBlurBid(): Promise<number> {
    try {
        const url = `https://api.reservoir.tools/orders/bids/v6?sources=blur.io&contracts=0xb7f7f6c52f2e2fdb1963eab30438024864c313f6`;
        const response = await axios.get(url);
        const orders = response.data.orders;
        const collectionBids = orders.filter((o: any) => o.criteria.kind === 'collection');
        const topCollectionBid = collectionBids.length > 0 ? collectionBids[0].price.amount.native : -1;
        console.log('topBid', topCollectionBid);
        return topCollectionBid;
    } catch (error) {
        console.error('Error fetching valuation:', error);
        return null;
    }
}

(async () => {
    const topBlurBid = await getTopBlurBid();
    console.log('Top Blur Bid:', topBlurBid);
})();
