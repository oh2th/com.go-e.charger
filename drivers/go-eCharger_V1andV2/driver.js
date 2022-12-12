'use strict';

const Homey = require('homey');
const mainDriver = require('../main-driver');

module.exports = class goeChargerV1andV2Driver extends mainDriver {

  onInit() {
    this.homey.app.log('[Driver] - init', this.id);
    this.homey.app.log('[Driver] - version', Homey.manifest.version);

    this.statusChangedTrigger = this.homey.flow.getDeviceTriggerCard('status_changed');
    this.carConnectedTrigger = this.homey.flow.getDeviceTriggerCard('car_connected');
    this.carUnpluggedTrigger = this.homey.flow.getDeviceTriggerCard('car_unplugged');
    this.chargingAllowedTrigger = this.homey.flow.getDeviceTriggerCard('charging_allowed');
    this.chargingDisallowedTrigger = this.homey.flow.getDeviceTriggerCard('charging_disallowed');
    this.chargingStartedTrigger = this.homey.flow.getDeviceTriggerCard('charging_started');
    this.chargingEndedTrigger = this.homey.flow.getDeviceTriggerCard('charging_ended');
    this.chargingFinishedTrigger = this.homey.flow.getDeviceTriggerCard('charging_finished');
  }

};
