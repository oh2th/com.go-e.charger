/* eslint-disable consistent-return */

'use strict';

const { Device } = require('homey');
const GoeChargerApi = require('../lib/go-echarger-api-v1');

const POLL_INTERVAL = 5000;

class mainDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} (${this.getStoreValue('address')}) start init.`);
    this._registerCapabilities();
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} init completed.`);

    // Register Flow Card Conditions
    const isCompletedCondition = this.homey.flow.getConditionCard('is_finished');
    isCompletedCondition.registerRunListener(async (args, state) => {
      const result = this.getCapabilityValue('is_finished');
      return Promise.resolve(result);
    });
    const isChargingCondition = this.homey.flow.getConditionCard('is_charging');
    isChargingCondition.registerRunListener(async (args, state) => {
      const result = this.getCapabilityValue('is_charging');
      return Promise.resolve(result);
    });
    const isAllowedCondition = this.homey.flow.getConditionCard('is_allowed');
    isAllowedCondition.registerRunListener(async (args, state) => {
      const result = this.getCapabilityValue('onoff');
      return Promise.resolve(result);
    });
    const isPluggedCondition = this.homey.flow.getConditionCard('is_plugged_in');
    isPluggedCondition.registerRunListener(async (args, state) => {
      const result = this.getCapabilityValue('is_plugged_in');
      return Promise.resolve(result);
    });
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
  }

  onDiscoveryResult(discoveryResult) {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} discovered - result: ${discoveryResult.id}.`);
    // Return a truthy value here if the discovery result matches your device.
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} available - result: ${discoveryResult.address}.`);
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} api version: ${discoveryResult.txt.protocol}.`);
    this.log(`[Device] ${this.getName()}:  ${this.getData().id} type: ${discoveryResult.txt.devicetype}.`);
    this.api = new GoeChargerApi(discoveryResult.address);
    this.interval = setInterval(() => {
      try {
        this.log('=============refresh state=============');
        const _statusOld = this.getCapabilityValue('old_status');
        this.log(`old_status: '${_statusOld}'`);
        const _onOffOld = this.getCapabilityValue('old_onoff');
        this.log(`old_onoff: '${_onOffOld}'`);
        this._pollChargerState(_statusOld, _onOffOld);
      } catch (e) {
        return e;
      }
    }, POLL_INTERVAL);

    // This method will be executed once when the device has been found (onDiscoveryResult returned true)
    // this.api = new GoeChargerV2Api(discoveryResult.address);
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
    this.setStoreValue('address', discoveryResult.address);
    // When the device is offline, try to reconnect here
    // this.api.reconnect().catch(this.error);
  }

  _registerCapabilities() {
    const capabilitySetMap = new Map([
      ['onoff', this._setChargingAllowed],
      ['charge_amp', this._setChargeCurrent],
      ['is_finished', null],
      ['is_charging', null]]);
    this.getCapabilities().forEach((capability) => this.registerCapabilityListener(capability, (value) => {
      return capabilitySetMap.get(capability).call(this, value).catch((e) => {
        return Promise.reject(e);
      });
    }));
  }

  async _pollChargerState(_statusOld, _allowChargingOld) {
    try {
      const infoJson = await this.api.getInfo();
      if (infoJson) {
        this.setAvailable();
        this.setCapabilityValue('onoff_charging_allowed', infoJson.onoff_charging_allowed);
        this.setCapabilityValue('old_onoff_charging_allowed', infoJson.onoff_charging_allowed);
        this.setCapabilityValue('measure_power', infoJson.measure_power);
        this.setCapabilityValue('measure_current', infoJson.measure_current);
        this.setCapabilityValue('measure_voltage', infoJson.measure_voltage);
        this.setCapabilityValue('measure_temperature', infoJson.measure_temperature);
        this.setCapabilityValue('meter_power', infoJson.meter_power);
        this.setCapabilityValue('status', infoJson.status);
        this.setCapabilityValue('old_status', infoJson.status);
        this.setCapabilityValue('is_error', infoJson.is_error);
        this.setCapabilityValue('charge_amp', infoJson.charge_amp);
        this.setCapabilityValue('charge_amp_limit', infoJson.charge_amp_limit);
        this.setCapabilityValue('energy_total', infoJson.energy_total);
        let _statusNew = 'newstatustext';
        _statusNew = infoJson.status;
        this.log(`new status: '${_statusNew}'`);
        if (_statusOld !== _statusNew) {
          this.log('status CHANGED');
          const statusChangedTrigger = new this.homey.FlowCardTrigger('status_changed');
          statusChangedTrigger.register().trigger().catch(this.error).then(this.log);
          if (_statusNew === 'car_finished') {
            this.log('Status changed to completed');
            this.setCapabilityValue('is_finished', true);
            this.setCapabilityValue('is_charging', false);
            this.setCapabilityValue('is_plugged_in', true);
            const chargingCompletedTrigger = new this.homey.FlowCardTrigger('charging_finished');
            chargingCompletedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_statusOld === 'car_charging') {
            this.log('Status changed from charging to no car connected');
            this.setCapabilityValue('is_finished', true);
            this.setCapabilityValue('is_charging', false);
            const chargingEndedTrigger = new this.homey.FlowCardTrigger('charging_ended');
            chargingEndedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_statusNew === 'car_charging') {
            this.log('Status changed to charging');
            this.setCapabilityValue('is_charging', true);
            this.setCapabilityValue('is_finished', false);
            this.setCapabilityValue('is_plugged_in', true);
            const chargingStartedTrigger = new this.homey.FlowCardTrigger('charging_started');
            chargingStartedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_statusNew === 'car_waiting') {
            this.log('Status changed to car connected');
            this.setCapabilityValue('is_charging', false);
            this.setCapabilityValue('is_finished', false);
            this.setCapabilityValue('is_plugged_in', true);
            const carConnectedTrigger = new this.homey.FlowCardTrigger('car_connected');
            carConnectedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_statusNew === 'station_idle') {
            this.setCapabilityValue('is_plugged_in', false);
            this.setCapabilityValue('is_charging', false);
            this.setCapabilityValue('is_finished', false);
          }
          if (_statusNew === 'station_idle' && _statusOld != null) {
            this.log('Status changed to car unplugged');
            const carDisconnectedTrigger = new this.homey.FlowCardTrigger('unplugged');
            carDisconnectedTrigger.register().trigger().catch(this.error).then(this.log);
          }
        } else {
          this.log('status unchanged');
        }
        let _allowChargingNew = '';
        _allowChargingNew = infoJson.onoff_charging_allowed;
        this.log(`new onoff_charging_allowed: '${_allowChargingNew}'`);
        if (_allowChargingOld !== _allowChargingNew) {
          this.log('onoff_charging_allowed CHANGED');
          if (_allowChargingNew === true && _allowChargingOld != null) {
            this.log('onoff_charging_allowed changed to TRUE');
            const onoffChargingAllowedTrigger = new this.homey.FlowCardTrigger('charging_allowed');
            onoffChargingAllowedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_allowChargingNew === false && _allowChargingOld != null) {
            this.log('onoff_charging_allowed changed to FALSE');
            const onoffChargingNotAllowedTrigger = new this.homey.FlowCardTrigger('charging_disallowed');
            onoffChargingNotAllowedTrigger.register().trigger().catch(this.error).then(this.log);
          }
        } else {
          this.log('onoff_charging_allowed unchanged');
        }
      }
    } catch (e) {
      this.setUnavailable(e);
      // console.log(e);
      return 'not connected';
    }
  }

  async _setChargingAllowed(_state) {
    this.log('_ChargingCharging');
    try {
      if (_state) {
        if (!this.getCapabilityValue('onoff_charging_allowed')) {
          return Promise.resolve(await this.api.setChargingAllowed(1));
        }
      } else if (this.getCapabilityValue('onoff_charging_allowed')) {
        return Promise.resolve(await this.api.setChargingAllowed(0));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async _setChargeCurrent(_chargeCurrent) {
    this.log('_setChargeCurrent');
    try {
      if (_chargeCurrent) {
        return Promise.resolve(await this.api.setChargeCurrent(_chargeCurrent));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

}

module.exports = mainDevice;
