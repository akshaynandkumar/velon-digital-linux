var lodash = require('lodash');
var raceEventMask = require('../resources/raceEventMaskTable');

function RaceEvent(raceCentreDAO) {
	this.raceCentreDAO = raceCentreDAO;
	this.stream = null;
	this.dataCallback = null;
}

RaceEvent.prototype = {

	//Start race event stream
	startStream : function(dataCallback, endCallBack, startCallback) {
		var self = this;

		var d = new Date();
		var milliseconds = Math.floor(d.getTime() / 1000) * 1000; //Remove millisecond component from timestamp
		self.raceCentreDAO.getRaceData(milliseconds, processDataCallback, handleEndCallBack, function(err, cursorStream) {
			if(err) {
				startCallback(err);
			} else {
				self.stream = cursorStream;
				startCallback(null);
			}
		});
	
		//Process incoming data event - Hides values as per rider device info
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
			event.gradient = data.geographicLocation.gradient != undefined ? data.geographicLocation.gradient: 0;
			
			//Add speed object
			var speed = data.riderInformation.speedInd ? (data.gps.speedGps != undefined ? data.gps.speedGps : 0) : 0 ;
			event.speed = {
					"current" : speed,
					"avg10km" : 0.0,
					"avg30km" : 0.0
			}
			
			//Add power object
			var power =  data.riderInformation.powerInd ? (data.sensorInformation.power != undefined ? data.sensorInformation.power : 0) : 0;
			event.power = {
					"current" : getFeedValue("power", power),
					"avg10km" : 0,
					"avg30km" : 0
			}
			
			event.heartRate = data.riderInformation.HRInd ? (data.sensorInformation.heartRate != undefined ? getFeedValue("HR", data.sensorInformation.heartRate) : 0) : 0;
			event.cadence = data.riderInformation.cadenceInd ? (data.sensorInformation.cadence != undefined ? data.sensorInformation.cadence : 0) : 0;
			event.bibNumber = data.riderInformation.bibNumber != undefined ? data.riderInformation.bibNumber: 0;
			event.teamId = data.riderInformation.teamId != undefined ? data.riderInformation.teamId: 0;
			
			var eventStageId = data.riderInformation.eventId + "-" + data.riderInformation.stageId;		
			dataCallback(event, eventStageId + "-rider");
		}
		
		function handleEndCallBack() {
			endCallBack("rider");
		}
		
		function getFeedValue(type, value) {
			var feedValue = null;
			var diff = Number.MAX_SAFE_INTEGER;
			var feedFlag = 0
			raceEventMask.forEach(function(mapping) {
				if (value == mapping[type]) {
					feedFlag = 1;
					feedValue = mapping.feed;
				} else {
					if (feedFlag == 0){
					var currentDiff = Math.abs(value - mapping[type]);
						if (currentDiff < diff) {
							diff = currentDiff;
							feedValue = mapping.feed;
					}}
				}
			});
			return feedValue;
		}
	},
	
	//Close race event stream
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

module.exports = RaceEvent;