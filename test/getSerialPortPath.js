'use strict';

let AlpsEnv = require('../lib/alps-env.js');

AlpsEnv.connect().then(() => {
	console.log('Serial Port Path: ' + AlpsEnv.getSerialPortPath());
}).catch((error) => {
	console.error(error);
});