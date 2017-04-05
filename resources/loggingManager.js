var azureLogger = require('azure-logger');
var config = require('../config');

var warningOptions = {
	    table: 'velonRace',
	    entryType: 'warning'
};

var errorOptions = {
	    table: 'velonRace',
	    entryType: 'error'
};

var enabled = config.loggerEnable;

// On initialisation check if require environment variables are configured.  If not disable, the azure logger
function Logger() {
  if(process.env.AZURE_STORAGE_ACCOUNT == undefined || process.env.AZURE_STORAGE_ACCESS_KEY == undefined) {
	  enabled = false;
  }
}
Logger.prototype = {

		errorLog : function(msg) {
			if(enabled) {
				azureLogger.log(JSON.stringify(msg),errorOptions, function (err, res) {
				    if (err) {
				    	console.log("Error writing to Logging Blob store: " + JSON.stringify(errorOptions));
				    }
				});
			} else {
				console.log(JSON.stringify(msg));
			}
			

		},
		
		warnLog : function(msg) {
			if(enabled) {
				azureLogger.log(JSON.stringify(msg), warningOptions, function (err, res) {
				    if (err) {
				    	console.log("Error writing to Logging Blob store: " + JSON.stringify(warningOptions));
				    }
				});
			} else {
				console.log(JSON.stringify(msg));
			}

		},
		
		infoLog : function(msg) {
			if(enabled) {
				console.log(JSON.stringify(msg));
			}
		}
	};

logger = new Logger();

module.exports = logger;
