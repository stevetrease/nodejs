// service settings file
// ur
var config = require('./config.json');

var redis = require('redis')
  ,redisClient = redis.createClient();


redisClient.on('connect'     , log('connect'));
redisClient.on('ready'       , log('ready'));
redisClient.on('reconnecting', log('reconnecting'));
redisClient.on('error'       , log('error'));
function log(type) {
    return function() {
        console.log(type, arguments);
    }
}


var powerlasttime = new Date(); // UNIX time in ms

// get last stored values from Redis
var execSync = require('execSync');
var result = execSync.exec('redis-cli get powercumulativeHour');
var powercumulativeHour = parseFloat(result.stdout);
var result = execSync.exec('redis-cli get powercumulativeToday');
var powercumulativeToday = parseFloat(result.stdout);

console.log("loaded powercumulativeHour: " + powercumulativeHour + " (" + typeof powercumulativeHour + ")");
console.log("loaded powercumulativeToday: " + powercumulativeToday + " (" + typeof powercumulativeToday + ")");

// subscribe to MQTT
var mqtt = require('mqtt');
var mqttclient = mqtt.createClient(1883, config.mqtt.host, function(err, client) {
		keepalive: 1000
});
console.log('connecting to mqtt on ' + config.mqtt.host + '(' + config.mqtt.port + ')');


mqttclient.on('connect', function() {
	mqttclient.subscribe('sensors/power/+');
	console.log('subscribing to sensors/power/+ on ' + config.mqtt.host + '(' + config.mqtt.port + ')');

  	mqttclient.on('message', function(topic, message) {
		// console.log('topic: ' + topic + ' payload: ' + message);
 		if (topic == "sensors/power/0") {
			var powercurrenttime = new Date();
			// Is it now a different day from the last time this block ran?
			if (powerlasttime.getDate() != powercurrenttime.getDate()) {
				powercumulativeToday = 0;
			}
			if (powerlasttime.getHours() != powercurrenttime.getHours()) {
				powercumulativeHour = 0;
			}
			// caluclate cumlative power used in KWh
			var duration = (powercurrenttime - powerlasttime) / 1000.0;
			var powerused = parseInt(message, 10) * (duration / 3600.0) / 1000.0; // convert to KWh
			powercumulativeToday += powerused;
			powercumulativeHour += powerused;
			redisClient.set("powercumulativeToday", powercumulativeToday);
			redisClient.set("powercumulativeHour", powercumulativeHour);
			// console.log("duration ", duration, "period ", powerused, "today ", powercumulativeToday, "hour ", powercumulativeHour);
			mqttclient.publish("sensors/power/0/cumulative/today", powercumulativeToday.toFixed(2));
			mqttclient.publish("sensors/power/0/cumulative/hour", powercumulativeHour.toFixed(2));
			powerlasttime = powercurrenttime;
		}
  	});
});
