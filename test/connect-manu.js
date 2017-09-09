'use strict';

let AlpsEnv = require('../lib/alps-env.js');

AlpsEnv.connect({path:'COM13'}).then(() => {
	console.log('Connected.');
}).catch((error) => {
	console.error(error);
});