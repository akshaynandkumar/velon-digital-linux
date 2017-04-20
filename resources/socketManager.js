var logger = require('./loggingManager');
var resourceManager = require('../resources/resourceManager');
var uuid = require('node-uuid');
var rooms = require("rooms");
var lodash = require('lodash');
var jsonpack = require('jsonpack');
var config = require('../config');

//List of current active connections
var activeConnections = [];

//Flag whether race event stream is active
var streamActive = false;

function SocketManager() {

}

//Start the event stream
function startStream() {
	resourceManager.raceEvent.startStream(processData, handleStreamEnd, function (err) {
		if (err) {
			logger.errorLog(err);
		} else {
			streamActive = true;
			logger.infoLog("Event stream has started");
		}
	});
}

//Close the event stream - Optional: Pass in a success callback function
function closeStream(successCallback) {
	resourceManager.raceEvent.closeStream(function(err) {
		if (err) {
			logger.errorLog(err);
		} else {
			streamActive = false;
			logger.infoLog("Event stream has closed");
			if(successCallback != null) {
				successCallback();
			}
		}
	});
}

//Callback for reaching the end of the collection
function handleStreamEnd() {
	if(streamActive) {
		closeStream(function(){
			if (activeConnections.length != 0) {
				startStream();
			}
		});
	}
}

//Callback to handle data events from event stream
function processData(data) {
	socketManager.processData(data);
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
			
			//Set timeout for start streaming auth message - 1 minute
			client.authMessageTimeout = setTimeout(function() {
				sendClientMessage(client, 400, "Bad Request", true);
			}, 60000)
			
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
			
			//Clear timeout that kicks client if no auth message sent for 1 minute. 
			clearTimeout(client.authMessageTimeout);
		
			if (connectionParams != null) {
			
				logger.infoLog("Stream request from " + client.upgradeReq.headers.host + " assigned id:" + client.id);
				
				var userDetails = connectionParams.userDetails;
				//Log Details TODO
				
				//Auto accept client and add them to the Digital room
				client.jsonpack = connectionParams.jsonpack == null ? false : connectionParams.jsonpack;
				sendClientMessage(client, 200, "Start Streaming", false);	
				rooms.join('digital', client);
				activeConnections.push(client.id);
				
				try {
					//Start event stream, if not already active.
					if (!streamActive) {
						startStream();
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
			
			//Remove from activeUserConnections list
			var userConnectionIndex = lodash.findIndex(activeConnections, connectionId);
			activeConnections.splice(userConnectionIndex, 1);
			
			//If no active connections, pause event stream.
			if (activeConnections.length == 0 && streamActive) {
				closeStream();
			}
		} catch (err) {
			logger.errorLog(err);
		}
	},
	
	processData: function(data) {
		try {
			if (streamActive) {
				
				//Send data to all clients in the digital room, jsonpack if indicated by client
				var room  = rooms.find('digital');
				if(room != undefined) {
					room.sockets.forEach(function(client) {
						if (client != null && client.readyState == 1) {
							if (client.jsonpack == true) {
								client.send(JSON.stringify(jsonpack.pack(data)));
							} else {
								client.send(JSON.stringify(data));
							}
						} 
					});
				}
			}
		} catch (err) {
			logger.errorLog(err);
		}
	}
}
	
var socketManager = new SocketManager();

module.exports = socketManager;