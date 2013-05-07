var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, {'log level': 1});
var fs = require('fs');

// service settings file
var config = require('./config.json');


var connectionCount = 0;



app.get('/app.css', function (req, res) {
	console.log('connection %j %s %s',  req.connection.remoteAddress, req.method, req.url);
	res.sendfile(__dirname + '/app.css');
});
app.get('/stats', function(req, res){
	res.send(connectionCount +  " clients connected");
	console.log('connection %j %s %s',  req.connection.remoteAddress, req.method, req.url);
	console.log('This process is pid ' + process.pid + " with an uptime of " + process.uptime());
	console.log('Running on ' + process.platform + ' (' + process.arch + ')');
});
app.get('/power', function(req, res) {
	console.log('connection %j %s %s',  req.connection.remoteAddress, req.method, req.url);
	fs.readFile(__dirname + '/power.html',
  		function (err, data) {
    		if (err) {
      			res.writeHead(500);
      			return res.end('Error loading power.html');
    		}
    		res.writeHead(200);
    		res.end(data);
  	});

});
app.get('/', function(req, res) {
	console.log('connection %j %s %s',  req.connection.remoteAddress, req.method, req.url);
	fs.readFile(__dirname + '/index.html',
  		function (err, data) {
    		if (err) {
      			res.writeHead(500);
      			return res.end('Error loading index.html');
    		}
    		res.writeHead(200);
    		res.end(data);
  	});

});



// start the server
server.listen(8500);
console.log('listening on port 8500');


io.sockets.on('connection', function (socket) {
	connectionCount++;
});
io.sockets.on('disconnet', function (socket) {
	connectionCount--;
});


// subscribe to MQTT
var mqtt = require('mqtt');
var client = mqtt.createClient(1883, config.mqtt.host, function(err, client) {
		keepalive: 1000
});
console.log('connecting to mqtt on ' + config.mqtt.host + '(' + config.mqtt.port + ')');

client.on('connect', function() {
	client.subscribe('sensors/+/+');
	console.log('subscribing to sensors/+/+ on ' + config.mqtt.host + '(' + config.mqtt.port + ')');

  	client.on('message', function(topic, message) {
		// console.log('topic: ' + topic + ' payload: ' + message);
  		io.sockets.emit('data', { topic: topic, value: message });
  	});
});
