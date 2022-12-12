'use strict';

const Homey = require('homey');

module.exports = class mainDriver extends Homey.Driver {

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
