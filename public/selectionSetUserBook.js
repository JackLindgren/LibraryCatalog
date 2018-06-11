/*******************************************
* selectionSetUserBook.js
* Jack Lindgren, 2018
* Sets appropriate values to selected in the forms
* This is used when editing an Author
* makes sure that the form is pre-populated with appropriate values
*******************************************/

document.addEventListener("DOMContentLoaded", adjustSelections);

function adjustSelections(){
	console.log("adjusting selections");

	// get the prefill values
	var format_id = document.getElementById("given_format_id").value;
	var rating = document.getElementById("given_rating").value;

	// set the correct form elements to "selected"
	var current_format = document.getElementById("format_" + format_id);
	current_format.selected = "true";

	var current_rating = document.getElementById("rating_" + rating);
	current_rating.selected = "true";

}