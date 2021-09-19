const generateUsername = (username, firstName, lastName) => {
	if (!username) {
		if (lastName) {
			return firstName + ' ' + lastName
		} else {
			return firstName
		}
	}

	return username
}

const delay = ms => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve()
		}, ms)
	})
}

const declOfNum = (n, textForms) => {
	n = Math.abs(n) % 100
	let n1 = n % 10

	if (n > 10 && n < 20) {
		return textForms[2]
	}

	if (n1 > 1 && n1 < 5) {
		return textForms[1]
	}

	if (n1 === 1) {
		return textForms[0]
	}

	return textForms[2]
}

module.exports = {
	generateUsername,
	delay,
	declOfNum
}