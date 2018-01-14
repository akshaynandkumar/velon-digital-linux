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
			
			var event = {};
			
			event.deviceId = data.deviceId;
			event.riderId = data.riderInformation.riderId != undefined ? data.riderInformation.riderId : 0;
			event.distance = data.geographicLocation.distance != undefined ? Math.round(data.geographicLocation.distance) : 0;
			event.lat = data.geographicLocation.snappedCoordinates.latitude != undefined ? data.geographicLocation.snappedCoordinates.latitude : 0;
			event.long = data.geographicLocation.snappedCoordinates.longitude != undefined ? data.geographicLocation.snappedCoordinates.longitude : 0;
			event.acceleration = data.riderStatistics.acceleration != undefined ? parseFloat(data.riderStatistics.acceleration.toFixed(2)) : 0;
			event.time = data.time != undefined ? data.time : 0;
			event.altitude = data.gps.altitude != undefined ? data.gps.altitude: 0;
			
			event.speed = data.riderInformation.speedInd ? (data.gps.speedGps != undefined ? data.gps.speedGps : 0) : 0 ;
			event.power =  data.riderInformation.powerInd ? (data.sensorInformation.power != undefined ? getFeedValue("power", data.sensorInformation.power) : 0) : 0;
			event.heartRate = data.riderInformation.HRInd ? (data.sensorInformation.heartRate != undefined ? getFeedValue("HR", data.sensorInformation.heartRate) : 0) : 0;
			event.cadence = data.riderInformation.cadenceInd ? (data.sensorInformation.cadence != undefined ? data.sensorInformation.cadence : 0) : 0;
			event.bibNumber = data.riderInformation.bibNumber != undefined ? data.riderInformation.bibNumber: 0;
			event.teamId = data.riderInformation.teamId != undefined ? data.riderInformation.teamId: 0;
								
			dataCallback(event);
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