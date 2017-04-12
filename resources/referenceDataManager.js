const NodeCache = require( "node-cache" );

function ReferenceDataManager() {
	this.riderDeviceCache = new NodeCache( { stdTTL: 300, checkperiod: 300 ,errorOnMissing: false});
	this.raceConfig = null;
}

ReferenceDataManager.prototype = {
		
		setRaceConfig : function(raceConfig) {
			this.raceConfig = raceConfig;
		},
		
		//RiderDeviceCache
		getRiderDeviceMapping : function(raceID, callback) {
			var self = this;
			
			var riderDeviceMapping = self.riderDeviceCache.get(raceID);
			if (riderDeviceMapping == null) {
				self.raceConfig.getRiderDeviceMapping(raceID, function(err, riderDeviceMapping) {
					if (err) {
						callback(err);
					} else {
						if (riderDeviceMapping != null) {
							self.riderDeviceCache.set(raceID, riderDeviceMapping);
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