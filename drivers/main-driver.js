/* eslint-disable func-names */
/* eslint-disable camelcase */
/* eslint-disable consistent-return */

'use strict';

const Homey = require('homey');
const GoeChargerApi = require('../lib/go-echarger-api');

module.exports = class mainDriver extends Homey.Driver {

  onInit() {
    this.homey.app.log('[Driver] - init', this.id);
    this.homey.app.log('[Driver] - version', Homey.manifest.version);
  }

  async onPair(session) {
    const deviceDriver = this.id;
    let deviceArray = {};

    session.setHandler('list_devices', async () => {
      try {
        this.homey.app.log(`[Driver] ${deviceDriver} - mDNS discovery`);

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
              driver: deviceDriver,
            },
            store: {},
          };
        });

        if (results.length > 0) return results;

        this.homey.app.log('Fallback to manual pairing not implemented.');
        // session.showView('select_pairing');
        return {};
      } catch (e) {
        this.homey.app.log(e);
        throw new Error(this.homey.__('pair.error'));
      }
    });

    session.setHandler('manual_pairing', async function(data) {
      try {
        const api = new GoeChargerApi();
        api.address = data.address;
        api.driver = deviceDriver;
        const initialInfo = await api.getInfo();
        initialInfo.address = data.address;
        deviceArray = {
          name: initialInfo.name,
          data: {
            id: initialInfo.id,
          },
          settings: {
            address: initialInfo.address,
            driver: deviceDriver,
          },
          store: {},
        };
        return Promise.resolve(deviceArray);
      } catch (e) {
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
