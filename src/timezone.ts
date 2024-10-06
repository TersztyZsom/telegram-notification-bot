import moment from "moment-timezone";
import etherscanApi from 'etherscan-api';
import * as dotenv from "dotenv";
dotenv.config();

const etherscan = etherscanApi.init(process.env.ETHERSCAN_API_KEY);
const address = process.argv[2];
if (!address) {
    console.error("Please provide an Ethereum address as a command-line argument.");
    process.exit(1);
}

// Helper function to get all transaction timestamps using Etherscan API
async function getTransactionTimestamps(address: string): Promise<number[]> {
    const response = await etherscan.account.txlist(address, 0, 'latest', 1, 300, 'desc');

    if (response.status !== '1') {
        throw new Error(`Failed to fetch transaction history: ${response.message}`);
    }

    const timestamps: number[] = response.result.map((tx: any) => parseInt(tx.timeStamp));
    return timestamps;
}

// Function to format the hour in 12-hour AM/PM format
function formatHour(hour: number): string {
    const amPm = hour < 12 ? 'am' : 'pm';
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${formattedHour}${amPm}`;
}

// Function to print activity by hour as a bar chart
function printActivityByHour(activityByHour: number[]): void {
    const maxTransactions = Math.max(...activityByHour); // Find the max number of transactions to scale bars
    const scale = maxTransactions > 0 ? 20 / maxTransactions : 1; // Scale bars to a max length of 20 chars

    // Get the current hour in UTC
    const currentUtcHour = moment().utc().hour();

    for (let hour = 0; hour < 24; hour++) {
        const formattedHour = formatHour(hour).padEnd(6, ' '); // Ensure consistent width for labels
        const txCount = activityByHour[hour];
        const barLength = Math.round(txCount * scale); // Scale the length of the bar
        const bar = '|'.repeat(barLength); // Create the bar

        // Add (current) if this is the current UTC hour
        const currentLabel = hour === currentUtcHour ? ' (current)' : '';

        // Append the number of transactions at the end if there are transactions
        const txCountLabel = txCount > 0 ? ` ${txCount}` : '';

        console.log(`${formattedHour} ${bar}${currentLabel}${txCountLabel}`);
    }
}

// Function to infer timezone from transaction timestamps and print activity by hour
function analyzeTransactionActivity(timestamps: number[]): void {
    // Convert Unix timestamps to moment objects in UTC
    const times = timestamps.map(ts => moment.unix(ts).utc());

    // Count occurrences per hour in UTC
    const activityByHour = new Array(24).fill(0);
    times.forEach(time => {
        const hour = time.hour();
        activityByHour[hour]++;
    });

    // Print the activity by hour
    printActivityByHour(activityByHour);
}

// main
async function main(address: string) {
    try {
        const timestamps = await getTransactionTimestamps(address);

        if (timestamps.length === 0) {
            console.log('No transactions found for this address.');
            return;
        }

        analyzeTransactionActivity(timestamps);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main(address);