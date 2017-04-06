var logger = require('./loggingManager');
var resourceManager = require('../resources/resourceManager');
var uuid = require('node-uuid');
var rooms = require("rooms");

function SocketManager() {

}

function handleConnect(connectMsg) {
	var self = this;
	self.id = uuid.v1();
	rooms.join('broadcast',self);
	setTimeout(function() {
		if(self.readyState == 1) {
			self.close("{'disconnect': true}");
		}
		rooms.leave(self);
	},30000);
}

function handleDisconnect(client) {
	rooms.leave(this);
}

function initialiseStream() {
	resourceManager.raceEvent.getRaceEvents(processData, handleStreamEnd);
}

function handleStreamEnd() {
	initialiseStream()
}

function processData(data) {
	socketManager.processData(data);
}

SocketManager.prototype = {
	init: function(serverSocket) {
		this.serverSocket = serverSocket;
		initialiseStream();
	},
		
	handleConnection : function(client) {
		
		client.on('message', handleConnect);
		
		client.on('close', handleDisconnect);
	},
	
	processData: function(data) {
		var room  = rooms.find('broadcast');
		if(room != undefined) {
			rooms.find('broadcast').sockets.forEach(function(client) {
				client.send(JSON.stringify(data));
			});
		}
	}
}
	
var socketManager = new SocketManager();

module.exports = socketManager;