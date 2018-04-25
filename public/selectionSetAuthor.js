document.addEventListener("DOMContentLoaded", adjustSelections);

function adjustSelections(){

	var country_id = document.getElementById("country_id").value;
	var author_gender = document.getElementById("author_gender").value;

	var current_country = document.getElementById("country_" + country_id);
	var current_gender  = document.getElementById("gender_"  + author_gender);

	current_country.selected = "true";
	current_gender.selected = "true";
}