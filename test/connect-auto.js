'use strict';

let AlpsEnv = require('../lib/alps-env.js');

AlpsEnv.connect().then(() => {
	console.log('Connected.');
}).catch((error) => {
	console.error(error);
});