'use strict';

const Homey = require('homey');
const { Log } = require('homey-log');
const flowActions = require('./lib/flows/actions');
const flowConditions = require('./lib/flows/conditions');

class GoeCharger extends Homey.App {

	/**
   * onInit is called when the app is initialized.
   */
	async onInit() {
		this.log(`${this.homey.manifest.id} - ${this.homey.manifest.version} started...`);
		this.homeyLog = new Log({ homey: this.homey });

		await flowActions.init(this.homey);
		await flowConditions.init(this.homey);

		this.log('go-eCharger app has been initialized');
	}

	async sendNotification(message) {
		await this.homey.notifications.createNotification({
			excerpt: message,
		}).catch((error) => {
			this.log(`${this.homey.manifest.id} - ${this.homey.manifest.version} sendNotification - error: ${error}`);
		});
	}

}

module.exports = GoeCharger;
