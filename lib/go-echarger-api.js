/* eslint-disable no-console */
/* eslint-disable node/no-unsupported-features/es-syntax */

'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = class GoeChargerApi {

  async getInfo() {
    const res = await this.getGoeCharger('status'); // go-e status API V1 
    const txt = await res.text();
    const goecharger = JSON.parse(txt);

    // preprocessing of variables which aren't usable as such
    // allow (V1 API alw)
    let alw = true;
    if (goecharger.alw === '0') {
      alw = false;
    } else if (goecharger.alw === '1') {
      alw = true;
    } else {
      alw = false;
    }
    // error (V1 API err)
    let err = false;
    if (goecharger.err === '0') {
      err = false;
    } else {
      err = true;
    }
    // Type2 cable (V1 API cbl)
    let cbl = false;
    if (goecharger.cbl === '0') {
      cbl = false;
    } else {
      cbl = true;
    }
    // status  (V1 API car)
    let car = '';
    switch (goecharger.car) {
      case '1': car = 'station_idle';
        break;
      case '2': car = 'car_charging';
        break;
      case '3': car = 'car_waiting';
        break;
      case '4': car = 'car_finished';
        break;
      default: car = 'unknown';
    }
    // console.log(goecharger.car);

    const meterPower = goecharger.dws * 0.00000277;

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
    const measureCurrent = (goecharger.nrg[4] + goecharger.nrg[5] + goecharger.nrg[6]) / currentDivider;

    // Filter out negative power values.
    let measurePower = 0;
    if (goecharger.nrg[11] > 0) {
      measurePower = goecharger.nrg[11] * 10;
    }
   
    let voltageNow = 0;
    voltageNow = goecharger.nrg[0] + goecharger.nrg[1] + goecharger.nrg[2];
    if (voltageNow < 0) {
      // this will mean there is a 1 phase connected the other way around.
      voltageNow = goecharger.nrg[3];
    }

    let energyTotal = 0;
    if (goecharger.eto > 0) {
      energyTotal = goecharger.eto / 10;
    }

    return {
      onoff_charging_allowed: alw,
      measure_power: measurePower,
      measure_current: +measureCurrent.toFixed(2),
      measure_voltage: goecharger.nrg[0] + goecharger.nrg[1] + goecharger.nrg[2],
      measure_temperature: Number(goecharger.tmp),
      meter_power: +meterPower.toFixed(2),
      status: car,
      is_connected: cbl,
      is_device_error: err,
      current_limit: Number(goecharger.amp),
      current_max: Number(goecharger.ama),
      energy_total: energyTotal,
    };
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

  async getGoeCharger(uri) {
    // console.log(`[GoeChargerApi] _getGoeCharger: http://${this.address}/${uri}`);
    const response = await fetch(`http://${this.address}/${uri}`, { method: 'GET' });
    if (!response.ok) {
      return Promise.reject(response);
    }
    // console.log(`[GoeChargerApi] _getGoeCharger result: ${response.status}`);
    return Promise.resolve(response);
  }

};
