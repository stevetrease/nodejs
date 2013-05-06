var express = require('express');
var app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, {'log level': 1});
var fs = require('fs');




var scriptStartDate = new Date();


function timeSince(ts){
    now = new Date();
    ts = new Date(ts);
    var delta = now.getTime() - ts.getTime();

    delta = delta/1000; //us to s

    var ps, pm, ph, pd, min, hou, sec, days;

    if(delta<=59){
        ps = (delta>1) ? "s": "";
        return delta+" second"+ps
    }

    if(delta>=60 && delta<=3599){
        min = Math.floor(delta/60);
        sec = delta-(min*60);
        pm = (min>1) ? "s": "";
        ps = (sec>1) ? "s": "";
        return min+" minute"+pm+" "+sec+" second"+ps;
    }

    if(delta>=3600 && delta<=86399){
        hou = Math.floor(delta/3600);
        min = Math.floor((delta-(hou*3600))/60);
        ph = (hou>1) ? "s": "";
        pm = (min>1) ? "s": "";
        return hou+" hour"+ph+" "+min+" minute"+pm;
    } 

    if(delta>=86400){
        days = Math.floor(delta/86400);
        hou =  Math.floor((delta-(days*86400))/60);
        pd = (days>1) ? "s": "";
        ph = (hou>1) ? "s": "";
        return delta+" day"+pd+" "+hou+" hour"+ph;
    }

}


app.get('/hello.txt', function(req, res){
	console.log('connection %j %s %s',  req.connection.remoteAddress, req.method, req.url);
	res.send('Hello World');
});
app.get('/stats', function(req, res){
	console.log('connection %j %s %s',  req.connection.remoteAddress, req.method, req.url);
	res.send(timeSince(scriptStartDate));
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
});


// subscribe to MQTT
var mqtt = require('mqtt');
var client = mqtt.createClient(1883, 'localhost', function(err, client) {
		keepalive: 1000
});
// global variables for tracking cumulative power usage
var powercumulative = 0;
var powerlasttime = new Date(); // UNIX time in ms

client.on('connect', function() {
	client.subscribe('sensors/+/+');

  	client.on('message', function(topic, message) {
		// console.log('topic: ' + topic + ' payload: ' + message);
  		io.sockets.emit('data', { topic: topic, value: message });
 		if (topic == "sensors/power/0") {
			var powercurrenttime = new Date();
			// Is it now a different day from the last time this block ran?
			if (powerlasttime.getDate() != powercurrenttime.getDate()) {
				powerlasttime = 0;
			}
			// caluclate cumlative power used in KWh
			var duration = (powercurrenttime - powerlasttime) / 1000.0;
			var powerused = parseInt(message, 10) * (duration / 3600.0) / 1000.0; // convert to KWh
			powercumulative += powerused;
			// console.log("duration ", duration, "powerused ", powerused, "cumulative ", powercumulative);
  			io.sockets.emit('data', { topic: "powercumulative", value: powercumulative.toFixed(3) });
			powerlasttime = powercurrenttime;
		}
  	});
});


