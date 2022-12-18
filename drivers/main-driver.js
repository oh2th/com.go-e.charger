'use strict';

const Homey = require('homey');

module.exports = class mainDriver extends Homey.Driver {

  onInit() {
    this.homey.app.log('[Driver] - init', this.id);
    this.homey.app.log('[Driver] - version', Homey.manifest.version);
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

};
