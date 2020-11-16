'use strict';

const Homey = require('homey');
const { v4: uuidv4 } = require('uuid');
const net = require('net');

const checkIP = ip => {
  return net.isIPv4(ip);
};

const checkPort = port => {
  if (Number.isNaN(port)) return false;
  if (port < 0) return false;
  if (port > 65535) return false;
  return true;
};

const checkConnection = async (ip, port) => {
  return new Promise((resolve, reject) => {
    let sendResponse = false;
    const socket = net.createConnection(port, ip, () => {})
      .on('data', data => {
        const hex = data.toString('hex');
        if (hex.substring(0, 2) !== 'cc' && hex.length !== 40) {
          reject();
        } else {
          resolve();
        }
        sendResponse = true;
        socket.destroy();
      }).on('error', error => {
        if (!sendResponse) {
          sendResponse = true;
          reject(error);
        }
        socket.destroy();
      }).on('close', () => {
        if (!sendResponse) {
          sendResponse = true;
          reject();
        }
      })
      .on('timeout', () => {
        if (!sendResponse) {
          sendResponse = true;
          reject();
        }
        socket.destroy();
      });
    socket.setTimeout(5000);
  });
};

class HLK_SW16 extends Homey.Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('HLK_SW16 has been initialized');
  }

  async onPair(session) {
    let ip; let
      port = false;

    session.on('pair', async (data, callback) => {
      ip = data.ip;
      port = data.port;

      if (!ip || !port) return callback(new Error(Homey.__('pair.check_input')));
      if (!checkIP(ip)) return callback(new Error(Homey.__('pair.check_ip')));
      if (!checkPort(port)) return callback(new Error(Homey.__('pair.check_port')));

      try {
        await checkConnection(ip, port);
      } catch (error) {
        return callback(new Error(Homey.__('pair.unable_to_connect')));
      }

      return callback();
    });

    session.on('list_devices', () => {
      const devices = [];
      const masterDevice = uuidv4();
      for (let channel = 0; channel < 16; channel++) {
        devices.push({
          name: `HLK-SW16 Relay ${channel + 1}`,
          data: {
            id: uuidv4(),
          },
          store: {
            ip,
            port,
            channel,
            masterDevice,
          },
        });
      }
      session.emit('list_devices', devices);
    });
  }

}

module.exports = HLK_SW16;
