function RaceConfig(raceConfigDAO) {
	this.raceConfigDAO = raceConfigDAO;

}

RaceConfig.prototype = {
	
	getRiderDeviceMapping : function(raceID, callback) {
		var self = this;
		
		self.raceConfigDAO.getRiderDeviceMapping(raceID, function(err, riderDeviceMapping) {
			if(err) {
				callback(err);
			} else {
				callback(null, riderDeviceMapping);
			}
		});
		
	}
};

module.exports = RaceConfig;