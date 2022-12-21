'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = class GoeChargerApi {

  // getInfo will decide which API to use based in driver
  async getInfo() {
    try {
      if ( this.driver === "go-eCharger_V1" || this.driver === "go-eCharger_V2") {
        // console.log(`[Device] API V1 for drvier ${this.driver}`);
        return Promise.resolve(await this.getInfoAPIV1());
      } else {
        // console.log(`[Device] API V2 for drvier ${this.driver}`);
        return Promise.resolve(await this.getInfoAPIV2());
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // First and Second generation devices support API V1 only
  // Used during pairing to test the connection and get the serial number.
  async getInitialInfo() {
    let deviceInfo = { "id": "", "name": "" }

    const res = await this.getGoeCharger('status'); // go-e status API V1 
    const txt = await res.text();
    const goecharger = JSON.parse(txt);
  
    deviceInfo.id = goecharger.sse;
    deviceInfo.name = `go-eCharger ${deviceInfo.id}`;
    return deviceInfo;
  }

  // First and Second generation devices support API V1 only
  async getInfoAPIV1() {

    let deviceInfo = {
      "id": "",
      "name": "",
      "status": "unknown",
      "is_connected": false,
      "onoff_charging_allowed": false,
      "is_device_error": false,
      "meter_power": 0,
      "measure_current": 0,
      "measure_power": 0,
      "measure_voltage": 0,
      "energy_total": 0,
      "measure_temperature": 0,
      "current_limit": 0,
      "current_max": 0
    };

    const res = await this.getGoeCharger('status'); // go-e status API V1 
    const txt = await res.text();
    const goecharger = JSON.parse(txt);

    // Serial numner for device ID (V1 API sse)
    deviceInfo.id = goecharger.sse;

    // Friendly name for device (V1 API dowsn't have it, so build from driver and serial)
    deviceInfo.name = `${this.driver} ${deviceInfo.id}`;

    // status  (V1 API car)
    switch (goecharger.car) {
      case '1':
        deviceInfo.status = 'station_idle';
        deviceInfo.is_connected = false;
        break;
      case '2':
        deviceInfo.status = 'car_charging';
        deviceInfo.is_connected = true;
        break;
      case '3':
        deviceInfo.status = 'car_waiting';
        deviceInfo.is_connected = true;
        break;
      case '4':
        deviceInfo.status = 'car_finished';
        deviceInfo.is_connected = true;
        break;
      default:
        deviceInfo.status = 'unknown';
    }

    // allow (V1 API alw)
    if (goecharger.alw === '1') { deviceInfo.onoff_charging_allowed = true; }

    // error (V1 API err)
    if (goecharger.err !== '0') { deviceInfo.is_device_error = true; }

    // metered power (V1 API dws)
    deviceInfo.meter_power = Number((goecharger.dws * 0.00000277).toFixed(2));

    // power (V1 API nrg array)
    // Filter out negative power values.
    if (goecharger.nrg[11] > 0) {
      deviceInfo.measure_power = Number((goecharger.nrg[11] * 10).toFixed(2));
    }

    // current amps (V1 API nrg array)
    // the current amps should be measured over the whole of the phases.
    // if more than 1 phase is used, the current amps should be devided by the number of phases
    // all current amp values are devided by 10 so therefor the below calculation
    let currentDivider = 0;
    if (goecharger.nrg[4] > 0) {
      currentDivider += 10;
    }
    if (goecharger.nrg[5] > 0) {
      currentDivider += 10;
    }
    if (goecharger.nrg[6] > 0) {
      currentDivider += 10;
    }
    if (currentDivider === 0) {
      currentDivider = 1;
    }
    deviceInfo.measure_current = Number(((goecharger.nrg[4] + goecharger.nrg[5] + goecharger.nrg[6]) / currentDivider).toFixed(2));

    // voltage (V1 API nrg array)
    deviceInfo.measure_voltage = Number((goecharger.nrg[0] + goecharger.nrg[1] + goecharger.nrg[2]).toFixed(2));
    // check for reversed phases.
      if (deviceInfo.measure_voltage < 0) {
        deviceInfo.measure_voltage = Number((goecharger.nrg[3]).toFixed(2));
    }

    // total energy consumed since reset (V1 API eto)
    if (goecharger.eto > 0) {
      deviceInfo.energy_total = Number((goecharger.eto / 10).toFixed(2));
    }

    // temperature (V1 API tmp)
    deviceInfo.measure_temperature = Number(goecharger.tmp);

    // set current limit (V1 API amp)
    deviceInfo.current_limit = Number(goecharger.amp);

    // device maximum current (V1 API ama)
    deviceInfo.current_max = Number(goecharger.ama);

    return deviceInfo;
  }

  // Third and fourth generation devices support API V1 and V2, this function uses all V2 API
  async getInfoAPIV2() {
    
    let deviceInfo = {
      "id": "",
      "name": "",
      "status": "unknown",
      "is_connected": false,
      "onoff_charging_allowed": false,
      "is_device_error": false,
      "meter_power": 0,
      "measure_current": 0,
      "measure_power": 0,
      "measure_voltage": 0,
      "energy_total": 0,
      "measure_temperature.internal": 0,
      "measure_temperature.charge_port": 0,
      "current_limit": 0,
      "current_max": 0
    };

    const res = await this.getGoeCharger('api/status'); // go-e status API V2
    const txt = await res.text();
    const goecharger = JSON.parse(txt);

    // Serial number for device ID (V2 API sse)
    deviceInfo.id = goecharger.sse;

    // Friendly name for device (V2 API fna)
    deviceInfo.name = goecharger.fna;

    // status (V2 API car)
    switch (goecharger.car) {
      case 1:
        deviceInfo.status = 'station_idle';
        deviceInfo.is_connected = false;
        break;
      case 2:
        deviceInfo.status = 'car_charging';
        deviceInfo.is_connected = true;
        break;
      case 3:
        deviceInfo.status = 'car_waiting';
        deviceInfo.is_connected = true;
        break;
      case 4:
        deviceInfo.status = 'car_finished';
        deviceInfo.is_connected = true;
        break;
      case 5:
        deviceInfo.status = 'station_error';
        break;
      default:
        deviceInfo.status = 'unknown';
    }

    // allow (V2 API alw)
    if (goecharger.alw === 1) { deviceInfo.onoff_charging_allowed = true; }

    // error (V2 API err)
    if (goecharger.err !== 0) { deviceInfo.is_device_error = true; }

    // metered power (V2 API dws)
    deviceInfo.meter_power = Number((goecharger.wh).toFixed(2));

    // power (V2 API nrg array)
    // Filter out negative power values.
    if (goecharger.nrg[11] > 0) {
      deviceInfo.measure_power = Number((goecharger.nrg[11] * 10).toFixed(2));
    }

    // current amps (V1 API nrg array)
    // the current amps should be measured over the whole of the phases.
    // if more than 1 phase is used, the current amps should be devided by the number of phases
    // all current amp values are devided by 10 so therefor the below calculation
    let currentDivider = 0;
    if (goecharger.nrg[4] > 0) {
      currentDivider += 10;
    }
    if (goecharger.nrg[5] > 0) {
      currentDivider += 10;
    }
    if (goecharger.nrg[6] > 0) {
      currentDivider += 10;
    }
    if (currentDivider === 0) {
      currentDivider = 1;
    }
    deviceInfo.measure_current = Number(((goecharger.nrg[4] + goecharger.nrg[5] + goecharger.nrg[6]) / currentDivider).toFixed(2));

    // voltage (V2 API nrg array)
    deviceInfo.measure_voltage = Number((goecharger.nrg[0] + goecharger.nrg[1] + goecharger.nrg[2]).toFixed(2));
    // check for reversed phases.
      if (deviceInfo.measure_voltage < 0) {
        deviceInfo.measure_voltage = Number((goecharger.nrg[3]).toFixed(2));
    }

    // total energy consumed since reset (V2 API eto)
    if (goecharger.eto > 0) {
      deviceInfo.energy_total = Number((goecharger.eto / 1000).toFixed(2));
    }

    // temperature (V2 API tma)
    deviceInfo["measure_temperature.charge_port"] = Number(goecharger.tma[0]);
    deviceInfo["measure_temperature.internal"] = Number(goecharger.tma[1]);

    // set current limit (V2 API amp)
    deviceInfo.current_limit = Number(goecharger.amp);

    // device maximum current (V2 API ama)
    deviceInfo.current_max = Number(goecharger.ama);

    return deviceInfo;
  }

  // Get Information from charger, works for both API V1 and API V2
  async getGoeCharger(uri) {
    // console.log(`[GoeChargerApi] _getGoeCharger: http://${this.address}/${uri}`);
    const response = await fetch(`http://${this.address}/${uri}`, { method: 'GET' });
    if (!response.ok) {
      return Promise.reject(response);
    }
    // console.log(`[GoeChargerApi] _getGoeCharger result: ${response.status}`);
    return Promise.resolve(response);
  }

  async setGoeCharger(key, value) {
    console.log(`[GoeChargerApi] setGoeCharger: http://${this.address}/mqtt?payload=${key}=${value}`);
    const response = await fetch(`http://${this.address}/mqtt?payload=${key}=${value}`, { method: 'GET' });
    if (!response.ok) {
      return Promise.reject(response);
    }
    // console.log(`[GoeChargerApi] _setGoeCharger result: ${response.status}`);
    return Promise.resolve(response);
  }

};
