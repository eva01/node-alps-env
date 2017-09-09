node-alps-env
===============

node-alps-env は、node-alps は、アルプス電気社製「[環境センサモジュール 開発キット](http://www.alps.com/j/iotsmart-environment/index.html)」のセンサー子機からのデータを USB 受信モジュールを経由して取得するための node モジュールです。


[環境センサモジュール 開発キット](http://www.alps.com/j/iotsmart-environment/index.html)のセンサー子機経由で、以下のデータを受信することができます：

* 温度
* 湿度
* 気圧
* 照度
* 開閉

## 依存関係

* [Node.js](https://nodejs.org/en/) 6 +
* [serialport](https://github.com/EmergingTechnologyAdvisors/node-serialport) 5.0.0 +
  * すでに serialport モジュールがインストールされている場合は、そのバージョンを確認してください。node-omron-hvc-p2 は 5.0.0 より古いバージョンの serialport モジュールをもうサポートしていません。

## インストール

```
$ cd ~
$ npm install serialport
$ npm install node-alps-env
```

---------------------------------------
## 目次

* [クイックスタート](#Quick-Start)
* [`AlpsEnv` オブジェクト](#AlpsEnv-object)
  * [connect(*[params]*) メソッド](#AlpsEnv-connect-method)
  * [disconnect() メソッド](#AlpsEnv-disconnect-method)
  * [getSerialPortPath() メソッド](#AlpsEnv-getSerialPortPath-method)
  * [onmessage イベントハンドラ](#AlpsEnv-onmessage-event-handler)
* [リリースノート](#Release-Note)
* [リファレンス](#References)
* [ライセンス](#License)

---------------------------------------
## <a id="Quick-Start">クイックスタート</a>

次のサンプルコードは、USB 受信モジュールに接続し、センサー子機から送信されたデータを表示します。

```JavaScript
const AlpsEnv = require('node-alps-env');

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
```

上記コードは次のような結果を出力します。

```JavaScript
{
  "no": 0,
  "txid": 14746066,
  "temp": 27.9,
  "humi": 60.8,
  "pres": 1000.31,
  "light": 484,
  "door": 1,
  "vbat": 2.9,
  "rssi": -79
}
{
  "no": 1,
  "txid": 14746066,
  "temp": 28.1,
  "humi": 61,
  "pres": 1000.29,
  "light": 484,
  "door": 1,
  "vbat": 2.9,
  "rssi": -79
}
{
  "no": 2,
  "txid": 14746066,
  "temp": 28.2,
  "humi": 60.9,
  "pres": 1000.29,
  "light": 484,
  "door": 1,
  "vbat": 2.9,
  "rssi": -79
}
...
```

---------------------------------------
## <a id="AlpsEnv-object">`AlpsEnv` オブジェクト</a>

node-alps-env を利用するためには、次の通り、node-alps-env モジュールをロードします：

```JavaScript
const AlpsEnv = require('node-alps-env');
```

上記コードでは、変数 `AlpsEnv` が `AlpsEnv` オブジェクトです。`AlpsEnv` オブジェクトは、以降のセクションで説明するとおり、いくつかのメソッドを持っています。

### <a id="AlpsEnv-connect-method">connect(*[params]*) メソッド</a>

`connect()` メソッドは、ホスト PC の USB ポートに接続された USB 受信モジュール探し、利用可能な状態にするための準備を行います。このメソッドは `Promise` オブジェクトを返します。

```JavaScript
AlpsEnv.connect().then(() => {
  console.log('Connected.');
}).catch((error) => {
  console.error(error);
});
```

基本的に USB 受信モジュールがどのシリアルポートに接続されているかは知らなくても構いません。このメソッドは、適切な USB シリアルポートを自動的に探索します。さらに、ボーレートも指定する必要はありません。少なくとも最新の Linux ディストリビューション (Raspbian や Ubuntu)、Mac、Windows であれば期待通りに動作するはずです。

しかし、必ずしも USB 受信モジュールが接続された USB シリアルポートを発見できるとは限りません。その場合は、USB シリアルポートを指定することができます。

```JavaScript
AlpsEnv.connect({path:'COM13'}).then(() => {
  console.log('Connected.');
}).catch((error) => {
  console.error(error);
});e.error(error);
});
```

`connect()` メソッドは次のプロパティを含むハッシュオブジェクトを引数に取ります：

プロパティ  | 必須 | 型     | 説明
:----------|:-----|:-------|:-----------
`path`     | 任意 | String | USB 受信モジュールが接続されたシリアルポートを表すパスを指定します。(例： "COM3", "/dev/ttyACM0", "/dev/tty-usbserial1")

接続プロセスをできる限り早く終わらせたいなら、`path` を指定したほうが良いでしょう。なぜなら、自動スキャンモード (`path` を指定しない) は、ホスト PC の環境によって少し時間がかかるからです。

### <a id="AlpsEnv-disconnect-method">disconnect() メソッド</a>

`disconnect()` メソッドは、USB ポートの USB 受信モジュールとのコネクションを開放 (切断) します。このメソッドは `Promise` オブジェクトを返します。

```JavaScript
AlpsEnv.disconnect().then(() => {
  console.log('Disconnected.');
}).catch((error) => {
  console.error(error);
});
```

### <a id="AlpsEnv-getSerialPortPath-method">getSerialPortPath() メソッド</a>

`getSerialPortPath()` メソッドは、USB 受信モジュールに割り当てられた USB シリアルポートを表すパスを返します。このメソッドは、他のメソッドとは異なり、`Promise` オブジェクトを返しませんので注意してください。

```JavaScript
AlpsEnv.connect().then(() => {
  console.log('Serial Port Path: ' + AlpsEnv.getSerialPortPath());
}).catch((error) => {
  console.error(error);
});
```

上記コードが Windows で実行されたなら、次のような結果を返します：

```
Serial Port Path: COM13
```

もし上記コードが Raspbian で実行されたなら、次のような結果を返します：

```
Serial Port Path: /dev/ttyACM0
```

このメソッドは、USB 受信モジュールが [`connect()`](#AlpsEnv-connect-method) メソッドを使って接続されていなければ、空文字列を返します。

### <a id="AlpsEnv-onmessage-event-handler">onmessage イベントハンドラ</a>

`AlpsEnv` オブジェクトの `onmessage` プロパティは、USB 受信モジュールがセンサー子機からデータを受信したときに呼び出されるイベントハンドラです。

```JavaScript
AlpsEnv.onmessage = (data) => {
  console.log(JSON.stringify(data, null, '  '));
};
```

イベントハンドラ関数には、受信したデータを表すハッシュオブジェクトが引き渡されます。このハッシュオブジェクトは次のプロパティがセットされています：

プロパティ |型      |説明
:---------|:-------|:---------
`no`      | Number | センサー子機ごとの受信データのシーケンシャル番号。
`txid`    | Number | センサー子機の ID
`temp`    | Number | 温度 (°C)
`humi`    | Number | 湿度 (%)
`pres`    | Number | 気圧 (hPa)
`light`   | Number | 照度 (lx)
`door`    | Number | 開 (open) なら `1`, 閉 (close) なら `0`。
`vbat`    | Number | バッテリー電圧 (V)
`rssi`    | Number | RSSI (dBm)

センサー子機は、デフォルトでは 20 秒ごとにデータを送信します。しかし、ドアセンサーが反応した場合は、その場でデータを送信します。ただし、ドアセンサー反応のデータでは、`temp`, `humi`, `pres`, `light`, `vbat` プロパティの値は `0` になりますので、注意してください。

---------------------------------------
## <a id="Release-Note">リリースノート</a>

* v0.0.1 (2017-09-10)
  * First public release

---------------------------------------
## <a id="References">リファレンス</a>

* [アルプス電気 - 環境センサモジュール 開発キット](http://www.alps.com/j/iotsmart-environment/index.html)

---------------------------------------
## <a id="License">ライセンス</a>

The MIT License (MIT)

Copyright (c) 2017 Futomi Hatano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
