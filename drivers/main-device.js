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
    const isCompletedCondition = this.homey.flow.getConditionCard('is_completed');
    isCompletedCondition.registerRunListener(async (args, state) => {
      const result = this.getCapabilityValue('is_completed');
      return Promise.resolve(result);
    });
    const isChargingCondition = this.homey.flow.getConditionCard('is_charging');
    isChargingCondition.registerRunListener(async (args, state) => {
      const result = this.getCapabilityValue('charging');
      return Promise.resolve(result);
    });
    const isAllowedCondition = this.homey.flow.getConditionCard('is_allowed');
    isAllowedCondition.registerRunListener(async (args, state) => {
      const result = this.getCapabilityValue('onoff');
      return Promise.resolve(result);
    });
    const isPluggedCondition = this.homey.flow.getConditionCard('is_plugged');
    isPluggedCondition.registerRunListener(async (args, state) => {
      const result = this.getCapabilityValue('pluggedin');
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
      ['onoff', this._setOnOff],
      ['charge_amp', this._setChargeCurrent],
      ['is_completed', null],
      ['charging', null]]);
    this.getCapabilities().forEach((capability) => this.registerCapabilityListener(capability, (value) => {
      return capabilitySetMap.get(capability).call(this, value).catch((err) => {
        return Promise.reject(err);
      });
    }));
  }

  async _pollChargerState(_statusOld, _onOffOld) {
    try {
      const infoJson = await this.api.getInfo();
      if (infoJson) {
        this.setAvailable();
        this.setCapabilityValue('onoff', infoJson.onoff);
        this.setCapabilityValue('old_onoff', infoJson.onoff);
        this.setCapabilityValue('measure_power', infoJson.measure_power);
        this.setCapabilityValue('measure_current', infoJson.measure_current);
        this.setCapabilityValue('measure_voltage', infoJson.measure_voltage);
        this.setCapabilityValue('measure_temperature', infoJson.measure_temperature);
        this.setCapabilityValue('meter_power', infoJson.meter_power);
        this.setCapabilityValue('status', infoJson.status);
        this.setCapabilityValue('old_status', infoJson.status);
        this.setCapabilityValue('errr', infoJson.error);
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
          if (_statusNew === 'Charging finished') {
            this.log('Status changed to completed');
            this.setCapabilityValue('is_completed', true);
            this.setCapabilityValue('is_charging', false);
            this.setCapabilityValue('is_plugged_in', true);
            const chargingCompletedTrigger = new this.homey.FlowCardTrigger('completed');
            chargingCompletedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_statusOld === 'Charging car') {
            this.log('Status changed from charging to no car connected');
            this.setCapabilityValue('is_completed', true);
            this.setCapabilityValue('is_charging', false);
            const chargingEndedTrigger = new this.homey.FlowCardTrigger('charging_ended');
            chargingEndedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_statusNew === 'Charging car') {
            this.log('Status changed to charging');
            this.setCapabilityValue('is_charging', true);
            this.setCapabilityValue('is_completed', false);
            this.setCapabilityValue('is_plugged_in', true);
            const chargingStartedTrigger = new this.homey.FlowCardTrigger('charging_started');
            chargingStartedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_statusNew === 'Car connected') {
            this.log('Status changed to car connected');
            this.setCapabilityValue('is_charging', false);
            this.setCapabilityValue('is_completed', false);
            this.setCapabilityValue('is_plugged_in', true);
            const carConnectedTrigger = new this.homey.FlowCardTrigger('car_connected');
            carConnectedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_statusNew === 'No car connected') {
            this.setCapabilityValue('is_plugged_in', false);
            this.setCapabilityValue('is_charging', false);
            this.setCapabilityValue('is_completed', false);
          }
          if (_statusNew === 'No car connected' && _statusOld != null) {
            this.log('Status changed to car unplugged');
            const carDisconnectedTrigger = new this.homey.FlowCardTrigger('car_unplugged');
            carDisconnectedTrigger.register().trigger().catch(this.error).then(this.log);
          }
        } else {
          this.log('status unchanged');
        }
        let _onOffNew = 'newonofftext';
        _onOffNew = infoJson.onoff;
        this.log(`new onoff: '${_onOffNew}'`);
        if (_onOffOld !== _onOffNew) {
          this.log('onoff CHANGED');
          if (_onOffNew === true && _onOffOld != null) {
            this.log('OnOff changed to TRUE');
            const onoffAllowedTrigger = new this.homey.FlowCardTrigger('charging_allowed');
            onoffAllowedTrigger.register().trigger().catch(this.error).then(this.log);
          }
          if (_onOffNew === false && _onOffOld != null) {
            this.log('OnOff changed to FALSE');
            const onoffNotAllowedTrigger = new this.homey.FlowCardTrigger('charging_disallowed');
            onoffNotAllowedTrigger.register().trigger().catch(this.error).then(this.log);
          }
        } else {
          this.log('onoff unchanged');
        }
      }
    } catch (e) {
      this.setUnavailable(e);
      // console.log(e);
      return 'not connected';
    }
  }

  async _setOnOff(_onOff) {
    this.log('_setOnOff');
    try {
      if (_onOff) {
        if (!this.getCapabilityValue('onoff')) {
          return Promise.resolve(await this.api.setOnOff(1));
        }
      } else if (this.getCapabilityValue('onoff')) {
        return Promise.resolve(await this.api.setOnOff(0));
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
