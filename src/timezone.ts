import moment from "moment-timezone";
import etherscanApi from 'etherscan-api';
import * as dotenv from "dotenv";
dotenv.config();

const etherscan = etherscanApi.init(process.env.ETHERSCAN_API_KEY, { timeout: 60000 });


// Helper function to get all transaction timestamps using Etherscan API
async function getTransactionTimestamps(address: string): Promise<number[]> {
    const response = await etherscan.account.txlist(address, 0, 'latest', 1, 100, 'desc');

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
function printActivityByHour(activityByHour: number[], currentUtcHour: number): void {
    const maxTransactions = Math.max(...activityByHour); // Find the max number of transactions to scale bars
    const scale = maxTransactions > 0 ? 20 / maxTransactions : 1; // Scale bars to a max length of 20 chars

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

function findStartOfDay(activityByHour: number[]): number {
    const hoursInDay = 24;
    const windowSize = 8; // We now consider the current hour plus 7 previous hours

    let minSum = Infinity;  // Track the minimum sum of transactions
    let startHour = 0;      // The hour where the user starts their day

    // Iterate over all 24 hours and calculate the sum for the current hour + previous 7 hours
    for (let hour = 0; hour < hoursInDay; hour++) {
        // Calculate the sum of the current hour and the previous 7 hours
        let sum = 0;
        for (let i = 0; i < windowSize; i++) {
            const prevHour = (hour - i + hoursInDay) % hoursInDay; // Handle circular hours
            sum += activityByHour[prevHour];
        }

        // If the current window has fewer transactions, update the start hour
        if (sum < minSum) {
            minSum = sum;
            startHour = hour;
        }
    }

    return startHour;
}

// Function to infer timezone from transaction timestamps and print activity by hour
function analyzeTransactionActivity(timestamps: number[], print: boolean =false): string {
    const times = timestamps.map(ts => moment.unix(ts).utc());
    let certitude = true;
    if (times.length < 25) certitude = false;

    const activityByHour = new Array(24).fill(0);
    times.forEach(time => {
        const hour = time.hour();
        activityByHour[hour]++;
    });

    const currentUtcHour = moment().utc().hour();
    if (print) printActivityByHour(activityByHour, currentUtcHour);

    const startHour = (findStartOfDay(activityByHour) + 1) % 24;
    const endHour = (startHour - 8 + 24) % 24;

    let hoursToGo;
    if ((currentUtcHour >= endHour && currentUtcHour < startHour) || (endHour > startHour && (currentUtcHour >= endHour || currentUtcHour < startHour))) {
        // Sleeping: calculate how many hours until the start hour
        hoursToGo = (startHour - currentUtcHour + 24) % 24;
        hoursToGo = `-${hoursToGo}${certitude ? '' : '*'}`;
    } else {
        // Awake: calculate how many hours until the end hour
        hoursToGo = (endHour - currentUtcHour + 24) % 24;
        hoursToGo = `+${hoursToGo}${certitude ? '' : '*'}`;
    }
    return hoursToGo
}

// main
export async function timezone(address: string): Promise<any> {
    try {
        const timestamps = await getTransactionTimestamps(address);
        if (timestamps.length === 0) {
            console.log('No transactions found for this address.');
            return { hoursToGo: 999, certitude: false };
        }
        return analyzeTransactionActivity(timestamps);
    } catch (error) {
        console.error('Error:', error.message);
    }
}


// const address = process.argv[2];
// if (!address) {
//     console.error("Please provide an Ethereum address as a command-line argument.");
//     process.exit(1);
// }
// timezone(address);