'use strict';

const Homey = require('homey');

module.exports = class mainDriver extends Homey.Driver {

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

  async onPair(session) {
    session.setHandler('list_devices', async () => {
      try {
        this.homey.app.log(`[Driver] ${this.id} - mDNS discovery`);

        const discoveryStrategy = this.getDiscoveryStrategy();
        const discoveryResults = discoveryStrategy.getDiscoveryResults();
        const results = Object.values(discoveryResults).map((discoveryResult) => {
          return {
            name: discoveryResult.name,
            data: {
              id: discoveryResult.id,
            },
          };
        });
        return results;
      } catch (error) {
        this.homey.app.log(error);
        throw new Error(this.homey.__('pair.error'));
      }
    });
  }

  triggerStatusChanged(device, tokens, state) {
    this.log(`[Device] ${device.getName()}: ${device.getData().id} trigger: statusChanged`);
  }
  triggerCarConnected(device, tokens, state) {
    this.log(`[Device] ${device.getName()}: ${device.getData().id} trigger: carConnected`);
  }
  triggerCarUnplugged(device, tokens, state) {
    this.log(`[Device] ${device.getName()}: ${device.getData().id} trigger: carUnplugged`);
  }
  triggerChargingAllowed(device, tokens, state) {
    this.log(`[Device] ${device.getName()}: ${device.getData().id} trigger: chargingAllowed`);
  }
  triggerChargingDisallowed(device, tokens, state) {
    this.log(`[Device] ${device.getName()}: ${device.getData().id} trigger: chargingDisallowed`);
  }
  triggerChargingStarted(device, tokens, state) {
    this.log(`[Device] ${device.getName()}: ${device.getData().id} trigger: chargingStarted`);
  }
  triggerChargingEnded(device, tokens, state) {
    this.log(`[Device] ${device.getName()}: ${device.getData().id} trigger: chargingEnded`);
  }
  triggerChargingFinished(device, tokens, state) {
    this.log(`[Device] ${device.getName()}: ${device.getData().id} trigger: chargingFinished`);
  }

};
