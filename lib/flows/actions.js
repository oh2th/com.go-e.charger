exports.init = async function (homey) {
  const action_CURRENT_LIMIT = homey.flow.getActionCard('change_current');
  action_CURRENT_LIMIT.registerRunListener(async (args, state) => {
    await args.device.onCapability_CURRENT_LIMIT(args.action_amps);
  });

};
