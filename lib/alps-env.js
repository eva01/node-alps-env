/* ------------------------------------------------------------------
* node-alps-env - alps-env.js
*
* Copyright (c) 2017, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2017-09-09
* ---------------------------------------------------------------- */
'use strict';
const mOs = require('os');
const mSerialPort = require('serialport');

/* ------------------------------------------------------------------
* Constructor: AlpsEnv()
* ---------------------------------------------------------------- */
const AlpsEnv = function() {
	// Plublic properties
	this.onmessage = null;
	// Private properties
	this._SERIAL_BAUD_RATE = 115200;
	this._port = null;
	this._connected = false;
	this._ondata = () => {};
	this._packet_buffer = null;
	this._request_timer = null;
	this._serial_port_path = '';
};

/* ------------------------------------------------------------------
* Method: connect([params])
* - params     | optional | Object |
*   - path     | optional | String | e.g., "COM3", "/dev/tty-usbserial1"
* ---------------------------------------------------------------- */
AlpsEnv.prototype.connect = function(params) {
	let promise = new Promise((resolve, reject) => {
		if(params) {
			if(typeof(params) !== 'object') {
				reject(new Error('Invaid parameter.'));
				return;
			}
		} else {
			params = {};
		}
		// Check the parameter `path`
		let path = '';
		if('path' in params) {
			path = params['path'];
			if(typeof(path) !== 'string') {
				reject(new Error('The parameter `path` must be a string.'));
				return;
			}
		}
		// Open the serial port
		this._openSerialPort({
			path: path,
			baudRate: this._SERIAL_BAUD_RATE
		}).then(() => {
			this._ondata = (buf) => {
				if(this.onmessage && typeof(this.onmessage) === 'function') {
					let parsed = this._parseIncomingPacket(buf);
					if(parsed) {
						this.onmessage(parsed);
					}
				}
			};
			resolve();
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

AlpsEnv.prototype._openSerialPort = function(p) {
	let promise = new Promise((resolve, reject) => {
		if(this._connected === true) {
			resolve();
			return;
		}
		mSerialPort.list().then((com_list) => {
			let candidate_com_list = [];
			let pf = mOs.platform();
			if(p['path']) {
				com_list.forEach((com) => {
					if(com.comName === p['path']) {
						candidate_com_list.push(com);
					}
				});
			} else if(pf === 'linux') {
				// ------------------------------------------------
				// * linux
				// {
				//   manufacturer: 'FTDI',
				//   serialNumber: 'AK04TRVZ',
				//   pnpId: 'usb-FTDI_FT232R_USB_UART_AK04TRVZ-if00-port0',
				//   locationId: undefined,
				//   vendorId: '0403',
				//   productId: 'FT232R USB UART',
				//   comName: '/dev/ttyUSB0'
				// }
				// ------------------------------------------------
				com_list.forEach((com) => {
					if(com.vendorId && com.vendorId.match(/0403/) && com.productId && com.productId.match(/FT232R USB UART/, 'i')) {
						candidate_com_list.push(com);
					}
				});
			} else if(pf === 'win32') {
				// ------------------------------------------------
				// * win32
				// {
				//   comName: 'COM14',
				//   manufacturer: 'FTDI',
				//   serialNumber: undefined,
				//   pnpId: 'FTDIBUS\\VID_0403+PID_6001+AK04TRWIA\\0000',
				//   locationId: undefined,
				//   vendorId: '0403',
				//   productId: '6001'
				// }
				// ------------------------------------------------
				com_list.forEach((com) => {
					if(com.vendorId && com.vendorId.match(/0403/) && com.productId && com.productId.match(/6001/, 'i')) {
						candidate_com_list.push(com);
					}
				});
			} else if(pf === 'darwin') {
				// ------------------------------------------------
				// * darwin
				// {
				//   comName: '/dev/tty.usbserial-AK04TRVZ',
				//   manufacturer: 'FTDI',
				//   serialNumber: 'AK04TRVZ',
				//   pnpId: undefined,
				//   locationId: '14110000',
				//   vendorId: '0403',
				//   productId: '6001'
				// }
				// ------------------------------------------------
				com_list.forEach((com) => {
					if(com.comName.match(/usb/) && com.vendorId && com.vendorId.match(/0403/) && com.productId && com.productId.match(/6001/, 'i')) {
						candidate_com_list.push(com);
					}
				});
			}
			return this._tryOpenSerialPort(p['baudRate'], candidate_com_list);
		}).then(() => {
			resolve();
		}).catch((error) => {
			reject(error);
		});
	});
	return promise;
};

AlpsEnv.prototype._tryOpenSerialPort = function(baud_rate, com_list) {
	let promise = new Promise((resolve, reject) => {
		let e = null;
		let tryConnect = (callback) => {
			let com = com_list.shift();
			if(!com) {
				callback(e || new Error('No device was found.'));
				return;
			}
			let path = com.comName;
			let port = new mSerialPort(path, {
				baudRate: baud_rate
			});
			port.once('error', (error) => {
				e = error;
				this._connected = false;
				port = null;
				tryConnect(callback);
			});
			port.once('open', () => {
				this._initSerialPort(port);
				this.request('set1').then((res) => {
					if(res !== 'SET OK') {
						throw new Error('The path `' + path + '` is invalid.');
					}
					return this._waitPromise(100);
				}).then(() => {
					return this.request('CHN?');
				}).then((res) => {
					if(/^CHN\=(\d+)$/.test(res)) {
						callback(null, path);
					} else {
						throw new Error('The path `' + path + '` is invalid.');
					}
				}).catch((error) => {
					port.close(() => {
						port = null;
						tryConnect(callback);
					});
				});
			});
		};
		tryConnect((error, path) => {
			if(error) {
				reject(error);
			} else {
				this._serial_port_path = path;
				resolve()
			}
		});
	});
	return promise;
};

AlpsEnv.prototype._waitPromise = function(ms) {
	let promise = new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
	return promise;
};

AlpsEnv.prototype._initSerialPort = function(port) {
	this._connected = true;
	this._port = port;
	this._packet_buffer = null;
	this._port.on('data', (buf) => {
		if(!buf) {
			return;
		}
		if(this._packet_buffer === null) {
			this._packet_buffer = buf;
		} else {
			this._packet_buffer = Buffer.concat([this._packet_buffer, buf]);
		}
		if(this._packet_buffer.readUInt8(this._packet_buffer.length - 1) === 0x0d) {
			this._ondata(this._packet_buffer);
			this._packet_buffer = null;
		}
	});
	this._port.once('close', () => {
		this._port.removeAllListeners('data');
		this._connected = false;
		this._port = null;
		this._serial_port_path = '';
	});
};

AlpsEnv.prototype._parseIncomingPacket = function(buf) {
	let s = buf.toString('ascii');
	let lines = s.split(/\r/);
	let message = lines.join("\n");
	message = message.replace(/\n+$/, '');
	let m = message.match(/^No\.(\d+),/);
	if(m) {
		let parsed = {};
		parsed['no'] = parseInt(m[1], 10);
		let pairs = message.split(/,\s+/);
		pairs.forEach((pair) => {
			let m = pair.match(/^([A-Za-z0-9]+)\=\s*([0-9\.\+\-\s]+)/);
			if(m) {
				let k = m[1].toLowerCase();
				let v = m[2].replace(/\s+/, '');
				parsed[k] = parseFloat(v);
			}
		});
		return parsed;
	} else {
		return null;
	}
};

/* ------------------------------------------------------------------
* Method: disconnect()
* ---------------------------------------------------------------- */
AlpsEnv.prototype.disconnect = function() {
	let promise = new Promise((resolve, reject) => {
		this._ondata = () => {};
		if(this._port && this._connected === true) {
			this._port.close(() => {
				resolve();
			});
		} else {
			resolve();
		}
	});
	return promise;
};

/* ------------------------------------------------------------------
* Method: getSerialPortPath()
* ---------------------------------------------------------------- */
AlpsEnv.prototype.getSerialPortPath = function() {
	return this._serial_port_path;
};

/* ------------------------------------------------------------------
* Method: request(cmd)
* ---------------------------------------------------------------- */
AlpsEnv.prototype.request = function(cmd) {
	let promise = new Promise((resolve, reject) => {
		if(this._connected !== true) {
			reject(new Error('The device is not connected.'));
			return;
		}
		if(this._request_timer) {
			reject(new Error('The previous process is running.'));
			return;
		}
		let timeout = 1000;
		this._request_timer = setTimeout(() => {
			this._request_timer = null;
			reject(new Error('Timeout.'));
		}, timeout);

		this._ondata = (buf) => {
			if(this._request_timer) {
				clearTimeout(this._request_timer);
				this._request_timer = null;
			}
			let s = buf.toString('ascii');
			let lines = s.split(/\r/);
			if(lines[0] === cmd) {
				lines.shift();
			}
			let res = lines.join("\n");
			res = res.replace(/\n+$/, '');
			resolve(res);
		};

		let cmd_buf = Buffer.from(cmd + "\r\n", 'utf8');
		this._port.write(cmd_buf);
	});
	return promise;
};

module.exports = new AlpsEnv();
