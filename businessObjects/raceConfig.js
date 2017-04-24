function RaceConfig(raceConfigDAO) {
	this.raceConfigDAO = raceConfigDAO;

}

RaceConfig.prototype = {
	
		getRiderDeviceMapping : function(eventID, stageID, callback) {
			var self = this;

			self.raceConfigDAO.getRiderDeviceMapping(eventID, stageID, function(err, riderDeviceMapping) {
				if(err) {
					callback(err);
				} else {
					callback(null, riderDeviceMapping);
				}
			});
			
		}
};

module.exports = RaceConfig;