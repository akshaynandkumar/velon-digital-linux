var azureLogger = require('azure-logger');
var config = require('../config');

var warningOptions = {
	    table: 'velonDigital',
	    entryType: 'warning'
};

var errorOptions = {
	    table: 'velonDigital',
	    entryType: 'error'
};

var infoOptions = {
		table: 'velonDigital',
	    entryType: 'info'
}

var enabled = config.loggerEnable;

var debug = config.loggerDebug;

// On initialisation check if require environment variables are configured.  If not disable, the azure logger
function Logger() {
  if(process.env.AZURE_STORAGE_ACCOUNT == undefined || process.env.AZURE_STORAGE_ACCESS_KEY == undefined) {
	  enabled = false;
  }
}
Logger.prototype = {

		errorLog : function(msg) {
			if(enabled && !debug) {
				azureLogger.log(JSON.stringify(msg),errorOptions, function (err, res) {
				    if (err) {
				    	console.log("Error writing to Logging Blob store: " + JSON.stringify(errorOptions));
				    }
				});
			} else {
				console.log("ERROR: " + JSON.stringify(msg));
			}
		},
		
		warnLog : function(msg) {
			if(enabled && !debug) {
				azureLogger.log(JSON.stringify(msg), warningOptions, function (err, res) {
				    if (err) {
				    	console.log("Error writing to Logging Blob store: " + JSON.stringify(warningOptions));
				    }
				});
			} else {
				console.log("WARN: " + JSON.stringify(msg));
			}

		},
		
		infoLog : function(msg) {
			if(enabled && debug) {
				azureLogger.log(JSON.stringify(msg), infoOptions, function (err, res) {
				    if (err) {
				    	console.log("Error writing to Logging Blob store: " + JSON.stringify(infoOptions));
				    }
				});
			} else {
				console.log("INFO: " + JSON.stringify(msg));
			}
		}
	};

logger = new Logger();

module.exports = logger;
