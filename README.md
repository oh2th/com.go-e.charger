# go-e Charger

Smart EV Charging from go-e

Support for the go-e Home and Gemini family of EV chargers.

## Supported flow cards

### When

- Finished charging
- Charging ended
- Charging started
- Car connected
- Car unplugged
- Charging allowed
- Charging disallowed
- Status changed
- Turned on
- Turned off
- The electric power becomes greater/less than `number`W
- The electric current becomes greater/less than `number`A
- The electric voltage becomes greater/less than `number`V
- The delivered total energy becomes `number`kWh
- The delivered energy this session becomes `number`kWh
- The internal temperature becomes greater/less than `number`°C
- The charge port temperature becomes greater/less than `number`°C

### And

- Finished charging
- Is charging
- Charging is allowed
- A car is plugged in
- Is turned on

### Then

- Allow charging
- Stop charging
- Change current limit to `amperage`A
- Turn on
- Turn off
- Toggle on or off

## Variables

## Enum

- Device status `car` (Unknown/Error=0, Idle=1, Charging=2, WaitCar=3, Complete=4, Error=5)
- Error status `err` (None = 0, FiAc = 1, FiDc = 2, Phase = 3, Overvolt = 4, Overamp = 5, Diode = 6, PpInvalid = 7, GndInvalid = 8, ContactorStuck = 9, ContactorMiss = 10, FiUnknown = 11, Unknown = 12, Overtemp = 13, NoComm = 14, StatusLockStuckOpen = 15, StatusLockStuckLocked = 16, Reserved20 = 20, Reserved21 = 21, Reserved22 = 22, Reserved23 = 23, Reserved24 = 24)

### True/False, Yes/No

- Car plugged in
- Charging
- Charging allowed
- Charging finished
- Errorstatus

### Number

- Current amperage supplied
- Current power supplied
- Current voltage supplied
- Maximum power as set in the device's app
- Maximum power from the source available for charging
- Energy delivered in this session `wh`
- Charge Port Temperature `tma`
- Internal Temperature `tma`
- Total Energy Delivered `eto`
- Wifi signal RSSI `rssi`
