'use strict';

const Homey = require('homey');
const GoeChargerApi = require('../lib/go-echarger-api');

module.exports = class mainDriver extends Homey.Driver {

  onInit() {
    this.homey.app.log('[Driver] - init', this.id);
    this.homey.app.log('[Driver] - version', Homey.manifest.version);
  }

  async onPair(session) {
    let deviceArray = {};

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
            settings: {
              address: discoveryResult.address,
            },
            store: {}  
          };
        });
        if (results.length > 0) {
          return results;
        } else {
          this.homey.app.log('Fallback to manual pairing not implemented.');
          // session.showView('select_pairing');
        }
      } catch (e) {
        this.homey.app.log(e);
        throw new Error(this.homey.__('pair.error'));
      }
    });

    session.setHandler('manual_pairing', async function (data) {
      try {
        console.log('manual_pairing: ', data.address);
        const api = new GoeChargerApi();
        api.address = data.address;
        const initialInfo = await api.getInitialInfo();
        initialInfo.address = data.address;
        console.log('manual_pairing result: ', initialInfo);
        deviceArray = {
          name: initialInfo.name,
          data: {
            id: initialInfo.id,
          },
          settings: {
            address: initialInfo.address,
          },
          store: {}
        }
        return Promise.resolve(deviceArray);
      } catch (e) {
        console.log(e);
        throw new Error(this.homey.__('pair.error'));
      }
    });

    session.setHandler('add_device', async (data) => {
      try {
        return Promise.resolve(deviceArray);
      } catch (error) {
        this.error(error);
      }
    });

  }

};
