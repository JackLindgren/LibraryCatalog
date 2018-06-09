/****************************************************************
*
* validateForm.js
* Jack Lindgren
* 2018
* Functions to validate input/update forms
* Most inputs are controlled through dropdown menus, so those inputs are not validated
* The validation functions primarily check that string input values are present
* Redundant values in most cases are simply ignored
*
****************************************************************/

/*******************************************
* Confirm that book year is present
* Confirm that book year is numeric
* Confirm that book title is present
*******************************************/
function validateBookForm(){
	var year = document.forms["book_form"]["book_year"].value;
	if(isNaN(year)){
		alert("Year must be a number");
		return false;
	}
	if(!year){
		alert("Must enter a year");
		return false;
	}

	var title = document.forms["book_form"]["book_title"].value;
	title = title.trim();
	if(!title){
		alert("Book must have a title");
		return false;
	}
}

/*******************************************
* Confirm that author's last name is present
*******************************************/
function validateAuthorForm(){
	var author = document.forms["author_form"]["last_name"].value;
	author = author.trim();
	if(!author){
		alert("Author must have a last name");
		return false;
	}
}

/*******************************************
* Confirm that username and user email are both present
* Confirm that the email address is not already in use by a different user
* Do this by making an API request to the server
*******************************************/
function validateUserForm(){
	var user_name = document.forms["user_form"]["user_name"].value;
	user_name = user_name.trim();
	var user_email = document.forms["user_form"]["user_email"].value;
	user_email = user_email.trim();
	var user_id = document.forms["user_form"]["user_id"].value;
	if(!user_name){
		alert("User must have a name");
		return false;
	} else if (!user_email){
		alert("User must have an email address");
		return false;
	} else {
		var req = new XMLHttpRequest();

		var request_url = '/getUser?user_email=' + user_email;

		console.log("Request URL: " + request_url);
		req.open('GET', request_url, false);

		req.send(null);

		var response = JSON.parse(req.responseText);
		var response = JSON.parse(req.responseText)[0];

		// if the address is already in the system, and the ID doesn't belong to the user being edited
		// then raise an error
		if(response.id && response.id != user_id){
			alert("Email address already taken");
			return false;
		} else {
			return true;
		}
	}
}

/*******************************************
* Confirm that the language name is present
*******************************************/
function validateLanguageForm(){
	var language = document.forms["language_form"]["language_name"].value;
	language = language.trim();
	if(!language){
		alert("Language must have a name");
		return false;
	}
}

/*******************************************
* Confirm that the country name is present
*******************************************/
function validateCountryForm(){
	var country = document.forms["country_form"]["country_name"].value;
	country = country.trim();
	if(!country){
		alert("Country must have a name");
		return false;
	}
}

/*******************************************
* Confirm that the category name is present
*******************************************/
function validateCategoryForm(){
	var category = document.forms["category_form"]["category_name"].value;
	category = category.trim();
	if(!category){
		alert("Category must have a name");
		return false;
	}
}

/*******************************************
* Confirm that the subcategory name is present
*******************************************/
function validateSubCategoryForm(){
	var subcategory = document.forms["subcategory_form"]["subcategory_name"].value;
	subcategory = subcategory.trim();
	if(!subcategory){
		alert("Subcategory must have a name");
		return false;
	}
}

/*******************************************
* Confirm that the format name is present
*******************************************/
function validateFormatForm(){
	var format = document.forms["format_form"]["format_name"].value;
	format = format.trim();
	if(!format){
		alert("Format must have a name");
		return false;
	}
}