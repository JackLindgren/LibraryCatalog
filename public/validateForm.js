function validateBookForm(){
	var year = document.forms["book_form"]["book_year"].value;
	if(isNaN(year)){
		alert("Year must be a number");
		return false;
	}
}