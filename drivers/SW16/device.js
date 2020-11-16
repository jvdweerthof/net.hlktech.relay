'use strict';

const Homey = require('homey');
const { HLK_SW16_DEVICE_CONNECTION, connections } = require('./connection.js');

class HLK_SW16_DEVICE extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('HLK_SW16_DEVICE has been initialized');

    /*
    Get connection to the device
    The connection is shared with other devices having the same getStoreValue('masterDevice')
    */
    const masterDevice = this.getStoreValue('masterDevice');
    if (!Object.keys(connections).includes(masterDevice)) {
      const ip = this.getStoreValue('ip');
      const port = this.getStoreValue('port');
      this.log(`HLK_SW16_DEVICE_CONNECTION for ${ip}:${port} does not yet exist`);
      connections[masterDevice] = new HLK_SW16_DEVICE_CONNECTION(ip, port, masterDevice);
      connections[masterDevice].connect();
    }
    if (connections[masterDevice].connected) this.setAvailable();

    /* Set listeners */
    connections[masterDevice].on(`channel-${this.getStoreValue('channel')}`, this.onStatusUpdate.bind(this));
    connections[masterDevice].on('connected', () => {
      this.setAvailable();
    });
    connections[masterDevice].on('disconnected', () => {
      this.setUnavailable();
    });
    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
  }

  /**
   * onCapabilityOnOff is called when the user turns on/off the device.
   * @param {boolean} status
   */
  async onCapabilityOnOff(status) {
    this.log(`Capability OnOff changed to ${status}`);
    if (status) return connections[this.getStoreValue('masterDevice')].turnOn(this.getStoreValue('channel'));
    return connections[this.getStoreValue('masterDevice')].turnOff(this.getStoreValue('channel'));
  }

  /**
 * onStatusUpdate is called when the status is updated by the device.
 * @param {boolean} status
 */
  onStatusUpdate(status) {
    if (this.getCapabilityValue('onoff') !== status) this.setCapabilityValue('onoff', status);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('HLK_SW16_DEVICE has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('HLK_SW16_DEVICE settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('HLK_SW16_DEVICE was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('HLK_SW16_DEVICE has been deleted');
  }

}

module.exports = HLK_SW16_DEVICE;
