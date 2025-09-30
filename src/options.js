module.exports = {
	gamesOptions: {
		reply_markup: JSON.stringify({
			inline_keyboard: [
				[{text: '🎰', callback_data: 'slot'}],
				[{text: '⚽', callback_data: 'football'}],
				[{text: '🏀', callback_data: 'basket'}],
				[{text: '🎳', callback_data: 'bowling'}],
				[{text: '🎯', callback_data: 'darts'}]
			]
		})
	},

	slotMachineOptions: {
		reply_markup: JSON.stringify({
			inline_keyboard: [[{text: 'Try again', callback_data: 'slotAgain'}]]
		})
	},

	basketOptions: {
		reply_markup: JSON.stringify({
			inline_keyboard: [[{text: 'Try again', callback_data: 'basketAgain'}]]
		})
	},

	bowlingOptions: {
		reply_markup: JSON.stringify({
			inline_keyboard: [[{text: 'Try again', callback_data: 'bowlingAgain'}]]
		})
	},

	footballOptions: {
		reply_markup: JSON.stringify({
			inline_keyboard: [
				[{text: 'Try again', callback_data: 'footballAgain'}]
			]
		})
	},

	dartsOptions: {
		reply_markup: JSON.stringify({
			inline_keyboard: [[{text: 'Try again', callback_data: 'dartsAgain'}]]
		})
	}
};
