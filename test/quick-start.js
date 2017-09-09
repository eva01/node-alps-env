'use strict';

const AlpsEnv = require('../lib/alps-env.js');

// USB 受信モジュールに接続
AlpsEnv.connect().then(() => {
	// センサー情報受信のイベントハンドラをセット
	AlpsEnv.onmessage = (data) => {
		// 受信データを出力
		console.log(JSON.stringify(data, null, '  '));
	};
}).catch((error) => {
	console.error(error);
});