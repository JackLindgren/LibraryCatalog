document.addEventListener("DOMContentLoaded", adjustSelections);

function adjustSelections(){

	var language_id = document.getElementById("language_id").value;

	var current_language = document.getElementById("language_" + language_id);

	current_language.selected = "true";
}