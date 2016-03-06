function Initialize()
{
	UpdateSensorsList();
	continuousUpdateWebCam();
	initialUpdate();
	continuousUpdate();
}

function queryData(name, start, end, resolution, callback)
{
	var command = "rpc/series/"+name+"/?start="+start+"&end="+end+"&resolution="+resolution;

	var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", g_ServerURL+'/'+command, true);
    xmlHttp.send("");
	xmlHttp.onreadystatechange = function(e) 
	{
		if ( xmlHttp.readyState === 4 ) 
		{		
			if(callback)
				callback(xmlHttp.responseText, xmlHttp.status);
		}		
	}
    return xmlHttp.responseText;
}

function queryDataPoint(name, callback)
{
	var command = "rpc/"+name+"/";

	var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", g_ServerURL+'/'+command, true);
    xmlHttp.send("");
	xmlHttp.onreadystatechange = function(e) 
	{
		if ( xmlHttp.readyState === 4 ) 
		{		
			if(callback)
				callback(xmlHttp.responseText, xmlHttp.status);
		}		
	}
    return xmlHttp.responseText;
}

function runQuery()
{	
	var name;
	var timeStart = 0;
	var timeEnd = 0;
	var timeResolution = 0;
	var inputField = document.getElementById("sensorName");
	if(inputField != undefined)
		name = inputField.value;
	inputField = document.getElementById("timeStart");
	if(inputField != undefined)
		timeStart = inputField.value;
	inputField = document.getElementById("timeEnd");
	if(inputField != undefined)
		timeEnd = inputField.value;
	inputField = document.getElementById("timeResolution");
	if(inputField != undefined)
		timeResolution = inputField.value;

	var sensorCombobox = document.getElementById("sensorName");
	if(sensorCombobox == undefined)
	{
		alert("sensors combobox not found");
		return;
	}
	name = sensorCombobox.value;
	for(var index in gSensorsList)
	{
		if( gSensorsList[index].name == name)
		{
			queryData(gSensorsList[index].name, timeStart, timeEnd, timeResolution, 
				function(data){ fillChartData(gSensorsList[index].chartId, data) 
			
				values = JSON.parse(data);
				numbers = values.value.value;
				var lastValue = numbers[numbers.length-1];
				setWidgetValue(gSensorsList[index].name+"Widget", lastValue)
				
				});			
			break;
		}
	}
}

//sensors name, description, chartId
var gSensorsList = []

function UpdateSensorsList()
{
	var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", g_ServerURL+'/rpc/sensor_list', true);
    xmlHttp.send(" ");	
	// xmlHttp.onreadystatechange = function(e) 
	// {
	// 	if ( xmlHttp.readyState === 4 ) 
	// 	{		
			var sensorCombobox = document.getElementById("sensorName");
			if(sensorCombobox == undefined)
				return;

			var plotsContainer = document.getElementById("Content");
			if(plotsContainer == undefined)
				return;

			var widgetsContainer = document.getElementById("widgetsContainer");
			if(widgetsContainer == undefined)
				return;

			for(var sensor in gSensorsList)
			{
				var element = document.getElementById(gSensorsList[sensor].chartId);
				plotsContainer.removeChild(element);
			}
			
			sensorCombobox.innerHTML = ""; //delete all sensor options
			gSensorsList.length = 0;

			var temp = '{"ok": true,"value": [{"temp": "Temperature"},{"humidity":"Humidity"},{"wind":"Wind speed"},{"light":"Lighting"}]}';
			xmlHttp.responseText = temp;


			// if(xmlHttp.responseText.length == 0)
			// {
			// 	return;
			// }

			var obj = JSON.parse(temp);
			if(obj.ok != true)
			{
				alert("Get sensors list failed");
				return;
			}
			for(var itemKey in obj.value)
			{
				var item = obj.value[itemKey];
				for(var key in item)
				{
					var sensorStruct = new Object();
					sensorStruct.name = key;
					sensorStruct.description = item[key];
					sensorStruct.chartId = key+"Chart";
					gSensorsList.push(sensorStruct);
					var option = document.createElement("option");
					option.text = item[key];
					option.value = key;
					sensorCombobox.add(option);
					var chartElement = createChart(sensorStruct.chartId);
					plotsContainer.appendChild(chartElement);

					var widget;
					if(sensorStruct.name == "temp")
						widget = createWidget(sensorStruct.name+"Widget", "images/temperatureIcon.png");
					if(sensorStruct.name == "humidity")
						widget = createWidget(sensorStruct.name+"Widget", "images/humidityIcon.png");
					if(sensorStruct.name == "wind")
						widget = createWidget(sensorStruct.name+"Widget", "images/windIcon.png");
					if(sensorStruct.name == "light")
						widget = createWidget(sensorStruct.name+"Widget", "images/lightIcon.png");
					
					widgetsContainer.appendChild(widget);
				}
			}
	// 	}		
	// }
    return xmlHttp.responseText;
}

