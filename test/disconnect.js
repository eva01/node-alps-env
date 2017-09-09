'use strict';

let AlpsEnv = require('../lib/alps-env.js');

AlpsEnv.connect().then(() => {
	console.log('Connected.');

	setTimeout(() => {
		AlpsEnv.disconnect().then(() => {
			console.log('Disconnected.');
		}).catch((error) => {
			console.error(error);
		});
	}, 5000);
}).catch((error) => {
	console.error(error);
});