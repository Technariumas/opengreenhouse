function fillChartData(chartId, data)
{
	var chartElement = document.getElementById(chartId);
	if(chartElement == undefined)
		return;

	obj = JSON.parse(data);

	var time = obj.value.time;
	var value = obj.value.value;

	var data = [];	
	var txtData = '[';
	for(i = 0; i < time.length; i++){
		text = '{"time": "' + time[i] + '",\n"value": ' + value[i] + '}';
		txtData += text;
		if(i < time.length-1) 
			txtData += ',';
	}

	txtData += ']';
//	chartElement.innerHTML = txtData;
	data = JSON.parse(txtData);
	
	MG.data_graphic({
        title: chartId,
        description: "",
        data: data,
        width: 400,
        height: 200,
        right: 40,
        target: chartElement,
	    x_accessor: 'time',
        y_accessor: 'value'
    });
}

function setWidgetValue(widgetId, value)
{
	var widget = document.getElementById(widgetId);
	if(widget == undefined)
		return;

	for(var index in widget.childNodes)
	{
		var valueField = widget.childNodes[index];
		if(valueField == undefined)
			continue;
		if(valueField.className == "sensorValue")
		{
			valueField.innerHTML = value;
		}
	}	
}

function createChart(chartId)
{
	var chartElement = document.createElement('div');
	chartElement.id = chartId;
	// chartElement.innerHTML = '<img class="chart" src="images/chartPlaceholder.jpeg">';
	return chartElement;
}

function createWidget(widgetId, imageSrc)
{
	var widget = document.createElement('div');
	widget.id = widgetId;
	widget.className = "momentValueWidget";
	var img = document.createElement('img');
	img.src = imageSrc;
	widget.appendChild(img);
	var valueDiv = document.createElement('div');
	valueDiv.className = "sensorValue"
	valueDiv.innerHTML = "??";
	widget.appendChild(valueDiv);
	return widget;
}
