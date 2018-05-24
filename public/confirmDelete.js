function confirmDeletion(entity_type){
	if(confirm("Are you sure you want to delete this " + entity_type + "?")){
		return true;
	} else {
		return false;
	}
}