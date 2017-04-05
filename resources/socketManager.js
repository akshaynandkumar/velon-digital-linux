var logger = require('./loggingManager');
var resourceManager = require('../resources/resourceManager');
var sendBuffer = [];

function SocketManager() {

}

function handleConnect(connectMsg) {
	var self = this;
	self.join('broadcast');
	setTimeout(function() {
		self.send("{'disconnect': true}");
		self.disconnect();
	},30000);
}

function handleDisconnect(client) {
	
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
		
		client.on('disconnect', handleDisconnect);
	},
	
	processData: function(data) {
		this.serverSocket.to('broadcast').send(JSON.stringify(data));
	}
}
	
var socketManager = new SocketManager();

module.exports = socketManager;