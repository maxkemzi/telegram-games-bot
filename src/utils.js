const generateName = (username, firstName, lastName) => {
	if (!username) {
		if (lastName) {
			return firstName + ' ' + lastName;
		} else {
			return firstName;
		}
	}

	return username;
};

const delay = ms => {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
};

const declOfNum = (n, textForms) => {
	return n === 1 ? textForms[0] : textForms[1];
};

module.exports = {generateName, delay, declOfNum};
