import TelegramBot from 'node-telegram-bot-api';

// Replace with your token from BotFather
const token = '7521050434:AAFivsQ3p5g2UMbva_PKVN3510RLGTkZTTU';

// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

// Replace this with your Telegram chat ID
const yourChatId = 7420692858;

// Start sending "Hello World" every 30 seconds
setInterval(() => {
    console.log('yaaaa');
    bot.sendMessage(yourChatId, 'Hello World');
}, 3000);

// Listen for the /start command to get chat ID
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Hello! Your chat ID issss: ' + chatId);
    console.log('Your chat ID is: ' + chatId);
});

console.log('Bot is running...');