  
// telegram api
const TelegramApi = require('node-telegram-bot-api');

// mongoose
const mongoose = require('mongoose');

// mongoose user model
const User = require('./models');

// telegram button options
const {
	slotMachineOptions,
	basketOptions,
	bowlingOptions,
	footballOptions,
	dartsOptions,
	gamesOptions
} = require('./options');

// supporting functions
const {declOfNum, generateUsername, delay} = require('./utils');

// private variables
const {token, mongoURI} = require('./private');

// bot
const bot = new TelegramApi(token, {polling: true});


const getBonus = async (telegramId, chatId, options = {}) => {
	// finding user
	const user = await User.findOne({_id: telegramId});

	if (Date.now() / 3600000 > user.lastBonusTime) {
		// updating user coins and last bonus time
		await User.updateOne({_id: telegramId}, {
			$inc: {coins: options.coinsNumber},
			$set: {lastBonusTime: (Date.now() / 3600000) + options.bonusTime}
		});

		await bot.sendMessage(chatId, `Вы получили ${options.coinsNumber} ${declOfNum(options.coinsNumber, ['монета', 'монеты', 'монет'])} 🎉`);
	} else {
		const minutes = Math.floor((((user.lastBonusTime - (Date.now() / 3600000)) % 1).toFixed(2)) * 60);
		const hours = minutes === 60 ? Math.floor(user.lastBonusTime - (Date.now() / 3600000)) + 1 : Math.floor(user.lastBonusTime - (Date.now() / 3600000));

		await bot.sendMessage(chatId, `Получить монеты вы сможете через ${hours > 0 ? hours + ' ' + declOfNum(hours, ['час', 'часа', 'часов']) + ' ' : ''}${minutes !== 60 ? minutes + ' ' + declOfNum(minutes, ['минуту', 'минуты', 'минут']) + ' ' : ''}😉`);
	}
};

const insertUser = async (telegramId, username) => {
	// creating new user
	const user = await new User({
		_id: telegramId,
		username: username
	});

	// saving user to bd
	await user.save();
};

const updateRanking = async () => {
	const operations = [];

	const users = await User.find({victories: {$exists: true}}).sort({victories: -1}).lean();

	for (let i = 0; i < users.length; i++) {
		operations.push({updateOne: {filter: {_id: users[i]._id}, update: {$set: {ranking: i + 1}}}});
	}

	await User.bulkWrite(operations, {ordered: false});
};

const sendRanking = async (chatId, limit) => {
	// finding and sorting users by victories
	const users = await User.find().sort({victories: -1});

	let result = [];

	for (let i = 0; i < users.length && i < limit; i++) {
		result.push(`${users[i].ranking} место: ${users[i].username}\nПобед: ${users[i].victories}, Игр: ${users[i].games}`);
	}

	await bot.sendMessage(chatId, result.join('\n\n'));
};

const sendDice = async (telegramId, chatId, options = {}, condition, secondCondition = () => false) => {
	// finding user
	const user = await User.findOne({_id: telegramId});

	if (user.status === false) {
		if (user.coins > 0) {
			// updating user's status
			await User.updateOne({_id: telegramId}, {$set: {status: true}});

			const data = await bot.sendDice(chatId, {
				emoji: options.emoji
			});
	
			await delay(options.delay);
	
			if (condition(data.dice.value)) {
				// updating the number of user's victories and coins
				await User.updateOne({_id: telegramId}, {$inc: {victories: 1, coins: options.victoryCoins}});
				
				const user = await User.findOne({_id: telegramId});
				await bot.sendMessage(chatId, `Имя: ${user.username}; Баланс: ${user.coins} ${declOfNum(user.coins, ['монета', 'монеты', 'монет'])} (+${options.victoryCoins})`, options.buttonOptions);
			} else if (secondCondition(data.dice.value)) {
				// updating the number of user's victories and coins
				await User.updateOne({_id: telegramId}, {$inc: {victories: 1, coins: options.partialVictoryCoins}});
				
				const user = await User.findOne({_id: telegramId});
				await bot.sendMessage(chatId, `Имя: ${user.username}; Баланс: ${user.coins} ${declOfNum(user.coins, ['монета', 'монеты', 'монет'])} (+${options.partialVictoryCoins})`, options.buttonOptions);
			} else {
				// updating the number of user's coins
				await User.updateOne({_id: telegramId}, {$inc: {coins: -1}});
				
				const user = await User.findOne({_id: telegramId});
				await bot.sendMessage(chatId, `Имя: ${user.username}; Баланс: ${user.coins} ${declOfNum(user.coins, ['монета', 'монеты', 'монет'])} (-1)`, options.buttonOptions);
			}
	
			// updating the number of user's games
			await User.updateOne({_id: telegramId}, {$inc: {games: 1}});
	
			// updating user's status
			await User.updateOne({_id: telegramId}, {$set: {status: false}});
		} else {
			await bot.sendMessage(chatId, `У вас закончились монеты 😒`);
		}
	}
};


