var riderDevice = require('./riderDevice');
var referenceDataManager = require('../resources/referenceDataManager');
var lodash = require('lodash');

var raceEventMask = require('../resources/raceEventMaskTable');

function RaceEvent(raceCentreDAO) {
	this.raceCentreDAO = raceCentreDAO;
	this.stream = null;
	this.dataCallback = null;
}

RaceEvent.prototype = {

	startStream : function(dataCallback, endCallBack, startCallback) {
		var self = this;

		var d = new Date();
		var seconds = d.getTime() /1000;
		self.raceCentreDAO.getRaceData(seconds, processDataCallback, endCallBack, function(err, cursorStream) {
			if(err) {
				startCallback(err);
			} else {
				self.stream = cursorStream;
				startCallback(null);
			}
		});	
	
		function processDataCallback(data) {
			
			referenceDataManager.getRiderDeviceMapping(data.eventId, data.stageId, function(err, riderDeviceMapping) {
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
						
						event.speed = riderDeviceInformation.speedInd ? (data.speedInd ? data.speed : (data.speedGPS != undefined ? data.speedGPS : 0)) : 0;
						
						event.heartRate = riderDeviceInformation.HRInd ? (data.heartRate != undefined ? getFeedValue("HR",data.heartRate) : 0) : 0;
						
						event.power = riderDeviceInformation.powerInd ? (data.power != undefined ? getFeedValue("power", data.power) : 0 ) : 0;
						
						event.cadence = riderDeviceInformation.cadenceInd ? (data.cadence != undefined ? data.cadence : 0 ) : 0;
						
						event.bibNumber = riderDeviceInformation.bibNumber != undefined ? riderDeviceInformation.bibNumber : 0;
						
						event.teamId = riderDeviceInformation.teamId != undefined ? riderDeviceInformation.teamId : 0;
						
					} else {
						event.deviceId = 0;
						event.speed = data.speedInd ? data.speed : (data.speedGPS != undefined ? data.speedGPS : 0)
						event.heartRate = data.heartRate != undefined ? getFeedValue("HR",data.heartRate) : 0;
						event.power = data.power != undefined ? getFeedValue("power", data.power) : 0;
						event.cadence = data.cadence != undefined ? data.cadence : 0;
						event.bibNumber = 0;
						event.teamId = 0;
					}
					
					dataCallback(event);
				}
			});
		}
	},
	
	closeStream : function(callback) {
		var self = this;
		
		if (self.stream != null) {
			self.stream.close(function(err) {
				if (err) {
					callback(err);
				} else {
					callback(null);
				}
			});
		}
	}
};

function getFeedValue(type, value) {
	var feedValue = null;
	var diff = Number.MAX_SAFE_INTEGER;
	raceEventMask.forEach(function(mapping) {
		if (value == mapping[type]) {
			return mapping.feed;
		} else {
			var currentDiff = Math.abs(value - mapping[type]);
			if (currentDiff < diff) {
				diff = currentDiff;
				feedValue = mapping.feed;
			}
		}
	});
	return feedValue;	
}

module.exports = RaceEvent;