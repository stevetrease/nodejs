const pubSubChannelName = "total_power";

var http = require('http'),
	url = require('url'),
	fs = require('fs');
var io = require('socket.io');
var os = require('os');
var redis = require("redis"),
        red_client = redis.createClient();


red_client.subscribe(pubSubChannelName);

server = http.createServer(function (req, res) {
  	var path = url.parse(req.url).pathname;
	console.log('Connection from %j', req.connection.remoteAddress);
	console.log('%j', path);
	switch (path) {
		case '/index.html':
  			fs.readFile(__dirname + '/index.html',
  				function (err, data) {
    				if (err) {
      					res.writeHead(500);
      					return res.end('Error loading index.html');
    				}
    				res.writeHead(200);
    				res.end(data);
  			});	
			break
		case '/':
			break;
		case '/diag':
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write(req.connection.remoteAddress, encoding='utf8');
			res.end('\n', encoding='utf8');
			break;
	}

});
server.listen(1337);

var socket = io.listen(server);

red_client.on("message", function(channel, message) {
	console.log("client channel recieve from channel : %s, the message : %s", channel,   message);
	socket.emit('data', { message: 'message' });
});

// Startup messages
console.log(os.hostname() + ' ' + os.type() + ' ' + os.release());
console.log(process.arch + ' ' + process.platform);
console.log('Server running.');
