var format = require('util').format;

 var config = {}
 
 config.streamTypes = ["rider", "group"];
 
 config.raceCentreCollectionId = "RaceCentreFeed";
 config.raceGroupCentreCollectionId = "RaceGroupCentreFeed";

 config.mongodbVelon_poolSize = 5;
 
 config.loggerEnable = true;
 config.loggerDebug = false;
 
 config.resourceCount = 2;
 module.exports = config;
