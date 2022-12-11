'use strict';

const { Device } = require('homey');
const GoeChargerApi = require('../lib/go-echarger-api-v1');

const POLL_INTERVAL = 5000;

class mainDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} start init.`);
    this._registerCapabilities();
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} init completed.`);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} has been added.`);
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
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} settings where changed.`);
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} was renamed.`);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} has been deleted.`);
    this.clearIntervals();
  }

  onDiscoveryResult(discoveryResult) {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} discovered - result: ${discoveryResult.id}.`);
    // Return a truthy value here if the discovery result matches your device.
    return discoveryResult.id === this.getData().id;
  }

  // This method will be executed once when the device has been found (onDiscoveryResult returned true)
  async onDiscoveryAvailable(discoveryResult) {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} available - result: ${discoveryResult.address}.`);
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} api version: ${discoveryResult.txt.protocol}.`);
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} type: ${discoveryResult.txt.devicetype}.`);
    this.api = new GoeChargerApi();
    this.api.address = discoveryResult.address;
    await this.setCapabilityValuesInterval();
    // await this.api.connect(); // When this throws, the device will become unavailable.
  }

  onDiscoveryAddressChanged(discoveryResult) {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} changed - result: ${discoveryResult.address}.`);
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} changed - result: ${discoveryResult.name}.`);
    // Update your connection details here, reconnect when the device is offline
    this.api.address = discoveryResult.address;
    // this.api.reconnect().catch(this.error);
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} offline - result: ${discoveryResult.address}.`);
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} offline - result: ${discoveryResult.name}.`);
    this.api.address = discoveryResult.address;
    // When the device is offline, try to reconnect here
    // this.api.reconnect().catch(this.error);
  }

  _registerCapabilities() {
    const capabilitySetMap = new Map([
      ['onoff_charging_allowed', this.setChargingAllowed],
      ['current_limit', this.setCurrentLimit],
      ['is_finished', null],
      ['is_charging', null]]);
    this.getCapabilities().forEach((capability) => this.registerCapabilityListener(capability, (value) => {
      return capabilitySetMap.get(capability).call(this, value).catch((e) => {
        return Promise.reject(e);
      });
    }));
  }

  async setChargingAllowed(_state) {
    try {
      if (_state) {
        if (!this.getCapabilityValue('onoff_charging_allowed')) {
          this.log(`[Device] ${this.getName()}:  ${this.getData().id} setChargingAllowed: 'TRUE'`);
          return Promise.resolve(await this.api.setGoeCharger('alw', 1));
        }
      } else if (this.getCapabilityValue('onoff_charging_allowed')) {
        this.log(`[Device] ${this.getName()}:  ${this.getData().id} setChargingAllowed: 'FALSE'`);
        return Promise.resolve(await this.api.setGoeCharger('alw', 0));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async setCurrentLimit(_limit) {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} setCurrentLimit: '${_limit}'`);
    try {
      if (_limit) {
        this.log(`[Device] ${this.getName()}:  ${this.getData().id} setCurrentLimit: '${_limit}'`);
        return Promise.resolve(await this.api.setGoeCharger('amp', _limit));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async setCapabilityValuesInterval() {
    try {
      this.log(`[Device] ${this.getName()}:  ${this.getData().id} onPollInterval =>`, POLL_INTERVAL);
      this.onPollInterval = setInterval(this.setCapabilityValues.bind(this), POLL_INTERVAL);
    } catch (error) {
      this.setUnavailable(error);
      this.log(error);
    }
  }

  async clearIntervals() {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} clearIntervals`);

    clearInterval(this.onPollInterval);
  }

}

module.exports = mainDevice;
