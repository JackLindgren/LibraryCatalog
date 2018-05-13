document.addEventListener("DOMContentLoaded", adjustSelections);

function adjustSelections(){

	var language_id = document.getElementById("language_id").value;
	console.log("Language: " + language_id);
	var current_language = document.getElementById("language_" + language_id);
	current_language.selected = "true";

	var author_id = document.getElementById("author_id").value;
	console.log("Author: " + author_id);
	var current_author = document.getElementById("author_" + author_id);
	current_author.selected = "true";

	var category_id = document.getElementById("category_id").value;
	console.log("Category: " + category_id);
	var current_category = document.getElementById("category_" + category_id);
	current_category.selected = "true";

}