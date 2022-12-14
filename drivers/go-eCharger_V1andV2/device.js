'use strict';

const mainDevice = require('../main-device');
const mainDriver = require('../main-driver');

module.exports = class goeChargerV1andV2Device extends mainDevice {
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
};
