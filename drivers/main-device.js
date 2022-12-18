'use strict';

const { Device } = require('homey');
const GoeChargerApi = require('../lib/go-echarger-api-v1');
const { sleep, decrypt, encrypt } = require('../lib/helpers');


const POLL_INTERVAL = 5000;

class mainDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} start init.`);
    this.setUnavailable(`Initializing ${this.getName()}`);

    await this.checkCapabilities();
    await this.setCapabilityListeners();

  } catch (error) {
    this.homey.app.log(`[Device] ${this.getName()} - OnInit Error`, error);
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
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} type: ${discoveryResult.txt.devicetype}.`);
    this.api = new GoeChargerApi();
    this.api.address = discoveryResult.address;
    await this.setCapabilityValues(true);
    await this.setAvailable();
    await sleep(5000);
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

  async setCapabilityListeners() {
    await this.registerCapabilityListener('onoff_charging_allowed', this.onCapability_ONOFF_CHARGING.bind(this));
    await this.registerCapabilityListener('current_limit', this.onCapability_CURRENT_LIMIT.bind(this));
  }

  async onCapability_ONOFF_CHARGING(value) {
    let alw=0;
    if(value) { alw=1; }
    try {
      if (value !== this.getCapabilityValue('onoff_charging_allowed')) {
        this.log(`[Device] ${this.getName()}:  ${this.getData().id} set OnOff Charging Allowed: '${value}'`);
        return Promise.resolve(await this.api.setGoeCharger('alw', alw));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async onCapability_CURRENT_LIMIT(value) {
    try {
      if (value !== this.getCapabilityValue('current_limit')) {
        this.log(`[Device] ${this.getName()}:  ${this.getData().id} setCurrentLimit: '${value}'`);
        return Promise.resolve(await this.api.setGoeCharger('amp', value));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async setCapabilityValues(check = false) {

    try {
      const infoJson = await this.api.getInfo();
      const oldStatus = await this.getCapabilityValue('status');

      if (infoJson) {
        await this.setAvailable();

        await this.setValue('measure_power', infoJson.measure_power, check);
        await this.setValue('measure_current', infoJson.measure_current, check);
        await this.setValue('measure_voltage', infoJson.measure_voltage, check);
        await this.setValue('measure_temperature', infoJson.measure_temperature, check);
        await this.setValue('measure_temperature.internal', infoJson.measure_temperature, check);
        await this.setValue('measure_temperature.charge_port', infoJson.measure_temperature, check);
        await this.setValue('meter_power', infoJson.meter_power, check);
        await this.setValue('onoff_charging_allowed', infoJson.onoff_charging_allowed, check);
        await this.setValue('current_limit', infoJson.current_limit, check);
        await this.setValue('current_max', infoJson.current_max, check);
        await this.setValue('is_connected', infoJson.is_connected, check);
        await this.setValue('is_device_error', infoJson.is_device_error, check);
        await this.setValue('energy_total', infoJson.energy_total, check);

        // Check for status change and trigger accordingly
        await this.setValue('status', infoJson.status, check);
        if (infoJson.status !== oldStatus) {
          if(infoJson.status === 'station_idle') {
            await this.setValue('is_charging', false);
          }
          if(infoJson.status === 'car_charging') {
            await this.setValue('is_charging', true);
          }
          if(infoJson.status === 'car_waiting') {
            await this.setValue('is_charging', false);
          }
          if(infoJson.status === 'car_finished') {
            await this.setValue('is_charging', false);
          }
        }
      }
    } catch (e) {
      this.setUnavailable(e);
      // console.log(e);
      return 'not connected';
    }
  }

  async setValue(key, value, firstRun = false, delay = 10) {
    if (this.hasCapability(key)) {
        const oldVal = await this.getCapabilityValue(key);

        // this.homey.app.log(`[Device] ${this.getName()} - setValue - oldValue => ${key} => `, oldVal, value);

        if (delay) {
            await sleep(delay);
        }

        await this.setCapabilityValue(key, value);

        if (typeof value === 'boolean' && oldVal !== value && !firstRun) {
            const newKey = key.replace('.', '_');
            const triggers = this.homey.manifest.flow.triggers;
            const triggerExists = triggers.find((trigger) => trigger.id === `${newKey}_changed`);

            if (triggerExists) {
                await this.homey.flow
                    .getDeviceTriggerCard(`${newKey}_changed`)
                    .trigger(this)
                    .catch(this.error)
                    .then(this.homey.app.log(`[Device] ${this.getName()} - setValue ${newKey}_changed - Triggered: "${newKey} | ${value}"`));
            }
        }
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

  // ------------- Capabilities -------------
  async checkCapabilities() {
    const driverManifest = this.driver.manifest;
    const driverCapabilities = driverManifest.capabilities;

    const deviceCapabilities = this.getCapabilities();

    this.homey.app.log(`[Device] ${this.getName()} - Found capabilities =>`, deviceCapabilities);
    this.homey.app.log(`[Device] ${this.getName()} - Driver capabilities =>`, driverCapabilities);

    if (deviceCapabilities.length !== driverCapabilities.length) {
        await this.updateCapabilities(driverCapabilities, deviceCapabilities);
    }

    return deviceCapabilities;
  }

  async updateCapabilities(driverCapabilities, deviceCapabilities) {
    this.homey.app.log(`[Device] ${this.getName()} - Add new capabilities =>`, driverCapabilities);
    try {
        deviceCapabilities.forEach((c) => {
            this.removeCapability(c);
        });
        await sleep(2000);
        driverCapabilities.forEach((c) => {
          this.addCapability(c);
        });
        await sleep(2000);
    } catch (error) {
        this.homey.app.log(error);
    }
  }

}

module.exports = mainDevice;
