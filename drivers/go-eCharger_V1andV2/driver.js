'use strict';

const Homey = require('homey');
const mainDriver = require('../main-driver');

module.exports = class goeChargerV1andV2Driver extends mainDriver {

  onInit() {
    this.homey.app.log('[Driver] - init', this.id);
    this.homey.app.log('[Driver] - version', Homey.manifest.version);

    this.statusChangedTrigger = this.homey.flow.getDeviceTriggerCard('status_changed');
    this.chargingAllowedTrigger = this.homey.flow.getDeviceTriggerCard('charging_allowed');
    this.chargingAllowedTrigger = this.homey.flow.getDeviceTriggerCard('charging_disallowed');
  }

};
