const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	_id: {
		type: Number
	},
	username: {
		type: String
	},
	victories: {
		type: Number,
		default: 0
	},
	games: {
		type: Number,
		default: 0
	},
	coins: {
		type: Number,
		default: 6
	},
	ranking: {
		type: Number,
		default: 0,
	},
	lastBonusTime: {
		type: Number,
		default: 0
	},
	status: {
		type: Boolean,
		default: false
	}
}, {versionKey: false});


const User = mongoose.model('User', userSchema);
module.exports = User;