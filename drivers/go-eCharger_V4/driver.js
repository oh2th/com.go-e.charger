'use strict';

const Homey = require('homey');
const mainDriver = require('../main-driver');

module.exports = class goeChargerGeminiDriver extends mainDriver {

  onInit() {
    this.homey.app.log('[Driver] - init', this.id);
    this.homey.app.log('[Driver] - version', Homey.manifest.version);

    const statusChangedTrigger = this.homey.flow.getTriggerCard('gemini_status_changed');
  }

};
