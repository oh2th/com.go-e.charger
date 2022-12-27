/* eslint-disable func-names */
/* eslint-disable camelcase */

'use strict';

exports.init = async function(homey) {
  const action_ALLOW_CHARGING = homey.flow.getActionCard('allow_charging');
  action_ALLOW_CHARGING.registerRunListener(async (args, state) => {
    await args.device.onCapability_IS_ALLOWED(args.enabled);
  });
  const action_CURRENT_LIMIT = homey.flow.getActionCard('change_current');
  action_CURRENT_LIMIT.registerRunListener(async (args, state) => {
    await args.device.onCapability_CURRENT_LIMIT(args.action_amps);
  });
  const action_SINGLE_PHASE = homey.flow.getActionCard('single_phase');
  action_SINGLE_PHASE.registerRunListener(async (args, state) => {
    await args.device.onCapability_SINGLE_PHASE(args.enabled);
  });
};
