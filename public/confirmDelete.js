/*******************************************
* confirmDelete.js
* Jack Lindgren, 2018
* Raises an alert to confirm that a given value should be deleted
* before allowing the deletion request to proceed
*******************************************/

function confirmDeletion(entity_type){
	if(confirm("Are you sure you want to delete this " + entity_type + "?")){
		return true;
	} else {
		return false;
	}
}