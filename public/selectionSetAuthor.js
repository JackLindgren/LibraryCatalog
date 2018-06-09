/*******************************************
* selectionSetAuthor.js
* Jack Lindgren, 2018
* Sets appropriate values to selected in the forms
* This is used when editing an Author
* makes sure that the form is pre-populated with appropriate values
*******************************************/

document.addEventListener("DOMContentLoaded", adjustSelections);

function adjustSelections(){

	// get the author values
	var country_id = document.getElementById("country_id").value;
	var author_gender = document.getElementById("author_gender").value;

	// locate the appropriate form values
	var current_country = document.getElementById("country_" + country_id);
	var current_gender  = document.getElementById("gender_"  + author_gender);

	// set to selected
	current_country.selected = "true";
	current_gender.selected = "true";
}