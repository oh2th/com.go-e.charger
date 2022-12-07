/* eslint-disable no-console */
/* eslint-disable node/no-unsupported-features/es-syntax */

'use strict';

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = class GoeChargerApi {

  constructor(address) {
    this._address = address;
  }

  async getInfo() {
    const res = await this._getGoeCharger(this._address, 'status');
    const txt = await res.text();
    const goecharger = JSON.parse(txt);

    // preprocessing of variables which aren't usable as such
    // allow
    let alw = true;
    if (goecharger.alw === '0') {
      alw = false;
    } else if (goecharger.alw === '1') {
      alw = true;
    } else {
      alw = false;
    }
    // error
    let err = false;
    if (goecharger.err === '0') {
      err = false;
    } else {
      err = true;
    }
    // status (car)
    let status = 'unknown';
    switch (goecharger.car) {
      case '1': status = 'idle';
        break;
      case '2': status = 'car_charging';
        break;
      case '3': status = 'car_waiting';
        break;
      case '4': status = 'car_finished';
        break;
      default: status = 'unknown';
    }
    // console.log(goecharger.car);

    const meterPower = goecharger.dws * 0.00000277;

    // the amps should be measured over the whole of the phases.
    // if more than 1 phase is used, the amps should be devided by the number of phases
    // all amp values are devided by 10 so therefor the below calculation
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
      name: `Go-e Charger Home+ ${goecharger.sse}`,
      ip: this._address,
      serialNumber: goecharger.sse,
      onoff: alw,
      old_onoff: alw,
      measure_power: goecharger.nrg[11] * 10,
      measure_current: +measureCurrent.toFixed(2),
      measure_voltage: goecharger.nrg[0] + goecharger.nrg[1] + goecharger.nrg[2],
      measure_temperature: Number(goecharger.tmp),
      meter_power: +meterPower.toFixed(2),
      status,
      old_status: status,
      is_error: err,
      charge_amp: Number(goecharger.amp),
      charge_amp_limit: Number(goecharger.ama),
      energy_total: energyTotal,
    };
  }

  // changing states
  async setOnOff(address, vlw) {
    return this._setGoeCharger(address, `alw=${vlw}`);
  }

  async setChargeCurrent(address, vlw) {
    return this._setGoeCharger(address, `amp=${vlw}`);
  }

  async _setGoeCharger(address, value) {
    console.log(`[GoeChargerApi] _setGoeCharger: http://${address}/mqtt?payload=${value}`);
    const response = await fetch(`http://${address}/mqtt?payload=${value}`, { method: 'GET' });
    if (!response.ok) {
      return Promise.reject(response);
    }
    console.log(`[GoeChargerApi] _setGoeCharger result: ${response.status}`);
    return Promise.resolve(response);
  }

  async _getGoeCharger(address, uri) {
    console.log(`[GoeChargerApi] _getGoeCharger: http://${address}/${uri}`);
    const response = await fetch(`http://${address}/${uri}`, { method: 'GET' });
    if (!response.ok) {
      return Promise.reject(response);
    }
    console.log(`[GoeChargerApi] _getGoeCharger result: ${response.status}`);
    return Promise.resolve(response);
  }

};
