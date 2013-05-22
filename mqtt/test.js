var records_hourly = new Array();

records_hourly['first'] = 1;
console.log(records_hourly['first']);
console.log(records_hourly['second']);


if(records_hourly['three'] == undefined) {
	console.log("three undefined");
} else { 
	console.log("three defined");
}
records_hourly['three'] = 1;
if(records_hourly['three'] == undefined) {
	console.log("three undefined");
} else { 
	console.log("three defined");
}
