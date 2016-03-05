function Initialize()
{
	UpdateSensorsList();
	// continuousUpdateWebCam();
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

function continuousUpdate()
{
	var name;
	var timeEnd = Date.now();
	var timeStart = timeEnd-1;
	var timeResolution = 1;
	for(var index in gSensorsList)
	{
		queryData(gSensorsList[index].name, timeStart, timeEnd, timeResolution, 
			function(data){ 

			fillChartData(gSensorsList[index].chartId, data) 
		
			values = JSON.parse(data);
			numbers = values.value.value;
			var lastValue = numbers[numbers.length-1];
			setWidgetValue(gSensorsList[index].name+"Widget", lastValue)
			
			});
	}
	setTimeout(continuousUpdate, 500);
}

function continuousUpdateWebCam()
{
	var frame = document.getElementById("webCamFrame");
	frame.src = "images/videoPlayer.jpeg?"+Date.now();
	setTimeout(continuousUpdateWebCam, 1000);
}