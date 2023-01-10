'use strict';

exports.init = async function(homey) {
  const condition_ALLOWED = homey.flow.getConditionCard('is_allowed');
  condition_ALLOWED.registerRunListener(async (args, state) => {
    return await args.device.getCapabilityValue('is_allowed') === true;
  });

  const condition_CHARGING = homey.flow.getConditionCard('is_charging');
  condition_CHARGING.registerRunListener(async (args, state) => {
    return await args.device.getCapabilityValue('is_charging') === true;
  });

  const condition_CONNECTED = homey.flow.getConditionCard('is_connected');
  condition_CONNECTED.registerRunListener(async (args, state) => {
    return await args.device.getCapabilityValue('is_connected') === true;
  });

  const condition_SINGLE_PHASE = homey.flow.getConditionCard('is_single_phase');
  condition_SINGLE_PHASE.registerRunListener(async (args, state) => {
    return await args.device.getCapabilityValue('is_single_phase') === true;
  });

  const condition_THREE_PHASE = homey.flow.getConditionCard('is_three_phase');
  condition_THREE_PHASE.registerRunListener(async (args, state) => {
    return await args.device.getCapabilityValue('is_three_phase') === true;
  });
};
