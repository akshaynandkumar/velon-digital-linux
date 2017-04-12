function RaceCentreDAO(collectionId) {
	this.collectionId = collectionId;
	
	this.collection = null;
}

RaceCentreDAO.prototype = {
	
	init : function(db, callback) {
		var self = this;
		
		this.collection = db.collection(this.collectionId);
		if (this.collection == null) {
			callback("Could not get collection " + this.collectionId);
		} else {
			callback(null);
		}
	},

	getRaceData : function(seconds, dataCallback, endCallBack) {

		var self = this;
		var cursor = this.collection.find({"time.epochTime": {"$gte": seconds}}, { tailable: true });
	    var cursorStream = cursor.stream();
	    var itemsProcessed = 0;
		
		cursorStream.on('data', dataCallback);
		cursorStream.on('end', endCallBack);
		
		return cursorStream;
	}
};

module.exports = RaceCentreDAO;
