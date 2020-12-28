'use strict';

require('buffer');
const net = require('net');
const EventEmitter = require('events');
const reconnectCore = require('reconnect-core');

const reconnect = reconnectCore((...args) => { // Inject Reconnect
  return net.connect.apply(null, args);
});

const connections = {};

class HLK_SW16_DEVICE_CONNECTION extends EventEmitter {

  /*
  TODO: Figure out a way to do "Homey" style logging from this class
  TODO: Track keepalives from device and reconnect when keepalives stop
*/

  /**
 * HLK_SW16_DEVICE_CONNECTION Constructor
 * @param {string} ip          The IP Address of the device
 * @param {string} port        The port on which the Serial Server is listening
 * @param {string} instance    The UUID that defines the masterDevice in the connections object
 */
  constructor(ip, port, instance) {
    super();

    this.setMaxListeners(20); // The default max listeners is too low for all 16 device instances

    this._ip = ip;
    this._port = port;
    this._instance = instance;
    this.connected = false;

    setInterval(() => {
      if (this.listenerCount('connected') === 0) this.shutdown();
    }, 5000); // If we have no more listeners, it's time to shut down

    setInterval(() => {
      this.pollStatus();
    }, 5000);

    return this;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      let firstConnect = true;
      this._reconnect = reconnect({
        initialDelay: 1e3,
        maxDelay: 30e3,
        strategy: 'fibonacci',
        failAfter: Infinity,
        randomisationFactor: 0,
        immediate: false,
      }, socket => {
        this._socket = socket;
        this._socket.on('data', data => {
          this.onSocketData(data);
        });
      })
        .on('connect', () => {
          if (firstConnect) {
            firstConnect = false;
            resolve();
          }
          this.connected = true;

          // On reboot the state in homey and relay may be out of sync, update the state in homey.
          this.pollStatus();

          this.emit('connected');
        })
        .on('disconnect', () => {
          this.connected = false;
          this.emit('disconnected');
        })
        .on('error', () => {
          // Do nothing, just needs a listener to prevent crash of app
        })
        .on('reconnect', () => {
          // Do nothing, just needs a listener to prevent crash of app
        })
        .connect(this._port, this._ip);
    });
  }

  onSocketData(data) {
    const rawHex = data.toString('hex');
    if (!this.validate(rawHex)) return;

    const message = this.parse(rawHex);

    if (message.type === 'status') {
      for (const [channel, status] of Object.entries(message.channels)) {
        this.emit(`channel-${channel}`, status);
      }
    }
  }

  validate(rawHex) {
    if (rawHex.substring(0, 2) !== 'cc') return false; // Wrong data
    if (rawHex.length !== 40) return false; // Data not long enough
    return true;
  }

  parse(rawHex) {
    let message = {
      type: rawHex.substring(2, 4),
      payload: rawHex.substring(4, 36),
    };

    switch (message.type) {
      case '1f':
        message = {
          ...message,
          type: 'keepalive',
          year: parseInt(rawHex.substring(4, 6), 16),
          month: parseInt(rawHex.substring(6, 8), 16),
          day: parseInt(rawHex.substring(8, 10), 16),
          hour: parseInt(rawHex.substring(10, 12), 16),
          minute: parseInt(rawHex.substring(12, 14), 16),
          second: parseInt(rawHex.substring(14, 16), 16),
          week: parseInt(rawHex.substring(16, 18), 16),
        };
        break;
      case '0e':
        message = {
          ...message,
          type: 'keepalive',
          year: parseInt(rawHex.substring(16, 18), 16),
          month: parseInt(rawHex.substring(12, 14), 16),
          day: parseInt(rawHex.substring(10, 12), 16),
          hour: parseInt(rawHex.substring(8, 10), 16),
          minute: parseInt(rawHex.substring(6, 8), 16),
          second: parseInt(rawHex.substring(4, 6), 16),
          week: parseInt(rawHex.substring(14, 16), 16),
        };
        break;
      case '0c':
        message.type = 'status';
        message.channels = {};
        for (let i = 0; i < message.payload.length; i += 2) {
          const position = i / 2;
          let status = false;
          if (message.payload.substring(i, i + 2) === '01') status = true;
          message.channels[position] = status;
        }
        break;
      default:
        message.type = 'unknown';
        break;
    }

    return message;
  }

  pollStatus() {
    if (!this.connected) return false;
    return this._socket.write(Buffer.from('aa1e0101010101010101010101010101010101bb', 'hex'));
  }

  turnOn(channel) {
    if (!this.connected) return false;

    channel = +channel;// Force to int
    if (Number.isNaN(channel) || channel > 15 || channel < 0) return false;

    return this._socket.write(Buffer.from(`aa0f0${channel.toString(16)}01010101010101010101010101010101bb`, 'hex'));
  }

  turnOff(channel) {
    if (!this.connected) return false;

    channel = +channel;// Force to int
    if (Number.isNaN(channel) || channel > 15 || channel < 0) return false;

    return this._socket.write(Buffer.from(`aa0f0${channel.toString(16)}02010101010101010101010101010101bb`, 'hex'));
  }

  shutdown() {
    this._reconnect.disconnect();
    // Remove from connection list, garbage collection should take care of the rest
    delete connections[this._instance];
  }

}

module.exports = {
  HLK_SW16_DEVICE_CONNECTION,
  connections,
};
