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
        const api = new GoeChargerApi();
        api.address = data.address;
        const initialInfo = await getInitialInfo();
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

  // getInfo will decide which API to use based in driver
  async getInfo() {
    console.log(`[Device] getInfo with driver ${this.id}`);
    try {
      if ( this.id === "go-eCharger_V1" || this.id === "go-eCharger_V2") {
        return Promise.resolve(await this.getInfoAPIV1());
      } else {
        return Promise.resolve(await this.getInfoAPIV2());
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // First and Second generation devices support API V1 only
  // Used during pairing to test the connection and get the serial number.
  async getInitialInfo() {
    console.log(`[Device] getInitialInfo with driver ${this.id}`);
    try {
      if ( this.id === "go-eCharger_V1" || this.id === "go-eCharger_V2") {
        return Promise.resolve(await this.getInitialInfoAPIV1());
      } else {
        return Promise.resolve(await this.getInitialInfoAPIV2());
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

};
