const NodeCache = require( "node-cache" );
const raceEventCache = new NodeCache( { stdTTL: 300, checkperiod: 450 ,errorOnMissing: false} );
var lodash = require('lodash');

function RaceEvent(raceCentreDAO) {
	this.raceCentreDAO = raceCentreDAO;

}

RaceEvent.prototype = {

	getRaceEvents : function(dataCallback, endCallBack) {

	var self = this;
	
	var d = new Date();
	var seconds = d.getTime() / 1000;

	self.raceCentreDAO.getRaceData(seconds, dataCallback, endCallBack);
	
	}
};

module.exports = RaceEvent;