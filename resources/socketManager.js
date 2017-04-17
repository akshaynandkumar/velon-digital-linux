var logger = require('./loggingManager');
var resourceManager = require('../resources/resourceManager');
var uuid = require('node-uuid');
var rooms = require("rooms");
var lodash = require('lodash');
var jsonpack = require('jsonpack');
var config = require('../config');

var activeConnections = [];
var streamActive = false;

function SocketManager() {

}

function startStream() {
	resourceManager.raceEvent.startStream(processData, handleStreamEnd);
	streamActive = true;
}

function pauseStream() {
	resourceManager.raceEvent.pauseStream();
	streamActive = false;
}

function handleStreamEnd() {
	if (activeConnections.length != 0) {
		startStream();
	}
}

function processData(data) {
	socketManager.processData(data);
}

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
			var connectionParams = JSON.parse(message);
			clearTimeout(client.authMessageTimeout);
		
			if (connectionParams != null) {
			
				logger.infoLog("Stream request from " + client.upgradeReq.headers.host + " assigned id:" + client.id);
				
				var userDetails = connectionParams.userDetails;
				//Log Details TODO
				
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
			
			rooms.leave(this);
			
			//Remove from activeUserConnections list
			var userConnectionIndex = lodash.findIndex(activeConnections, connectionId);
			activeConnections.splice(userConnectionIndex, 1);
			
			//If no active connections, pause event stream.
			if (activeConnections.length == 0) {
				//pauseStream();
			}
		} catch (err) {
			logger.errorLog(err);
		}
	},
	
	processData: function(data) {
		try {
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
		} catch (err) {
			logger.errorLog(err);
		}
	}
}
	
var socketManager = new SocketManager();

module.exports = socketManager;