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

  async setCapabilityValues() {
    let device = this;
    let tokens = {};
    let state = {};

    try {
      // this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - last status: '${this.getStoreValue('old_status')}'`);
      // this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - last chargingAllowed: '${this.getStoreValue('old_chargingAllowed')}'`);

      const infoJson = await this.api.getInfo();
      if (infoJson) {
        this.setAvailable();
        this.setCapabilityValue('onoff_charging_allowed', infoJson.onoff_charging_allowed);
        this.setCapabilityValue('meter_power', infoJson.meter_power);
        this.setCapabilityValue('measure_power', infoJson.measure_power);
        this.setCapabilityValue('measure_current', infoJson.measure_current);
        this.setCapabilityValue('measure_voltage', infoJson.measure_voltage);
        this.setCapabilityValue('measure_temperature', infoJson.measure_temperature);
        this.setCapabilityValue('status', infoJson.status);
        this.setCapabilityValue('is_device_error', infoJson.is_device_error);
        this.setCapabilityValue('current_limit', infoJson.current_limit);
        this.setCapabilityValue('current_max', infoJson.current_max);
        this.setCapabilityValue('energy_total', infoJson.energy_total);
    
        // Check for status change and trigger accordingly
        if (infoJson.status !== this.getStoreValue('old_status')) {
          // this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - new status: '${infoJson.status}'`);    
          this.driver.triggerStatusChanged(device, tokens, state);

          // Check the actual status and trigger flows

          // Station became idle, so the car was also disconnected and the station is not charging
          // Charge sessions ended
          if(infoJson.status === 'station_idle' && (this.getStoreValue('old_status') === 'car_charging' || this.getStoreValue('old_status') === 'car_waiting') ) {
            this.setCapabilityValue('is_plugged_in', false);
            this.driver.triggerCarUnplugged(device, tokens, state);
            this.setCapabilityValue('is_charging', false);
            this.driver.triggerChargingEnded(device, tokens, state);
            this.setCapabilityValue('is_finished', true);
            this.driver.triggerChargingFinished(device, tokens, state);
          }
          // Started charging, car was already connected and waiting
          if(infoJson.status === 'car_charging' && (this.getStoreValue('old_status') === 'station_idle' || this.getStoreValue('old_status') === 'car_waiting') ) {
            this.setCapabilityValue('is_finished', false);
            this.setCapabilityValue('is_charging', true);
            this.driver.triggerChargingStarted(device, tokens, state);
          }
          // Stopped charging, car is connected and waiting and station was not idle
          if(infoJson.status === 'car_waiting' && (this.getStoreValue('old_status') === 'car_charging' || this.getStoreValue('old_status') !== 'station_idle') ) {
            this.setCapabilityValue('is_finished', false);
            this.setCapabilityValue('is_charging', false);
            this.driver.triggerChargingEnded(device, tokens, state);
          }
        }

        // Check for chargingAllowed status change and trigger accordingly
        if (this.getStoreValue('old_chargingAllowed') != null) {
          if (infoJson.onoff_charging_allowed !== this.getStoreValue('old_chargingAllowed')) {
            // this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - new chargingAllowed: '${infoJson.onoff_charging_allowed}'`);
            if (infoJson.onoff_charging_allowed === true) {
              this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - charging_allowed: 'TRUE'`);
              this.driver.triggerChargingAllowed(device, tokens, state);
            }
            if (infoJson.onoff_charging_allowed === false) {
              this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - charging_allowed: 'FALSE'`);
              this.driver.triggerChargingDisallowed(device, tokens, state);
            }
          }
        }

        // Store updated status and chargingAllowed to old states
        this.setStoreValue('old_status', infoJson.status);
        this.setStoreValue('old_chargingAllowed', infoJson.onoff_charging_allowed);
      }
    } catch (e) {
      this.setUnavailable(e);
      // console.log(e);
      return 'not connected';
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
