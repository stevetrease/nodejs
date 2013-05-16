var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, {'log level': 2});
var fs = require('fs');

// service settings file
var config = require('./config.json');


//
//	A whole load of very clumsy routing for static pages and js 
//
//	First of all log all connections
app.use(function(req, res, next){
	console.log('one connection %j %s %s',  req.connection.remoteAddress, req.method, req.url);
  	next();
});
app.get('/smoothie.js', function (req, res) {
	res.sendfile(__dirname + '/pages/js/smoothie.js');
});
app.get('/jquery.min.js', function (req, res) {
	res.sendfile(__dirname + '/pages/js/jquery.min.js');
});
app.get('/app.css', function (req, res) {
	res.sendfile(__dirname + '/pages/app.css');
});
app.get('/sensors', function(req, res) {
	res.sendfile(__dirname + '/pages/sensors.html');
});
app.get('/mqtt', function(req, res) {
	res.sendfile(__dirname + '/pages/mqtt.html');
});
app.get('/mqttstats', function(req, res) {
	res.sendFile(__dirname + '/pages/mqttstats.html');
});
app.get('/stats', function(req, res){
	console.log('This process is pid ' + process.pid + " with an uptime of " + process.uptime());
	console.log('Running on ' + process.platform + ' (' + process.arch + ')');
});




server.listen(8500);
console.log('listening on port 8500');




io.of('/sensors').on('connection', function (socket) {
	// subscribe to MQTT
	var mqtt = require('mqtt');
	var mqttclient = mqtt.createClient(1883, config.mqtt.host, function(err, client) {
			keepalive: 1000
	});

	mqttclient.on('connect', function() {
		mqttclient.subscribe('sensors/+/+');
		// console.log('subscribing to sensors/+/+ on ' + config.mqtt.host + '(' + config.mqtt.port + ')');

  		mqttclient.on('message', function(topic, message) {
			// console.log('emitting topic: ' + topic + ' payload: ' + message);
  			socket.emit('data', { topic: topic, value: message });
  		});
  	});
});

io.of('/mqtt').on('connection', function (socket) {
	// subscribe to MQTT
	var mqtt = require('mqtt');
	var mqttclient = mqtt.createClient(1883, config.mqtt.host, function(err, client) {
			keepalive: 1000
	});

	mqttclient.on('connect', function() {
		mqttclient.subscribe('#');
		// console.log('subscribing to everything on ' + config.mqtt.host + '(' + config.mqtt.port + ')');

  		mqttclient.on('message', function(topic, message) {
			// console.log('emitting topic: ' + topic + ' payload: ' + message);
  			socket.emit('data', { topic: topic, value: message });
  		});
  	});
});

io.of('/mqttstats').on('connection', function (socket) {
	// subscribe to MQTT
	var mqtt = require('mqtt');
	var mqttclient = mqtt.createClient(1883, config.mqtt.host, function(err, client) {
			keepalive: 1000
	});

	mqttclient.on('connect', function() {
		mqttclient.subscribe('$SYS/#');
		// console.log('subscribing to everything on ' + config.mqtt.host + '(' + config.mqtt.port + ')');

  		mqttclient.on('message', function(topic, message) {
			// console.log('emitting topic: ' + topic + ' payload: ' + message);
  			socket.emit('data', { topic: topic, value: message });
  		});
  	});
});
