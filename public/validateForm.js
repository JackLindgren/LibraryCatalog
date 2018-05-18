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

function validateAuthorForm(){
	var author = document.forms["author_form"]["last_name"].value;
	author = author.trim();
	if(!author){
		alert("Author must have a last name");
		return false;
	}
}

function validateUserForm(){
	var user_name = document.forms["user_form"]["user_name"].value;
	user_name = user_name.trim();
	var user_email = document.forms["user_form"]["user_email"].value;
	user_email = user_email.trim();
	if(!user_name){
		alert("User must have a name");
		return false;
	}
	if(!user_email){
		alert("User must have an email address");
		return false;
	}
}

function validateLanguageForm(){
	var language = document.forms["language_form"]["language_name"].value;
	language = language.trim();
	if(!language){
		alert("Language must have a name");
		return false;
	}
}

function validateCountryForm(){
	var country = document.forms["country_form"]["country_name"].value;
	country = country.trim();
	if(!country){
		alert("Country must have a name");
		return false;
	}
}

function validateCategoryForm(){
	var category = document.forms["category_form"]["category_name"].value;
	category = category.trim();
	if(!category){
		alert("Category must have a name");
		return false;
	}
}

function validateSubCategoryForm(){
	var subcategory = document.forms["subcategory_form"]["subcategory_name"].value;
	subcategory = subcategory.trim();
	if(!subcategory){
		alert("Subcategory must have a name");
		return false;
	}
}

function validateFormatForm(){
	var format = document.forms["format_form"]["format_name"].value;
	format = format.trim();
	if(!format){
		alert("Format must have a name");
		return false;
	}
}