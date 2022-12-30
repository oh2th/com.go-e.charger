'use strict';

const { Device } = require('homey');
const { sleep } = require('../lib/helpers');
const GoeChargerApi = require('../lib/go-echarger-api');

const POLL_INTERVAL = 5000;

class mainDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log(`[Device] ${this.getName()}: ${this.getData().id} start init.`);
    this.setUnavailable(`Initializing ${this.getName()}`);

    const settings = this.getSettings();
    this.api = new GoeChargerApi();
    this.api.address = settings.address;
    this.api.driver = this.driver.id;

    await this.checkCapabilities();
    await this.setCapabilityListeners();
    await this.setCapabilityValues(true);
    await sleep(5000);
    await this.setAvailable();
    await this.setCapabilityValuesInterval();

    this.setSettings({
      driver: this.api.driver,
    });
  }

  catch(error) {
    this.log(`[Device] ${this.getName()} - OnInit Error`, error);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log(`[Device] ${this.getName()}: ${this.getData().id} has been added.`);
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
    this.log(`[Device] ${this.getName()}: ${this.getData().id} settings where changed: ${changedKeys}`);
    this.api.address = newSettings.address;
    try {
      const initialInfo = await this.api.getInfo();
      this.log(`[Device] ${this.getName()}: ${this.getData().id} new settings OK.`);
      this.setAvailable();
      return Promise.resolve(initialInfo);
    } catch (error) {
      this.setUnavailable(error);
      return Promise.reject(error);
    }
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log(`[Device] ${this.getName()}: ${this.getData().id} was renamed.`);
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log(`[Device] ${this.getName()}: ${this.getData().id} has been deleted.`);
    this.clearIntervals();
  }

  onDiscoveryResult(discoveryResult) {
    this.log(`[Device] ${this.getName()}: ${this.getData().id} discovered - result: ${discoveryResult.id}.`);
    // Return a truthy value here if the discovery result matches your device.
    return discoveryResult.id === this.getData().id;
  }

  // This method will be executed once when the device has been found (onDiscoveryResult returned true)
  async onDiscoveryAvailable(discoveryResult) {
    this.log(`[Device] ${this.getName()}: ${this.getData().id} available - result: ${discoveryResult.address}.`);
    this.log(`[Device] ${this.getName()}: ${this.getData().id} type: ${discoveryResult.txt.devicetype}.`);
    this.api.address = discoveryResult.address;
    await this.setSettings({
      address: this.api.address,
    });
    await this.setAvailable();
  }

  onDiscoveryAddressChanged(discoveryResult) {
    this.log(`[Device] ${this.getName()}: ${this.getData().id} changed - result: ${discoveryResult.address}.`);
    this.log(`[Device] ${this.getName()}: ${this.getData().id} changed - result: ${discoveryResult.name}.`);
    // Update your connection details here, reconnect when the device is offline
    this.api.address = discoveryResult.address;
    this.setSettings({
      address: this.api.address,
    });
    this.setAvailable();
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    this.log(`[Device] ${this.getName()}: ${this.getData().id} offline - result: ${discoveryResult.address}.`);
    this.log(`[Device] ${this.getName()}: ${this.getData().id} offline - result: ${discoveryResult.name}.`);
    this.api.address = discoveryResult.address;
    this.setSettings({
      address: this.api.address,
    });
    this.setUnavailable('Disovery device offline.');
  }

  async setCapabilityListeners() {
    this.registerCapabilityListener('is_allowed', this.onCapability_CHARGING_ALLOWED.bind(this));
    this.registerCapabilityListener('single_phase_charging', this.onCapability_SINGLE_PHASE.bind(this));
    this.registerCapabilityListener('current_limit', this.onCapability_CURRENT_LIMIT.bind(this));
  }

  async onCapability_CHARGING_ALLOWED(value) {
    let val = 0;
    try {
      if (value !== this.getCapabilityValue('is_allowed')) {
        this.log(`[Device] ${this.getName()}: ${this.getData().id} set is_allowed: '${val}'`);
        if (this.api.driver === 'go-eCharger_V1' || this.api.driver === 'go-eCharger_V2') {
          if (value) val = 1; // Enable charging
          return Promise.resolve(await this.api.setGoeChargerValue('alw', val));
        }
        if (!value) val = 1; // Enable charging - API v2 (frc) forceState (Neutral=0, Off=1, On=2)
        return Promise.resolve(await this.api.setGoeChargerValue('frc', val));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async onCapability_SINGLE_PHASE(value) {
    let val = 2; // Force three phase
    if (value) val = 1; // Force single phase
    try {
      if (value !== this.getCapabilityValue('single_phase_charging')) {
        this.log(`[Device] ${this.getName()}: ${this.getData().id} set single_phase_charging: '${val}'`);
        await this.setValue('single_phase_charging', value, false);
        return Promise.resolve(await this.api.setGoeChargerValue('psm', val));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async onCapability_CURRENT_LIMIT(value) {
    try {
      if (value !== this.getCapabilityValue('current_limit')) {
        this.log(`[Device] ${this.getName()}: ${this.getData().id} set current_limit: '${value}'`);
        return Promise.resolve(await this.api.setGoeChargerValue('amp', value));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async setCapabilityValues(check = false) {
    try {
      const deviceInfo = await this.api.getInfo();
      const oldStatus = await this.getCapabilityValue('status');
      const currentLimitOpts = await this.getCapabilityOptions('current_limit');

      if (deviceInfo) {
        // console.log(JSON.stringify(deviceInfo));
        await this.setAvailable();

        await this.setValue('measure_power', deviceInfo['measure_power'], check);
        await this.setValue('measure_current', deviceInfo['measure_current'], check);
        await this.setValue('measure_voltage', deviceInfo['measure_voltage'], check);
        await this.setValue('measure_temperature', deviceInfo['measure_temperature'], check);
        await this.setValue('measure_temperature.charge_port', deviceInfo['measure_temperature.charge_port'], check);
        await this.setValue('meter_power', deviceInfo['meter_power'], check);
        await this.setValue('meter_power.session', deviceInfo['meter_power.session'], check);
        await this.setValue('is_allowed', deviceInfo['is_allowed'], check);
        await this.setValue('single_phase_charging', deviceInfo['single_phase_charging'], check);
        await this.setValue('cable_limit', deviceInfo['cable_limit'], check);
        await this.setValue('current_limit', deviceInfo['current_limit'], check);
        await this.setValue('current_max', deviceInfo['current_max'], check);
        await this.setValue('alarm_device', deviceInfo['alarm_device'], check);

        // Check for device's maximum current configuration and connected Type-2 cables ampere coding
        // and adjust device current_limit capability maximum setting value for the lesser.
        if (currentLimitOpts.max !== deviceInfo.current_max) {
          if (deviceInfo.cable_limit > deviceInfo.current_max || (deviceInfo.cable_limit === 0 || deviceInfo.cable_limit === null)) {
            this.log(`[Device] ${this.getName()}: ${this.getData().id} setCurrentLimitOpts device Max: '${deviceInfo.current_max}'`);
            await this.setCapabilityOptions('current_limit', { max: deviceInfo.current_max });
          } else {
            this.log(`[Device] ${this.getName()}: ${this.getData().id} setCurrentLimitOpts cable Max: '${deviceInfo.cable_limit}'`);
            await this.setCapabilityOptions('current_limit', { max: deviceInfo.cable_limit });
          }
        }

        // Check for status change and trigger accordingly
        await this.setValue('status', deviceInfo.status, check);
        if (deviceInfo.status !== oldStatus) {
          if (deviceInfo.status === 'station_idle') {
            await this.setValue('is_connected', false);
            await this.setValue('is_charging', false);
          }
          if (deviceInfo.status === 'car_charging') {
            await this.setValue('is_connected', true);
            await this.setValue('is_charging', true);
          }
          if (deviceInfo.status === 'station_waiting') {
            await this.setValue('is_connected', true);
            await this.setValue('is_charging', false);
          }
          if (deviceInfo.status === 'car_finished') {
            await this.setValue('is_connected', true);
            await this.setValue('is_charging', false);
          }
        }
      }
    } catch (error) {
      this.setUnavailable(error);
      this.log(error);
    }
  }

  async setValue(key, value, firstRun = false, delay = 10) {
    if (this.hasCapability(key)) {
      const oldVal = await this.getCapabilityValue(key);

      if (oldVal !== value) {
        this.log(`[Device] ${this.api.driver} ${this.getName()} - setValue - oldValue => ${key} => `, oldVal, value);
      }

      if (delay) await sleep(delay);

      await this.setCapabilityValue(key, value);

      //
      // Capability triggers
      //

      if (typeof value === 'boolean' && key.startsWith('is_') && oldVal !== value && !firstRun) {
        const newKey = key.replace(/\./g, '_');
        const { triggers } = this.homey.manifest.flow;
        const triggerExists = triggers.find((trigger) => trigger.id === `${newKey}_changed`);

        if (triggerExists) {
          await this.homey.flow
            .getDeviceTriggerCard(`${newKey}_changed`)
            .trigger(this, { [`${key}`]: value })
            .catch(this.error)
            .then(this.log(`[Device] ${this.getName()} - setValue ${newKey}_changed - Triggered: "${newKey} | ${value}"`));
        }
      }
    }
  }

  async setCapabilityValuesInterval() {
    try {
      this.log(`[Device] ${this.getName()}: ${this.getData().id} onPollInterval =>`, POLL_INTERVAL);
      this.onPollInterval = setInterval(this.setCapabilityValues.bind(this), POLL_INTERVAL);
    } catch (error) {
      this.setUnavailable(error);
      this.log(error);
    }
  }

  async clearIntervals() {
    try {
      this.log(`[Device] ${this.getName()}: ${this.getData().id} clearIntervals`);
      clearInterval(this.onPollInterval);
    } catch (error) {
      this.log(error);
    }
  }

  // ------------- Check if Capabilities has changed and update them -------------
  async checkCapabilities() {
    try {
      const driverManifest = this.driver.manifest;
      const driverCapabilities = driverManifest.capabilities;
      const deviceCapabilities = this.getCapabilities();

      this.log(`[Device] ${this.getName()} - checkCapabilities for`, driverManifest.id);
      this.log(`[Device] ${this.getName()} - Found capabilities =>`, deviceCapabilities);

      await this.updateCapabilities(driverCapabilities, deviceCapabilities);

      return deviceCapabilities;
    } catch (error) {
      this.log(error);
    }
  }

  async updateCapabilities(driverCapabilities, deviceCapabilities) {
    try {
      const newC = driverCapabilities.filter((d) => !deviceCapabilities.includes(d));
      const oldC = deviceCapabilities.filter((d) => !driverCapabilities.includes(d));

      this.log(`[Device] ${this.getName()} - Got old capabilities =>`, oldC);
      this.log(`[Device] ${this.getName()} - Got new capabilities =>`, newC);

      oldC.forEach((c) => {
        this.log(`[Device] ${this.getName()} - updateCapabilities => Remove `, c);
        this.removeCapability(c);
      });
      await sleep(2000);
      newC.forEach((c) => {
        this.log(`[Device] ${this.getName()} - updateCapabilities => Add `, c);
        this.addCapability(c);
      });
      await sleep(2000);
    } catch (error) {
      this.log(error);
    }
  }

}

module.exports = mainDevice;