const start = async () => {
	const users = await User.find();
	
	for (let i = 0; i < users.length; i++) {
		await User.updateOne({_id: users[i]._id}, {$set: {status: false}});
	}

	// setting bot commands
	bot.setMyCommands([
		{command: '/start', description: 'Приветствие'},
		{command: '/games', description: 'Список игр'},
		{command: '/commands', description: 'Список команд'},
		{command: '/bonus', description: 'Получить бонус'},
		{command: '/stats', description: 'Ваша статистика'},
		{command: '/ranking', description: 'Рейтинг игроков'}
	]);

	// bot on message
	bot.on('message', async msg => {
		const telegramId = msg.from.id;
		const chatId = msg.chat.id;
		const text = msg.text;
		const username = generateUsername(msg.from.username, msg.from.first_name, msg.from.last_name);
		const botInfo = await bot.getMe();

		try {
			// inserting user
			if (await User.findOne({_id: telegramId}) === null) {
				await insertUser(telegramId, username);
			}

			// finding user
			const user = await User.findOne({_id: telegramId});

			if (text === '/start' || text === `/start@${botInfo.username}`) {
				return bot.sendMessage(chatId, `Добро пожаловать, ${user.username} 👋. Играй в игры и выигрывай!\n\nЧтобы увидеть список игр напиши /games\nЧтобы узнать больше команд напиши /commands`);
			}

			if (text === '/commands' || text === `/commands@${botInfo.username}`) {
				return bot.sendMessage(chatId, '/start - приветствие\n\n/games - список игр\n\n/bonus - получить бонус\n\n/stats - ваша статистика\n\n/ranking - рейтинг игроков');
			}

			if (text === '/games' || text === `/games@${botInfo.username}`) {
				return bot.sendMessage(chatId, 'Выберите игру:', gamesOptions);
			}

			if (text === '/bonus' || text === `/bonus@${botInfo.username}`) {
				return getBonus(telegramId, chatId, {
					coinsNumber: 6,
					bonusTime: 6
				});
			}

			if (text === '/ranking' || text === `/ranking@${botInfo.username}`) {
				// updating ranking
				await updateRanking();

				return sendRanking(chatId, 5);
			}

			if (text === '/stats' || text === `/stats@${botInfo.username}`) {
				// updating ranking
				await updateRanking();

				return bot.sendMessage(chatId, `Имя: ${user.username}\nПобед: ${user.victories}\nИгр: ${user.games}\nМонет: ${user.coins}\nМесто в рейтинге: ${user.ranking}`);
			}
		} catch (err) {
			return bot.sendMessage(chatId, 'Произошла ошибка :(');
		}
	});

	// bot on callback query
	bot.on('callback_query', async query => {
		const chatId = query.message.chat.id;
		const telegramId = query.from.id;
		const data = query.data;
		const username = generateUsername(query.from.username, query.from.first_name, query.from.last_name);

		try {
			// inserting user
			if (await User.findOne({_id: telegramId}) === null) {
				await insertUser(telegramId, username);
			}

			if (data === 'slot' || data === 'slotAgain') {
				const winningSlotValues  = [64, 1, 22, 43];
				const preWinningSlotValues = [2, 3, 4, 5, 6, 9, 11, 13, 16, 17, 18, 21, 23, 24, 26, 27, 30, 32, 33, 35, 38, 39, 41, 42, 44, 47, 48, 49, 52, 54, 56, 59, 60, 61, 62, 63];

				return sendDice(telegramId, chatId, {
						emoji: '🎰',
						delay: 2000,
						victoryCoins: 4,
						partialVictoryCoins: 1,
						buttonOptions: slotMachineOptions
					}, value => {
						return winningSlotValues.includes(value);
					},
					value => {
						return preWinningSlotValues.includes(value);
					});
			}

			if (data === 'basket' || data === 'basketAgain') {
				return sendDice(telegramId, chatId, {
					emoji: '🏀',
					delay: 4500,
					victoryCoins: 2,
					buttonOptions: basketOptions
				}, value => {
					return value === 4 || value === 5;
				});
			}

			if (data === 'bowling' || data === 'bowlingAgain') {
				return sendDice(telegramId, chatId, {
					emoji: '🎳',
					delay: 4000,
					victoryCoins: 4,
					buttonOptions: bowlingOptions
				}, value => {
					return value === 6;
				});
			}

			if (data === 'football' || data === 'footballAgain') {
				return sendDice(telegramId, chatId, {
					emoji: '⚽',
					delay: 4000,
					victoryCoins: 2,
					buttonOptions: footballOptions
				}, value => {
					return value === 4 || value === 5 || value === 3;
				});
			}

			if (data === 'darts' || data === 'dartsAgain') {
				return sendDice(telegramId, chatId, {
					emoji: '🎯',
					delay: 3000,
					victoryCoins: 4,
					buttonOptions: dartsOptions
				}, value => {
					return value === 6;
				});
			}
		} catch (err) {
			return bot.sendMessage(chatId, 'Произошла ошибка :(');
		}
	});
};

// connecting to db and then starting bot
mongoose.connect(mongoURI, {useNewUrlParser: true, useUnifiedTopology: true})
	.then(start)
	.catch(err => console.log(err));