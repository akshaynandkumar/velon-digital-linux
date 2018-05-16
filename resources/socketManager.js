var logger = require('./loggingManager');
var resourceManager = require('../resources/resourceManager');
var uuid = require('node-uuid');
var rooms = require("rooms");
var lodash = require('lodash');
var jsonpack = require('jsonpack');
var config = require('../config');

function SocketManager() {

}

var streamStatus = {
	"rider" : false,
	"group" : false
};

//Start the event stream
function startStream(type) {
	
	var stream = null;
	switch(type) {
		case "rider":
			stream = resourceManager.raceEvent;
			break;
		case "group":
			stream = resourceManager.raceGroupEvent;
			break;
	}
	
	if (stream != null) {
		stream.startStream(processData, handleStreamEnd, function (err) {
			if (err) {
				logger.errorLog(err.message);
			} else {
				streamStatus[type] = true;
				logger.infoLog(type + " event stream has started");
			}
		});
	} else {
		logger.infoLog("Unknown stream type");
	}
}

//Close the event stream - Optional: Pass in a success callback function
function closeStream(type, successCallback) {
	
	var stream = null;
	switch(type) {
		case "rider":
			stream = resourceManager.raceEvent;
			break;
		case "group":
			stream = resourceManager.raceGroupEvent;
			break;
	}
	if (stream != null) {
		stream.closeStream(function (err) {
			if (err) {
				logger.errorLog(err);
			} else {
				streamStatus[type] = false;
				logger.infoLog(type + " event stream has closed");
				if(successCallback != null) {
					successCallback();
				}
			}
		});
	} else {
		logger.infoLog("Unknown stream type");
	}
}

//Callback to handle data events from event stream
function processData(data, type) {
	socketManager.processData(data, type);
}

function handleStreamEnd(type) {
	var room  = rooms.find(type);
	if (!room.sockets || room.sockets.length == 0) {
		closeStream(type);
	} else {
		startStream(type);
	}
	
}

//Sends a message to a client connection - Optional: Can close connection after message sent
function sendClientMessage(client, code, reason, closeConnection) {
	var errorMessage = {'code':code, 'status':reason};
	client.send(JSON.stringify(errorMessage));
	if (closeConnection) {
		client.close();
	}
}

SocketManager.prototype = {
	init: function(serverSocket) {
		var self = this;
		self.serverSocket = serverSocket;
		self.serverSocket.on('connection', self.handleClientConnect);
	},
	
	handleClientConnect : function(client) {
		
		try {
			//Assign connection ID
			client.id = uuid.v1();
			logger.infoLog("Connection established with " + client.id);
			
			//Assign event handlers for client connection
			client.on('close', socketManager.handleClientDisconnect);
			client.on('message', socketManager.handleClientMessage);
			
		} catch (err) {
			logger.errorLog(err);
			sendClientMessage(client, 500, "Internal Server Error", true);
		}
	},
	
	handleClientMessage : function(message) {
		var client = this;
		try {
			//Parse message sent from client
			var connectionParams = JSON.parse(message);
					
			if (connectionParams != null) {
			
				logger.infoLog("Stream request from " + client.upgradeReq.headers.host + " assigned id:" + client.id);
				
				var feedType = connectionParams.type == null ? "rider" : connectionParams.type;
				var eventId = connectionParams.eventId;
				var stageId = connectionParams.stageId;
				
				//Auto accept client and add them to the digitial feed room
				client.jsonpack = connectionParams.jsonpack == null ? false : connectionParams.jsonpack;
				sendClientMessage(client, 200, "Start Streaming", false);	
				rooms.join(eventId + "-" + stageId + "-" + feedType, client);
				
				try {
					//Start event stream, if not already active.
					if (!streamStatus[feedType]) {
						startStream(feedType);
					}
				} catch (err) {
					logger.errorLog(err);
					sendClientMessage(client, 500, "Internal Server Error", true);
				}
				
				logger.infoLog("Streaming started for " + client.id);
				
			} else {
				logger.infoLog("Streaming request rejected for " + client.id + " - Reason: 400 Bad Request");
				sendClientMessage(client, 400, "Bad Request", true);	
			}
		
		} catch (err) {
			logger.errorLog("Streaming request rejected for " + client.id + " - Reason:" + err);
			sendClientMessage(client, 400, "Bad Request", true);
		}
	},
	
	handleClientDisconnect : function (code, reason) {
		try {
			var connectionId = this.id;
			logger.infoLog("Connection " + connectionId + " has been disconnected - Reason: " + code + " " + reason);
			
			//Remove client from digital room
			rooms.leave(this);
			
		} catch (err) {
			logger.errorLog(err);
		}
	},
	
	processData: function(data, type) {
		try {
			//Send data to all clients in the digital room, jsonpack if indicated by client
			var room  = rooms.find(type);
			if(room != undefined) {
				room.sockets.forEach(function(client) {
					if (client != null && client.readyState == 1) {
						if (client.jsonpack) {
							client.send(JSON.stringify(jsonpack.pack(data)));
						} else {
							client.send(JSON.stringify(data));
						}
					} 
				});
			}
		} catch (err) {
			logger.errorLog(err);
		}
	}
}
	
var socketManager = new SocketManager();

module.exports = socketManager;