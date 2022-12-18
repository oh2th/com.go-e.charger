'use strict';

const Homey = require('homey');
const flowConditions = require('./lib/flows/conditions');

class GoeCharger extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log(`${this.homey.manifest.id} - ${this.homey.manifest.version} started...`);

    // await flowActions.init(this.homey);
    await flowConditions.init(this.homey);

    this.log('go-eCharger app has been initialized');
  }

}

module.exports = GoeCharger;
