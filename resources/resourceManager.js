var inits = require('inits');
var logger = require('./loggingManager');
var referenceDataManager = require('./referenceDataManager');
var MongoClient = require('mongodb').MongoClient;

var resourceManager = {};

/**
 * Initalisation Routine: Initalises all DAOs, signals Start Routine once all
 * DAO have successfully been initialised.
 */
inits.init(function(callback) {

	var config = require('../config');
	var resourceInitList = [];

	/**
	 * Registers a resource when it has completed initialising, when all
	 * resources have initialised it will callback the inits.init routine
	 * indicating all initialisation is complete.
	 * 
	 * Number of resources to initialise is determined by config.resourceCount
	 * param.
	 * 
	 * @param resourceName
	 */
	function registerResourceInit(resourceName) {

		logger.infoLog("Initialised " + resourceName + " ("
				+ (resourceInitList.length + 1) + "/" + config.resourceCount
				+ ")");
		resourceInitList.push(resourceName);

		if (resourceInitList.length == config.resourceCount) {
			logger.infoLog("All " + config.resourceCount
					+ " Resources initalised");
			callback(null);
		}
	}

	//Require DAOs and business objects
	var RaceCentreDAO = require('../dao/raceCentreDAO');
	var RaceEvent = require('../businessObjects/raceEvent');
		
	var RaceConfigDAO = require('../dao/raceConfigDAO');
	var RaceConfig = require('../businessObjects/raceConfig');
	
	//Create MongoDB database objects - Used to close connections.
	var mongoDBVelon = null;
	
	// RaceCentre DAO
	var raceCentreDAO = new RaceCentreDAO(config.raceCentreCollectionId);
	var raceEvent = new RaceEvent(raceCentreDAO);
		
	// RaceConfig DAO
	var raceConfigDAO = new RaceConfigDAO(config.raceConfigCollectionId);
	var raceConfig = new RaceConfig(raceConfigDAO);
	referenceDataManager.setRaceConfig(raceConfig);
	
	// Create a connection pool for database Velon, with a pool size 
	MongoClient.connect(config.mongoDBVelon, { poolSize: config.mongoDBVelon.poolSize}, function(err, db) {
		if (err) {
			callback(err);
		} else {
			logger.infoLog("Connection pool created for MongoDB-Velon database");
			
			mongoDBVelon = db;
			
			//Init raceCentreDAO
			raceCentreDAO.init(db, function(err) {
				if (err) {
					callback(err);
				} else {
					registerResourceInit("raceCentreDAO");
				}
			});
			
			//Init raceConfigDAO
			raceConfigDAO.init(db, function(err) {
				if (err) {
					callback(err);
				} else {
					registerResourceInit("raceConfigDAO");
				}
			});
			
		}
	});

	//Populate ResourceManager
	resourceManager.raceEvent = raceEvent;
});

module.exports = resourceManager;
