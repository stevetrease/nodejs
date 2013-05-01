var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')




app.listen(1337);

function handler (req, res) {
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


io.sockets.on('connection', function (socket) {
	var redis = require("redis"),
       		red_client = redis.createClient();
	red_client.subscribe('total_power');

  	socket.emit('datapoint', { value: '0' });
	red_client.on("message", function(channel, message) {
       		console.log("client channel recieve from channel : %s, the message : %s", channel, message);
  		socket.emit('datapoint', { value: message });
	});
});



