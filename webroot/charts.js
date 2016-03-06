valueStorage = [];

function appendToChart(chartId, value)
{
	//chartId = 'tempChart';
	var chartElement = document.getElementById(chartId);
	if(chartElement == undefined)
		return;

	var dates = valueStorage[chartId];

	if(value < 0)
		value = 0;

	dates.push({ "time" : new Date(Date.now()), "value" : value});

	valueStorage[chartId] = dates;

	if(valueStorage[chartId].length == 0)
		return;

	MG.data_graphic({
        title: chartId,
        description: "",
        data: valueStorage[chartId],
        width: 400,
        height: 200,
        right: 40,
        target: chartElement,
	    x_accessor: 'time',
        y_accessor: 'value'
    });
}

function fillChartData(chartId, data)
{
	var chartElement = document.getElementById(chartId);
	if(chartElement == undefined)
		return;

	obj = JSON.parse(data);

	if(obj == undefined)
		return;

	var time = obj.value.time;
	var value = obj.value.value;

	var dates = []

	
	for(i = 0; i < time.length; i++){
		dates.push({ "time" : new Date(time[i]*1000), "value" :value[i]});
	}

	valueStorage[chartId] = dates;

	MG.data_graphic({
        title: chartId,
        description: "",
        data: dates,
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
