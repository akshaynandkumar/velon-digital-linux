const NodeCache = require( "node-cache" );
var moment = require('moment');

function ReferenceDataManager() {
	this.riderDeviceCache = new NodeCache( { stdTTL: 300, checkperiod: 300 ,errorOnMissing: false});
	this.raceConfig = null;
}

ReferenceDataManager.prototype = {
		
		setRaceConfig : function(raceConfig) {
			this.raceConfig = raceConfig;
		},
		
		//RiderDeviceCache
		getRiderDeviceMapping : function(eventID, stageID,  callback) {
			var self = this;
			var key = eventID + "-" + stageID;
			var riderDeviceMapping = self.riderDeviceCache.get(key);
			if (riderDeviceMapping == null) {
				self.raceConfig.getRiderDeviceMapping(eventID, stageID, function(err, riderDeviceMapping) {
					if (err) {
						callback(err);
					} else {
						if (riderDeviceMapping != null) {
							self.riderDeviceCache.set(key, riderDeviceMapping);
						}
						callback(null, riderDeviceMapping);
					}
				});
			} else {
				callback(null, riderDeviceMapping);
			}
		}
}

referenceDataManager = new ReferenceDataManager();

module.exports = referenceDataManager;