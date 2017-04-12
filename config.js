var format = require('util').format;

 var config = {}
 
 config.raceCentreCollectionId = "RaceCentreFeed";
 config.raceConfigCollectionId = "RaceConfig";

 config.mongoDBVelon = "mongodb://apiuser:f4gcggdv3gh5f56@10.0.0.6:27017,10.0.0.7:27017,10.0.0.8:27017/Velon?replicaSet=rs0";
 config.mongoDBVelon.poolSize=5;
 
 config.loggerEnable = true;
 config.loggerDebug = false;

 config.resourceCount = 2;
 module.exports = config;
