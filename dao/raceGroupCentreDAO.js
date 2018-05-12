function RaceGroupCentreDAO(collectionId) {
	this.collectionId = collectionId;
	
	this.collection = null;
}

RaceGroupCentreDAO.prototype = {
	
	init : function(db, callback) {
		var self = this;
		
		self.collection = db.collection(self.collectionId);
		if (self.collection == null) {
			callback("Could not get collection " + self.collectionId);
		} else {
			callback(null);
		}
	},

	getRaceGroupData : function(milliseconds, dataCallback, endCallBack, startCallback) {

		var self = this;
		
		try {
			var cursor = self.collection.find({"endProcessingTime": {"$gte": milliseconds}}, {"_id":0, "endProcessingTime":0}, { tailable: true });
					
			var cursorStream = cursor.stream();
			cursorStream.on('data', dataCallback);
			cursorStream.on('end', endCallBack);
			
			startCallback(null, cursorStream);
		} catch (err) {
			startCallback(err);
		}
	}
};

module.exports = RaceGroupCentreDAO;
