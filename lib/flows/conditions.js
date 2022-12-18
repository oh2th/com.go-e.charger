exports.init = async function (homey) {
    const condition_ALLOWED = homey.flow.getConditionCard('is_allowed')
    condition_ALLOWED.registerRunListener( async (args, state) =>  {
       homey.app.log('[condition_ALLOWED]', state, {...args, device: 'LOG'});
       return await args.device.getCapabilityValue(`is_allowed`) === true;
    });

    const condition_CHARGING = homey.flow.getConditionCard('is_charging')
    condition_CHARGING.registerRunListener( async (args, state) =>  {
       homey.app.log('[condition_CHARGING]', state, {...args, device: 'LOG'});
       return await args.device.getCapabilityValue(`is_charging`) === true;
    });

    const condition_CONNECTED = homey.flow.getConditionCard('is_connected')
    condition_CONNECTED.registerRunListener( async (args, state) =>  {
       homey.app.log('[condition_CONNECTED]', state, {...args, device: 'LOG'});
       return await args.device.getCapabilityValue(`is_connected`) === true;
    });

};
