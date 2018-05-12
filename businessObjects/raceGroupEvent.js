var lodash = require('lodash');

function RaceGroupEvent(raceGroupCentreDAO) {
	this.raceGroupCentreDAO = raceGroupCentreDAO;
	this.stream = null;
	this.dataCallback = null;
}

RaceGroupEvent.prototype = {

	//Start race event stream
	startStream : function(dataCallback, endCallBack, startCallback) {
		var self = this;

		var d = new Date();
		var milliseconds = Math.floor(d.getTime() / 1000) * 1000; //Remove millisecond component from timestamp
		
		self.raceGroupCentreDAO.getRaceGroupData(milliseconds, processDataCallback, handleEndCallBack, function(err, cursorStream) {
			if(err) {
				startCallback(err);
			} else {
				self.stream = cursorStream;
				startCallback(null);
			}
		});
	
		//Process incoming data event - Hides values as per rider device info
		function processDataCallback(data) {
			delete data._id;
			delete data.endProcessingTime;
			data.groups.forEach(function(group) {
				
				//Attribute Formatting
				data.avgSpeed = data.avgSpeed != null ? data.avgSpeed.toFixed(1) : null;
				data.avgPower = data.avgPower != null ? data.avgPower.toFixed(0) : null;
			});
			
			var eventStageId = data.eventId + "-" + data.stageId;
			dataCallback(data, eventStageId + "-group");
		}
		
		function handleEndCallBack() {
			endCallBack("group");
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

module.exports = RaceGroupEvent;