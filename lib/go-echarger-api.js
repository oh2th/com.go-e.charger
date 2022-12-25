'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = class GoeChargerApi {

  // ------------------------------------------------------------------------
  // API calls with API version check based on device generation

  // getInfo() - fetch V1 status or V2 api/status
  // returns device object with all information

  async getInfo() {
    // console.log(`[Device] getInfo with driver ${this.driver}`);
    try {
      if ( this.driver === "go-eCharger_V1" || this.driver === "go-eCharger_V2") {
        return Promise.resolve(await this._getInfoAPIV1());
      } else {
        return Promise.resolve(await this._getInfoAPIV2());
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // setGoeChargerValue(key, value) - set V1 or V2 key to value
  // returns promise for resolve / reject

  async setGoeChargerValue(key, value) {
    // console.log(`[Device] setGoeChargerValue with driver ${this.driver}`);
    try {
      if ( this.driver === "go-eCharger_V1" || this.driver === "go-eCharger_V2") {
        return Promise.resolve(await this._setGoeChargerValueV1(key, value));
      } else {
        return Promise.resolve(await this._setGoeChargerValueV2(key, value));
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // ------------------------------------------------------------------------
  // API V1 functions called by above mapping functions

  async _getInfoAPIV1() {
    let deviceInfo = {
      "id": "",
      "name": "",
      "status": "unknown",
      "is_connected": false,
      "onoff_charging_allowed": false,
      "alarm_device": false,
      "meter_power": null,
      "measure_current": null,
      "measure_power": null,
      "measure_voltage": null,
      "energy_total": null,
      "measure_temperature": null,
      "current_limit": null,
      "current_max": null
    };

    // go-e status API V1 
    const res = await this._getGoeCharger('status'); 
    const txt = await res.text();
    const goecharger = JSON.parse(txt);

    // Serial numner for device ID (V1 API sse)
    deviceInfo.id = goecharger.sse;

    // Friendly name for device (V1 API dowsn't have it, so build from driver and serial)
    deviceInfo.name = `go-eCharger ${deviceInfo.id}`;

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
    if (goecharger.err !== '0') { deviceInfo.alarm_device = true; }

    // metered power (V1 API dws)
    deviceInfo.meter_power = Number((goecharger.dws * 0.00000277).toFixed(2));

    // power (V1 API nrg array)
    // Filter out negative power values.
    if (goecharger.nrg[11] > 0) {
      deviceInfo.measure_power = Number((goecharger.nrg[11] * 10).toFixed(2));
    }

    // current amps (V1 API nrg array)
    // count number of active phases
    let numPhases = 0;
    if ((goecharger.pha & 32) === 32) numPhases++;
    if ((goecharger.pha & 16) === 16) numPhases++;
    if ((goecharger.pha & 8) === 8) numPhases++;
    if (numPhases !== 0) {
      deviceInfo.measure_current = Number(((goecharger.nrg[4] + goecharger.nrg[5] + goecharger.nrg[6]) / numPhases / 10).toFixed(2));
    }
    if (deviceInfo.measure_current === 0) deviceInfo.measure_current = null;

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

    // temperature (V1 API tmp) - 4th gen devices do not return tmp in V1 API.
    if(typeof goecharger.tmp !== 'undefined' && goecharger.tmp !== null) {
      deviceInfo.measure_temperature = Number(goecharger.tmp);
    }

    // set current limit (V1 API amp)
    deviceInfo.current_limit = Number(goecharger.amp);

    // device maximum current (V1 API ama)
    deviceInfo.current_max = Number(goecharger.ama);

    return deviceInfo;
  }

  // ------------------------------------------------------------------------
  // API V1 functions called by above mapping functions

  async _getInfoAPIV2() {
    
    let deviceInfo = {
      "id": "",
      "name": "",
      "status": "unknown",
      "is_connected": false,
      "onoff_charging_allowed": false,
      "alarm_device": false,
      "meter_power": null,
      "measure_current": null,
      "measure_power": null,
      "measure_voltage": null,
      "energy_total": null,
      "measure_temperature": null,
      "measure_temperature.charge_port": null,
      "current_limit": null,
      "current_max": null
    };

    // API V2 status end point with filter for needed values
    const res = await this._getGoeCharger('api/status?filter=sse,fna,car,alw,err,wh,pha,nrg,eto,tma,amp,ama');
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
    deviceInfo.onoff_charging_allowed = goecharger.alw;

    // error (V2 API err)
    if (goecharger.err !== 0) { deviceInfo.alarm_device = true; }

    // metered power (V2 API wh), convert to kWh
    deviceInfo.meter_power = Number((goecharger.wh / 1000).toFixed(2));

    // power (V2 API nrg array)
    // Filter out negative power values.
    if (goecharger.nrg[11] > 0) {
      deviceInfo.measure_power = Number((goecharger.nrg[11]).toFixed(2));
    }

    // current amps (V2 API nrg array)
    // count number of active phases
    let numPhases = 0;
    if (goecharger.pha[3] === true) numPhases++;
    if (goecharger.pha[4] === true) numPhases++;
    if (goecharger.pha[5] === true) numPhases++;
    if (numPhases === 0) {
      deviceInfo.measure_current = null;
    } else {
      deviceInfo.measure_current = Number(((goecharger.nrg[4] + goecharger.nrg[5] + goecharger.nrg[6]) / numPhases).toFixed(2));
    }

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
    deviceInfo["measure_temperature"] = Number(goecharger.tma[1]);

    // set current limit (V2 API amp)
    deviceInfo.current_limit = Number(goecharger.amp);

    // device maximum current (V2 API ama)
    deviceInfo.current_max = Number(goecharger.ama);

    return deviceInfo;
  }

  // ------------------------------------------------------------------------
  // Locally used common API GET fucntion for API V1 and V2

  async _getGoeCharger(uri) {
    // console.log(`[GoeChargerApi] _getGoeCharger: http://${this.address}/${uri}`);
    const response = await fetch(`http://${this.address}/${uri}`, { method: 'GET' });
    if (!response.ok) {
      return Promise.reject(response);
    }
    // console.log(`[GoeChargerApi] _getGoeCharger result: ${response.status}`);
    return Promise.resolve(response);
  }

  // ------------------------------------------------------------------------
  // Locally used API SET fucntion for API V1

  async _setGoeChargerValueV1(key, value) {
    console.log(`[GoeChargerApi] _setGoeChargerValueV1: http://${this.address}/mqtt?payload=${key}=${value}`);
    const response = await fetch(`http://${this.address}/mqtt?payload=${key}=${value}`, { method: 'GET' });
    if (!response.ok) {
      return Promise.reject(response);
    }
    // console.log(`[GoeChargerApi] _setGoeChargerValueV1 result: ${response.status}`);
    return Promise.resolve(response);
  }

  // ------------------------------------------------------------------------
  // Locally used API SET fucntion for API V2

  async _setGoeChargerValueV2(key, value) {
    console.log(`[GoeChargerApi] _setGoeChargerValueV2: http://${this.address}/api/set?${key}=${value}`);
    const response = await fetch(`http://${this.address}/api/set?${key}=${value}`, { method: 'GET' });
    if (!response.ok) {
      return Promise.reject(response);
    }
    // console.log(`[GoeChargerApi] _setGoeChargerValueV2 result: ${response.status}`);
    return Promise.resolve(response);
  }

};