function initialUpdate()
{
	var name;
	var timeEnd = Date.now()/1000;
	//var timeEnd = 1457252192;
	var timeStart = timeEnd-10;
	var timeResolution = 1;

	queryData(gSensorsList[0].name, timeStart, timeEnd, timeResolution, 
		function(data){ 

		fillChartData(gSensorsList[0].chartId, data) 
	
		values = JSON.parse(data);
		numbers = values.value.value;
		var lastValue = numbers[numbers.length-1]/10;
		setWidgetValue(gSensorsList[0].name+"Widget", lastValue)
		
		});

	queryData(gSensorsList[1].name, timeStart, timeEnd, timeResolution, 
		function(data){ 

		fillChartData(gSensorsList[1].chartId, data) 
	
		values = JSON.parse(data);
		numbers = values.value.value;
		var lastValue = 800-numbers[numbers.length-1];
		setWidgetValue(gSensorsList[1].name+"Widget", lastValue)
		
		});

	queryData(gSensorsList[2].name, timeStart, timeEnd, timeResolution, 
		function(data){ 

		fillChartData(gSensorsList[2].chartId, data) 
	
		values = JSON.parse(data);
		numbers = values.value.value;
		var lastValue = numbers[numbers.length-1];
		setWidgetValue(gSensorsList[2].name+"Widget", lastValue)
		
		});
	queryData(gSensorsList[3].name, timeStart, timeEnd, timeResolution, 
		function(data){ 

		fillChartData(gSensorsList[3].chartId, data) 
	
		values = JSON.parse(data);
		numbers = values.value.value;
		var lastValue = numbers[numbers.length-1];
		setWidgetValue(gSensorsList[3].name+"Widget", lastValue)
		
		});
}

function continuousUpdate()
{
	var name;
	var timeEnd = Date.now()/1000;
	var timeStart = timeEnd-3600;
	var timeResolution = 1;

	queryDataPoint(gSensorsList[0].name,
		function(data){ 

		var results = JSON.parse(data);
		var value = results["value"]/10;
		id = gSensorsList[0].chartId;

		appendToChart(id, value);
		setWidgetValue(gSensorsList[0].name+"Widget", value)
		
		});

	queryDataPoint(gSensorsList[1].name,
		function(data){ 

		var results = JSON.parse(data);
		var value = 800-results.value;

		id = gSensorsList[1].chartId;

		appendToChart(id, value);
		setWidgetValue(gSensorsList[1].name+"Widget", value)
		
		});

	queryDataPoint(gSensorsList[2].name,
		function(data){ 

		var results = JSON.parse(data);
		var value = results.value;

		id = gSensorsList[2].chartId;

		appendToChart(id, value);
		setWidgetValue(gSensorsList[2].name+"Widget", value)
		
		});
	queryDataPoint(gSensorsList[3].name, 
		function(data){ 

		var results = JSON.parse(data);
		var value = results.value;

		id = gSensorsList[2].chartId;

		appendToChart(id, value);
		setWidgetValue(gSensorsList[2].name+"Widget", value)
		
		});

	getWindow();
	getWater();
	getDoor();

	setTimeout(continuousUpdate, 1000);
}

function continuousUpdateWebCam()
{
	var frame = document.getElementById("webCamFrame");
	frame.src = "camera/snap.jpg?"+Date.now();
	setTimeout(continuousUpdateWebCam, 2000);
}

function setWindow()
{
	var ctr = document.getElementById("windowSlider");
	if(ctr == undefined)
		return;

	var command = "rpc/window/?value="+ctr.value;
	xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "PUT", g_ServerURL+'/'+command, true);
    xmlHttp.send("");
	/*xmlHttp.onreadystatechange = function(e) 
	{
		if ( xmlHttp.readyState === 4 ) 
		{		
			if(callback)
				callback(xmlHttp.responseText, xmlHttp.status);
		}		
	}*/
    return xmlHttp.responseText;
}

function getWindow()
{
	var command = "rpc/window/";
	xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", g_ServerURL+'/'+command, true);
    xmlHttp.send("");
	xmlHttp.onreadystatechange = function(e) 
	{
		if ( xmlHttp.readyState === 4 ) 
		{		
			var ctr = document.getElementById("windowSlider");
			if(ctr == undefined)
				return;

			var windowVal = xmlHttp.responseText["value"];
			if(windowVal == undefined)
				return;

			ctr.value = windowVal;			
		}		
	}
    return xmlHttp.responseText;
}

function setWater()
{
	var ctr = document.getElementById("waterSlider");
	if(ctr == undefined)
		return;

	var command = "rpc/pump/?value="+ctr.value;
	xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", g_ServerURL+'/'+command, true);
    xmlHttp.send("");
	/*xmlHttp.onreadystatechange = function(e) 
	{
		if ( xmlHttp.readyState === 4 ) 
		{		
			if(callback)
				callback(xmlHttp.responseText, xmlHttp.status);
		}		
	}*/
    return xmlHttp.responseText;
}

function getWater()
{
	var command = "rpc/pump/";
	xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", g_ServerURL+'/'+command, true);
    xmlHttp.send("");
	xmlHttp.onreadystatechange = function(e) 
	{
		if ( xmlHttp.readyState === 4 ) 
		{		
			var ctr = document.getElementById("waterSlider");
			if(ctr == undefined)
				return;

			var windowVal = xmlHttp.responseText["value"];
			if(windowVal == undefined)
				return;

			ctr.value = windowVal;			
		}		
	}
    return xmlHttp.responseText;
}

function setDoor()
{
	var ctr = document.getElementById("doorSlider");
	if(ctr == undefined)
		return;

	var command = "rpc/door/?value="+ctr.value;
	xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "PUT", g_ServerURL+'/'+command, true);
    xmlHttp.send("");
	/*xmlHttp.onreadystatechange = function(e) 
	{
		if ( xmlHttp.readyState === 4 ) 
		{		
			if(callback)
				callback(xmlHttp.responseText, xmlHttp.status);
		}		
	}*/
    return xmlHttp.responseText;
}

function getDoor()
{
	var command = "rpc/door/";
	xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "PUT", g_ServerURL+'/'+command, true);
    xmlHttp.send("");
	xmlHttp.onreadystatechange = function(e) 
	{
		if ( xmlHttp.readyState === 4 ) 
		{		
			var ctr = document.getElementById("doorSlider");
			if(ctr == undefined)
				return;

			var windowVal = xmlHttp.responseText["value"];
			if(windowVal == undefined)
				return;

			ctr.value = windowVal;			
		}		
	}
    return xmlHttp.responseText;
}