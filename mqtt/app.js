var app = require('http').createServer(handler);
var io = require('socket.io').listen(app, {
	'log level': 1
});
var fs = require('fs');

app.listen(8500);


// server web pages
function handler (req, res) {
	console.log('Connection from %j', req.connection.remoteAddress);
	fs.readFile(__dirname + '/index.html',
  		function (err, data) {
    		if (err) {
      			res.writeHead(500);
      			return res.end('Error loading index.html');
    		}
    		res.writeHead(200);
    		res.end(data);
  	});
}


// for each client connection, subscribe to mqtt and push updates
io.sockets.on('connection', function (socket) {

	var mqtt = require('mqtt');
	var client = mqtt.createClient(1883, 'localhost', function(err, client) {
  		keepalive: 10000
	});

	client.on('connect', function() {
  		client.subscribe('sensors/power/+');

	  	client.on('message', function(topic, message) {
    			console.log('topic: ' + topic + ' payload: ' + message);
  			socket.emit('data', { topic: topic, value: message });
  		});
	});

});

