var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')


app.listen(1337);


function handler (req, res) {
	console.log('Connection from %j', req.connection.remoteAddress);
	fs.readFile(__dirname + '/client/index.html',
  		function (err, data) {
    		if (err) {
      			res.writeHead(500);
      			return res.end('Error loading index.html');
    		}
    		res.writeHead(200);
    		res.end(data);
  	});
}


io.sockets.on('connection', function (socket) {
	var redis = require("redis"),
       		red_client = redis.createClient();
	red_client.psubscribe('currentcost.*');

	red_client.on("pmessage", function(pattern, channel, message) {
       		// console.log("client channel recieve from channel : %s, the message : %s", channel, message);
  		socket.emit('data', { channel: channel, value: Number(message) });
	});
});



