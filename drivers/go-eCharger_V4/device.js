'use strict';

const mainDevice = require('../main-device');

module.exports = class goeChargerGeminiDevice extends mainDevice {
    async setCapabilityValues() {
        try {
          this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - last status: '${this.getStoreValue('old_status')}'`);
          this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - last chargingAllowed: '${this.getStoreValue('old_chargingAllowed')}'`);
    
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
    
            this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - new status: '${infoJson.status}'`);
            this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - new chargingAllowed: '${infoJson.onoff_charging_allowed}'`);
    
            if (infoJson.status !== this.getStoreValue('old_status')) {
              this.log(`[Device] ${this.getName()}:  ${this.getData().id} refresh - status changed`);
              Driver.status
              ChangedTrigger.trigger();
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
