/*******************************************
* selectionSetBook.js
* Jack Lindgren, 2018
* Sets appropriate values to selected in the forms
* This is used when editing a Book
* makes sure that the form is pre-populated with appropriate values
*******************************************/

document.addEventListener("DOMContentLoaded", adjustSelections);

function adjustSelections(){

	// get the values
	var language_id = document.getElementById("language_id").value;
	var author_id = document.getElementById("author_id").value;
	var category_id = document.getElementById("category_id").value;

	// set the matching form values to selected
	var current_language = document.getElementById("language_" + language_id);
	current_language.selected = "true";

	var current_author = document.getElementById("author_" + author_id);
	current_author.selected = "true";

	var current_category = document.getElementById("category_" + category_id);
	current_category.selected = "true";

}