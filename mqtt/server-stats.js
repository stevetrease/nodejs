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

// var powerlasttime = new Date(); // UNIX time in ms

// get last stored values from Redis
// var execSync = require('execSync');
// var result = execSync.exec('redis-cli get powercumulativeHour');
// var powercumulativeHour = parseFloat(result.stdout);
// var result = execSync.exec('redis-cli get powercumulativeToday');
// var powercumulativeToday = parseFloat(result.stdout);

// var records_hourly = new Array();
// var records_daily = new Array();
// var records_lasttime = new Array();
// var records_hourly = {};
var records_hourly = {};
var records_daily =  {};
var records_lasttime = {};

var execSync = require('execSync');
var result = execSync.exec('redis-cli get records_hourly');
records_hourly = JSON.parse(result.stdout);
console.log("Loading hourly records from redis...");

result = execSync.exec('redis-cli get records_daily');
records_daily = JSON.parse(result.stdout);
console.log("Loading daily records from redis...");


// connect to to MQTT
var mqtt = require('mqtt');
var mqttclient = mqtt.createClient(1883, config.mqtt.host, function(err, client) {
		keepalive: 1000
});
console.log('connecting to mqtt on ' + config.mqtt.host + '(' + config.mqtt.port + ')');


mqttclient.on('connect', function() {
	mqttclient.subscribe('sensors/power/+');
	console.log('subscribing to sensors/power/+ on ' + config.mqtt.host + '(' + config.mqtt.port + ')');

  	mqttclient.on('message', function(topic, message) {
		var powercurrenttime = new Date();

		// have we seen this mesage before? 
		if(records_lasttime[topic] == undefined) {
			console.log("initialising lasttime"  + topic);
			records_lasttime[topic] = new Date();
		}
		if(records_hourly[topic] == undefined) {
			console.log("initialising records_hourly " + topic);
			records_hourly[topic] = 0;
		}
		if(records_daily[topic] == undefined) {
			console.log("initialising records_daily " + topic);
			records_daily[topic] = 0;
		}

		// different hour?
		if (records_lasttime[topic].getHours() != powercurrenttime.getHours()) {
			powercumulativeHour = 0;
		}
		// different day?
		if (records_lasttime[topic].getDate() != powercurrenttime.getDate()) {
			powercumulativeDay = 0;
		}
		// calculate cumulative power used in KWh
		var duration = (powercurrenttime - records_lasttime[topic]) / 1000.0;
		var powerused = parseInt(message, 10) * (duration / 3600.0) / 1000.0; // convert to KWh
		records_lasttime[topic] = powercurrenttime;
		records_hourly[topic] += powerused;
		records_daily[topic] += powerused;
		console.log("topic:", topic, " duration ", duration, " period ", powerused, " hour ", records_hourly[topic], "daily ", records_daily[topic]);

		mqttclient.publish(topic + "/cumulative/hour", records_hourly[topic].toFixed(2));
		mqttclient.publish(topic + "/cumulative/daily", records_daily[topic].toFixed(2));

		redisClient.set("records_hourly", JSON.stringify(records_hourly));
		redisClient.set("records_daily", JSON.stringify(records_daily));
		// console.log( JSON.stringify(records_hourly));
  	});
});
