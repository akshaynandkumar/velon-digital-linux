var moment = require('moment');
var lodash = require('lodash');
var referenceDataManager = require('../resources/referenceDataManager');

function RiderDevice() {
}

RiderDevice.prototype = {
		
	getRiderDeviceInformation : function (riderID, riderDeviceMapping) {
		
		//Deal for the case in where riderDeviceMapping hasn't been set for a race.
		if (riderDeviceMapping == null) {
			return null;
		} else {
			
			var currentEpoch = moment().utc().valueOf()/1000|0;
			
			var riderDeviceInformation = lodash.find(riderDeviceMapping.mapping, function(rider) {
				if (rider.riderId == riderID) {
					if (currentEpoch >= rider.activationTime.epochTime && (currentEpoch < rider.deactivationTime.epochTime
							|| rider.deactivationTime.epochTime == 0)) {
						if (rider.deviceState == "Active") {
							return true;
						}
					}
				}
				return false;
			});
			return riderDeviceInformation;
		}
	}
};

riderDevice = new RiderDevice();

module.exports = riderDevice;