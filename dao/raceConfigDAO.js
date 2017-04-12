var logger = require('../resources/loggingManager');

function RaceConfigDAO(collectionId) {
	this.collectionId = collectionId;
	
	this.collection = null;
}

RaceConfigDAO.prototype = {
	init : function(db, callback) {
		var self = this;
		
		self.collection = db.collection(self.collectionId);
		if (self.collection == null) {
			callback("Could not get collection " + self.collectionId);
		} else {
			callback(null);
		}
	},
	
	getRiderDeviceMapping : function(raceID, callback) {
		var self = this;
		
		self.collection.findOne({entityType:"riderDeviceMapping", eventId:raceID}, {_id:0}, function(err, riderDeviceMapping) {
			if (err) {
				callback(err);
			} else if (riderDeviceMapping == null) {
				logger.warnLog("No rider deviceMapping exists for raceID:" + raceID + " " + typeof raceID);
				callback(null, null);
			} else {
				callback(null, riderDeviceMapping);
			}
		});
	}
};

module.exports = RaceConfigDAO;
