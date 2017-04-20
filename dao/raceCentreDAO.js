function RaceCentreDAO(collectionId) {
	this.collectionId = collectionId;
	
	this.collection = null;
}

RaceCentreDAO.prototype = {
	
	init : function(db, callback) {
		var self = this;
		
		self.collection = db.collection(self.collectionId);
		if (self.collection == null) {
			callback("Could not get collection " + self.collectionId);
		} else {
			callback(null);
		}
	},

	
	getRaceData : function(seconds, dataCallback, endCallBack, startCallback) {

		var self = this;
		
		try {
			var cursor = self.collection.find({"time.epochTime": {"$gte": seconds}}, { tailable: true });
		    
			// Get stream from cursor and apply event handlers
			var cursorStream = cursor.stream();
			cursorStream.on('data', dataCallback);
			cursorStream.on('end', endCallBack);
			
			startCallback(null, cursorStream);
		
		} catch (err) {
			startCallback(err);
		}
	}
};

module.exports = RaceCentreDAO;
