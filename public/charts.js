google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawCharts);

// create a copy without US
var without_usa = [];
for(var country in countries){
	if(countries[country][0] != "United States"){
		without_usa.push(countries[country]);
	}			
}

// create a copy without English
var without_english = [];
for(var language in languages){
	if(languages[language][0] != "English"){
		without_english.push(languages[language]);
	}
}

function drawCharts() {
	drawLanguageChart(false);
	drawCountryChart(false);
	drawDecadesChart();
}

function drawDecadesChart(){
	var decade_data = google.visualization.arrayToDataTable(decades);
	var decade_chart = new google.visualization.PieChart(document.getElementById('decade_chart'));
	decade_chart.draw(decade_data);
}

function drawCountryChart(hide_usa){
	if(hide_usa){
		var country_data = google.visualization.arrayToDataTable(without_usa);
	} else {
		var country_data = google.visualization.arrayToDataTable(countries);
	}

	var country_chart = new google.visualization.PieChart(document.getElementById('country_chart'));
	country_chart.draw(country_data);
}


function drawLanguageChart(hide_english){
	if(hide_english){
		var lang_data = google.visualization.arrayToDataTable(without_english);
	} else {
		var lang_data = google.visualization.arrayToDataTable(languages);
	}

	var lang_chart = new google.visualization.PieChart(document.getElementById('language_chart'));
	lang_chart.draw(lang_data);
}