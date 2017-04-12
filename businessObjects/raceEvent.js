var riderDevice = require('./riderDevice');
var referenceDataManager = require('../resources/referenceDataManager');
var lodash = require('lodash');

function RaceEvent(raceCentreDAO) {
	this.raceCentreDAO = raceCentreDAO;
	this.stream = null;
	this.dataCallback = null;
}

RaceEvent.prototype = {

	startStream : function(dataCallback, endCallBack) {
		var self = this;
		
		if(self.stream != null) {
			if(!self.stream.isClosed()) {
				self.stream.resume();
			}
		} else {
			var d = new Date();
			var seconds = d.getTime() /1000;
			self.stream = self.raceCentreDAO.getRaceData(seconds, processDataCallback, endCallBack);
		}	
	
		function processDataCallback(data) {
			
			referenceDataManager.getRiderDeviceMapping(data.raceId, function(err, riderDeviceMapping) {
				if (err) {
					logger.errorLog(err);
					throw 500;
				} else {
					var event = {};
					event.riderId = data.riderId != undefined ? data.riderId : 0;
					event.distance = data.distance != undefined ? data.distance : 0;
					event.long = data.longSnapped != undefined ? data.longSnapped : 0;
					event.lat = data.latSnapped != undefined ? data.latSnapped : 0;
					event.acceleration = data.acceleration != undefined ? data.acceleration : 0;
					event.time = data.time != undefined ? data.time : 0;
					event.altitude = data.altitude != undefined ? data.altitude: 0;
					
					var riderDeviceInformation = riderDevice.getRiderDeviceInformation(data.riderId, riderDeviceMapping);
					
					//Hide values depending on rider device information
					if (riderDeviceInformation != null) {
						
						event.deviceId = riderDeviceInformation.deviceId != null ? riderDeviceInformation.deviceId : 0;
						
						event.speed = riderDeviceInformation.speedInd ? (data.speed != undefined ? data.speed
								: (data.speedGPS != undefined ? data.speedGPS : 0)) : 0;
						
						event.heartRate = riderDeviceInformation.HRInd ? (data.heartRate != undefined ? data.heartRate : 0) : 0;
						
						event.power = riderDeviceInformation.powerInd ? (data.power != undefined ? data.power : 0 ) : 0;
						
					} else {
						event.deviceId = 0;
						event.speed = data.speed != undefined ? data.speed :(data.speedGPS != undefined ? data.speedGPS : 0);
						event.heartRate = data.heartRate != undefined ? data.heartRate : 0;
						event.power = data.power != undefined ? data.power : 0;
						
					}
					
					dataCallback(event);
				}
			});
		}
	},
	
	pauseStream : function() {
		var self = this;
		
		if (self.stream != null) {
			self.stream.pause();
		}
	}
};

module.exports = RaceEvent;