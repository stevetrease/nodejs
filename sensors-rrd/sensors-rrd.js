var mqtt = require('mqtt');
var mqttclient = mqtt.createClient();
var rrd = require('rrd');



function now() { return Math.ceil((new Date).getTime() / 1000); }


mqttclient.on('connect', function () {
	mqttclient.subscribe('sensors/+/+');
	mqttclient.on('message', function (topic, message) {
		var filename = "data/" + topic.replace(/\//g, "_") + ".rrd";
		var value = message;

		rrd.update(filename, 'datapoint', [[now(), value].join(':')], function (error) { 
    			if (error) {
				rrd.create(filename, 60, now(), ["DS:datapoint:GAUGE:120:0:U", "RRA:LAST:0.5:1:60"], function (error) { 
    					if (error) {
						console.log("rrdcreate error:", error);
					} else {
						console.log("rrdCREATED: " + filename);
					}
				});
			} else {
				console.log("rrdupdated: " + filename + " " + message);
			}
		});
	});
});
