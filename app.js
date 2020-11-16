'use strict';

const Homey = require('homey');

class HiLinkApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log(`${Homey.manifest.id} has been initialized`);
  }

}

module.exports = HiLinkApp;
