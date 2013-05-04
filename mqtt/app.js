var app = require('http').createServer(handler);
var io = require('socket.io').listen(app, {
	'log level': 1
});
var fs = require('fs');
	
app.listen(8500);
console.log('listening on port 8500');

// server web pages
function handler (req, res) {
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
}


// for each client connection, subscribe to mqtt and push updates
io.sockets.on('connection', function (socket) {
	var mqtt = require('mqtt');
	var client = mqtt.createClient(1883, 'localhost', function(err, client) {
  		keepalive: 1000
	});
	// set of per client local variables
	var powercumulative = 0;
	var powerlasttime = new Date().getTime(); // UNIX time in ms

	client.on('connect', function() {
  		client.subscribe('sensors/+/+');

	  	client.on('message', function(topic, message) {
    			// console.log('topic: ' + topic + ' payload: ' + message);
  			socket.emit('data', { topic: topic, value: message });
	 		if (topic == "sensors/power/0") {
				var powercurrenttime = new Date().getTime();
				var duration = (powercurrenttime - powerlasttime) / 1000.0;
				var powerused = parseInt(message, 10) * (duration / 3600.0);
				powercumulative += powerused;
				// console.log("duration ", duration, "powerused ", powerused, "cumulative ", powercumulative);
  				socket.emit('data', { topic: "powercumulative", value: powercumulative.toFixed(3) });
				powerlasttime = powercurrenttime;
			}
  		});
	});
});


