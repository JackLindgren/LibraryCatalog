/*************************************************
* general app setup
*************************************************/
var express = require('express');
var handlebars = require('express-handlebars');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);
app.use(express.static('public'));

/*************************************************
* Handle POST requests
*************************************************/
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*************************************************
* mySQL setup
*************************************************/
var mysql = require('./dbcon.js');

/*************************************************
* request handlers
*************************************************/
app.get('/', function(req, res, next){
	res.render('home');
});

/*************************************************
* Routes for index pages
*************************************************/
app.get('/showIndex', function(req, res, next){
	res.render('showIndex');
});

app.get('/insertDeleteIndex', function(req, res, next){
	res.render('insertDeleteIndex');
});

app.get('/updateIndex', function(req, res, next){
	res.render('updateIndex');
});

/*************************************************
* Selection functions
* Most select queries will be handled with one of these functions
* (Some will be handled in the route, though)
*************************************************/
function getBooks(book_id, search_params, res, mysql, context, complete){
	var book_query = "SELECT \
		Book.id AS book_id, \
		Book.title, \
		Book.year, \
		Book.is_anthology, \
		Book.category_id, \
		Category.name AS categoryName, \
		SubCategory.name AS subCategoryName, \
		Language.id AS lang_id, \
		Language.language, \
		Author.id AS auth_id, \
		Author.firstName, \
		Author.lastName, \
		Author.gender, \
		Country.id AS country_id, \
		Country.country \
		FROM Book \
		LEFT JOIN SubCategory ON Book.category_id = SubCategory.id \
		LEFT JOIN Category ON SubCategory.category_id = Category.id \
		INNER JOIN Author ON Book.author_id = Author.id \
		LEFT JOIN Country ON Author.country_id = Country.id \
		INNER JOIN Language ON Book.language_id = Language.id \
		WHERE Book.id "

	var query_args = [];

	// filter/search by various parameters
	if(search_params){
		console.log(search_params);

		if(search_params.author_id){
			book_query += " AND Book.author_id = ?";
			query_args.push(search_params.author_id);
		}
		if(search_params.language_id){
			book_query += " AND Book.language_id = ?";
			query_args.push(search_params.language_id);
		}
		if(search_params.country_id){
			book_query += " AND Author.country_id = ?";
			query_args.push(search_params.country_id);
		}
		if(search_params.gender){
			book_query += " AND Author.gender = ?";
			query_args.push(search_params.gender);
		}
		if(search_params.category_id){
			book_query += " AND Book.category_id = ?";
			query_args.push(search_params.category_id);
		}
		if(search_params.user_id){
			book_query += " AND Book.id IN (SELECT book_id FROM BookUser WHERE user_id = ?)";
			query_args.push(search_params.user_id);
		}
		if(search_params.author){
			book_query += " AND (Author.firstName LIKE ? OR Author.lastName LIKE ? ) ";
			query_args.push('%' + search_params.author + '%');
			query_args.push('%' + search_params.author + '%');
		}
		if(search_params.title){
			book_query += " AND Book.title LIKE ? ";
			query_args.push('%' + search_params.title + '%');
		}
		if(search_params.subject){
			book_query += " AND SubCategory.name LIKE ? ";
			query_args.push('%' + search_params.subject + '%');
		}
	}

	// fetch a specific book
	if(book_id){
		book_query += " AND Book.id = ?";
		query_args.push(book_id);
	}

	book_query += " ORDER BY Author.lastName, Book.title";

	mysql.pool.query(book_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}
		if(book_id){
			context.book_info = results[0];
		} else {
			context.books = results;
		}
		complete()
	});
}

function getUsers(user_id, res, mysql, context, complete){
	var users_query = "SELECT id, user_name, user_email FROM User";
	var query_args = [];
	if(user_id){
		users_query += " WHERE id = ? LIMIT 1";
		query_args.push(user_id);
	}
	mysql.pool.query(users_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}

		if(user_id){
			context.user_info = results[0];
		} else {
			context.users = results;
		}

		complete();
	});
}

function getUserBooks(user_id, book_id, format_id, res, mysql, context, complete){
	var book_query = "SELECT b.title, b.year, l.language, a.firstName, a.lastName, c.country, \
		b.id AS book_id, l.id AS lang_id, a.id AS auth_id, c.id AS country_id, a.gender, b.category_id, \
		sc.name AS category_name, \
		bu.user_id, u.user_name, bu.rating, bu.date_added, bu.date_read, bu.format_id, \
		f.format \
		FROM Book AS b \
		LEFT JOIN Author AS a ON b.author_id = a.id \
		LEFT JOIN Country AS c ON a.country_id = c.id \
		LEFT JOIN Language AS l ON b.language_id = l.id \
		LEFT JOIN SubCategory AS sc ON b.category_id = sc.id \
		LEFT JOIN BookUser AS bu ON b.id = bu.book_id \
		LEFT JOIN User AS u ON bu.user_id = u.id \
		LEFT JOIN Format AS f ON bu.format_id = f.id \
		WHERE bu.user_id = ? ";

	var query_args = [user_id];

	if(book_id && format_id){
		book_query += " AND bu.book_id = ? ";
		query_args.push(book_id);
	
		book_query += " AND bu.format_id = ? ";
		query_args.push(format_id);
	}

	mysql.pool.query(book_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}
		if(user_id && format_id){
			context.book_info = results[0];
		} else {
			context.books = results;
		}
		complete()
	});
}

function getAuthors(author_id, res, mysql, context, complete){

	var author_query = "SELECT a.id, a.firstName, a.lastName, a.dob, a.gender, Country.country, Country.id AS country_id \
		FROM Author AS a \
		LEFT JOIN Country ON a.country_id = Country.id ";
	
	var query_args = [];
	if(author_id){
		author_query += " WHERE a.id = ? ";
		query_args.push(author_id);
	}
	author_query += " ORDER BY a.lastName";

	mysql.pool.query(author_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}
		if(author_id){
			context.author_info = results[0];
		} else {
			context.authors = results;
		}
		complete();
	});
}

function getSecondaryAuthors(book_id, res, mysql, context, complete){
	var authors_query = "SELECT Author.firstName, Author.lastName \
		FROM BookAuthor \
		INNER JOIN Author ON BookAuthor.author_id = Author.id \
		WHERE BookAuthor.book_id = ?";

	mysql.pool.query(authors_query, [book_id], function(error, results, fields){
		if(error){
			res.send("Error");
		}
		context.addl_authors = results;
		complete();
	})
}

function getNonSelectedAuthors(book_id, res, mysql, context, complete){
	var authors_query = "SELECT id, firstName, lastName FROM Author WHERE id NOT IN (SELECT author_id FROM BookAuthor WHERE book_id = ?) ORDER BY lastName, firstName"
	mysql.pool.query(authors_query, [book_id], function(error, results, fields){
		if(error){
			res.send("Error");
		}
		context.non_selected_authors = results;
		complete();
	});
}

function getSelectedAuthors(book_id, res, mysql, context, complete){
	var authors_query = "SELECT id, firstName, lastName FROM Author WHERE id IN (SELECT author_id FROM BookAuthor WHERE book_id = ?) ORDER BY lastName, firstName"
	mysql.pool.query(authors_query, [book_id], function(error, results, fields){
		if(error){
			res.send("Error");
		}
		context.selected_authors = results;
		complete();
	});
}

function getCountries(country_id, res, mysql, context, complete){
	var country_query = "SELECT id, country, region FROM Country";
	var query_args = [];
	if(country_id){
		country_query += " WHERE id = ? LIMIT 1";
		query_args.push(country_id);
	}

	country_query += " ORDER BY country";

	mysql.pool.query(country_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}
		if(country_id){
			context.country_info = results[0];
		} else {
			context.countries = results;
		}
		complete();
	});	
}

function getLanguages(language_id, res, mysql, context, complete){

	var language_query = "SELECT id, language, language_family FROM Language ";
	
	var query_args = [];
	
	if(language_id){
		language_query += " WHERE id = ? ";
		query_args.push(language_id);
	}

	language_query += " ORDER BY language";

	mysql.pool.query(language_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}
		if(language_id){
			context.language_info = results[0];
		} else {
			context.languages = results;
		}

		complete();
	});
}

function getFormats(format_id, res, mysql, context, complete){
	var format_query = "SELECT id, format FROM Format ";
	var query_args = [];
	if(format_id){
		format_query += " WHERE id = ? ";
		query_args.push(format_id);
	}
	format_query += " ORDER BY format";

	mysql.pool.query(format_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}
		if(format_id){
			context.format_info = results[0];
		} else {
			context.formats = results;
		}
		complete();
	});
}

function getCategories(category_id, res, mysql, context, complete){
	var category_query = "SELECT id, name FROM Category ";
	var query_args = [];
	if(category_id){
		category_query += " WHERE id = ? ";
		query_args.push(category_id);
	}
	category_query += " ORDER BY name";
	mysql.pool.query(category_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}
		if(category_id){
			context.category_info = results[0];
		} else {
			context.categories = results;
		}
		complete();
	});
}

function getSubCategories(subcategory_id, res, mysql, context, complete){
	var subcategory_query = "SELECT SubCategory.id AS subcategory_id, \
		SubCategory.name AS subcategory, \
		Category.id AS category_id, \
		Category.name AS category \
		FROM SubCategory \
		INNER JOIN Category ON SubCategory.category_id = Category.id ";
	var query_args = [];
	if(subcategory_id){
		subcategory_query += " WHERE SubCategory.id = ? ";
		query_args.push(subcategory_id);
	}
	subcategory_query += " ORDER BY category, subcategory ";

	mysql.pool.query(subcategory_query, query_args, function(error, results, fields){
		if(error){
			res.send("Error");
		}
		if(subcategory_id){
			context.subcategory_info = results[0];
		} else {
			context.subcategories = results;
		}
		complete();
	});
}


/*************************************************
* List functions:
* books
* authors
*************************************************/
// list the current books in the database
app.get('/listBooks', function(req, res, next){
	var context = {};
	var callbackCount = 0;

	console.log("********************");
	console.log(req.query);

	var book_id = null;
	if(req.query.book_id){
		book_id = req.query.book_id;
	}

	getBooks(book_id, req.query, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 1){
			res.render('bookList', context);
		}
	}
});

// render form to create or edit a book
app.get('/editBook', function(req, res, next){
	var book_id = req.query.book_id;
	
	var context = {};

	var callbackCount = 0;

	getBooks(book_id, null, res, mysql, context, complete);
	getLanguages(null, res, mysql, context, complete);
	getSubCategories(null, res, mysql, context, complete);
	getSelectedAuthors(book_id, res, mysql, context, complete);
	getNonSelectedAuthors(book_id, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 5){
			res.render('editBook', context);
		}
	}
});

// list a user's books
app.get('/listUserBooks', function(req, res, next){
	var context = {};
	
	console.log("Request received for table data");
	
	var user_id = req.query.user_id;

	var callbackCount = 0;

	getUserBooks(user_id, null, null, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 1){
			res.render('userBooks', context);
		}
	}
});

// form to edit a specific book instance in a user's shelf
// meaning that we could edit the book's rating or it's date read
app.get('/editUserBook', function(req, res, next){
	console.log("In edit User Book");
	
	var user_id = req.query.user_id;
	var book_id = req.query.book_id;
	var format_id = req.query.format_id;
	
	var context = {};
	var callbackCount = 0;

	getUserBooks(user_id, book_id, format_id, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 1){
			res.render('editUserBook', context);
		}
	}
});

app.post('/editUserBook', function(req, res, next){
	
	var user_id = req.body.user_id;
	var book_id = req.body.book_id;
	var format_id = req.body.format_id;
	var rating = req.body.rating;
	var date_read = req.body.date_read;

	if(!rating){
		rating = null;
	}
	if(!date_read){
		date_read = null;
	}

	mysql.pool.query("UPDATE IGNORE BookUser SET rating = ?, date_read = ? WHERE book_id = ? AND user_id = ? AND format_id = ?",
		[rating, date_read, book_id, user_id, format_id],
		function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('/listUserBooks?user_id=' + user_id);
		}
	})
});

// render form to manage user-book relationship
app.get('/bookUser', function(req, res, next){
	var context = {};

	var callbackCount = 0;
	
	getBooks(null, null, res, mysql, context, complete);
	getUsers(null, res, mysql, context, complete);
	getFormats(null, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 3){
			res.render('bookUser', context);
		}
	}
});

// Render a list of authors
app.get('/listAuthors', function(req, res, render){
	var context = {};
	var callbackCount = 0;
	getAuthors(null, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 1){
			res.render('authorList', context);
		}
	}
});

// render form to create or edit an author
app.get('/editAuthor', function(req, res, next){
	
	var author_id = req.query.author_id;

	var context = {};

	var callbackCount = 0;

	getCountries(null, res, mysql, context, complete);
	getAuthors(author_id, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 2){
			res.render('editAuthor', context);
		}
	}
});

// render a list of users
app.get('/listUsers', function(req, res, render){
	console.log("request received for user data");

	var context = {};
	var callbackCount = 0;

	getUsers(null, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 1){
			res.render('userList', context);
		}
	}
});

// render the form to create or edit a user
app.get('/editUser', function(req, res, next){
	var user_id = req.query.user_id;
	
	var context = {};
	var callbackCount = 0;

	getUsers(user_id, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 1){
			res.render('editUser', context);
		}
	}
});

// API request to confirm that a user's email address is not already taken
app.get('/getUser', function(req, res, next){
	var user_email = req.query.user_email;
	mysql.pool.query("SELECT id, user_email FROM User WHERE user_email = ?", user_email, function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.set('Content-Type', 'application/json');
			res.status(200);
			res.send(rows);
		}
	});
});

// list countries and render the country creation/edit form
app.get('/countries', function(req, res, render){
	var context = {};
	var callbackCount = 0;
	var country_id = req.query.country_id;

	getCountries(null, res, mysql, context, complete);
	
	if(country_id){
		getCountries(country_id, res, mysql, context, complete);
	}

	function complete(){
		callbackCount++;
		if(country_id && callbackCount >= 2){
			res.render('countries', context);
		} else if (!country_id && callbackCount >= 1){
			res.render('countries', context);
		}
	}
});

// list languages and render the language creation/edit form
app.get('/languages', function(req, res, render){
	var context = {};
	var callbackCount = 0;
	var language_id = req.query.language_id;

	getLanguages(null, res, mysql, context, complete);
	
	if(language_id){
		getLanguages(language_id, res, mysql, context, complete);
	}

	function complete(){
		callbackCount++;
		if(language_id && callbackCount >= 2){
			res.render('languages', context);
		} else if (!language_id && callbackCount >= 1){
			res.render('languages', context);
		}
	}
});

// list formats and render the format creation/edit form
app.get('/formats', function(req, res, render){
	var context = {};
	var callbackCount = 0;
	var format_id = req.query.format_id;

	getFormats(null, res, mysql, context, complete);
	if(format_id){
		getFormats(format_id, res, mysql, context, complete);
	}

	function complete(){
		callbackCount++
		if(format_id && callbackCount >= 2){
			res.render('formats', context);
		} else if(!format_id && callbackCount >= 1){
			res.render('formats', context);
		}
	}
});

// list categories and render the category and subcategory creation/edit forms
app.get('/categories', function(req, res, render){
	var context = {};
	var category_id = req.query.category_id;
	var subcategory_id = req.query.subcategory_id;
	var callbackCount = 0;

	// get all categories and subcategories
	getSubCategories(null, res, mysql, context, complete);
	getCategories(null, res, mysql, context, complete);

	// get info about a specific category or subcategory
	if(category_id){
		getCategories(category_id, res, mysql, context, complete);
	}
	if(subcategory_id){
		getSubCategories(subcategory_id, res, mysql, context, complete);
	}

	function complete(){
		callbackCount++;
		if(category_id && !subcategory_id && callbackCount >= 3){
			res.render('categories', context);
		} else if (subcategory_id && !category_id && callbackCount >= 3){
			res.render('categories', context);
		} else if (!category_id && !subcategory_id && callbackCount >= 2){
			res.render('categories', context);
		}
	}
});

// render some fun stats
app.get('/stats', function(req, res, render){
	var context = {};

	mysql.pool.query("SELECT Language.language, COUNT(Book.id) AS blcount FROM Book LEFT JOIN Language ON Book.language_id = Language.id GROUP BY Language.id ORDER BY blcount DESC, Language.language ASC", function(err, rows){
		if(err){
			console.log(err);
			// res.send({response: "Database error"});
			// next(err);
			return;
		}
		context.languages = rows;

		mysql.pool.query("SELECT Country.country, COUNT(Book.id) AS bookCount FROM Book LEFT JOIN Author ON Book.author_id = Author.id LEFT JOIN Country ON Author.country_id = Country.id GROUP BY Country.id ORDER BY bookCount DESC, Country.country ASC", function(err, rows){
			if(err){
				console.log(err);
				// res.send({response: "Database error"});
				// next(err);
				return;
			}
			context.countries = rows;
			mysql.pool.query("SELECT a.firstName, a.lastName, COUNT(Book.id) AS bookCount FROM Book LEFT JOIN Author AS a ON Book.author_id = a.id GROUP BY a.id ORDER BY bookCount DESC, a.lastName ASC LIMIT 20", function(err, rows){
				if(err){
					console.log(err);
					// res.send({response: "Database error"});
					// next(err);
					return;
				}
				context.authors = rows;
				mysql.pool.query("SELECT year DIV 10 * 10 AS decade, COUNT(id) AS count FROM Book GROUP BY decade ORDER BY count DESC, decade DESC", function(err, rows){
					if(err){
						console.log(err);
						return;
					}
					context.decades = rows;
					res.render('statsView', context);
				});
			});
		});

	});
});

// render details about a specific book (essentially the same as editBook)
app.get('/bookDetails', function(req, res, next){
	var context = {};
	var book_id = req.query.book_id;
	var callbackCount = 0;

	getBooks(book_id, null, res, mysql, context, complete);
	getSecondaryAuthors(book_id, res, mysql, context, complete);

	function complete(){
		callbackCount++;
		if(callbackCount >= 2){
			res.render('bookDetails', context);
		}
	}
});

/*************************************************
* Consolidated create/edit requests
* When entity IDs are passed, they perform update queries
* Otherwise they perform inserts
*************************************************/

// handle request to create or edit an author
app.post('/editAuthor', function(req, res, next){
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var birthdate = req.body.author_dob;
	if(!birthdate){
		birthdate = null;
	}
	var country_id = req.body.author_country;
	var gender = req.body.gender;
	var author_id = req.body.author_id;

	var insert_query = "INSERT IGNORE INTO Author (firstName, lastName, dob, country_id, gender) VALUES (?, ?, ?, ?, ?)";
	var update_query = "UPDATE IGNORE Author SET firstName = ?, lastName = ?, dob = ?, country_id = ?, gender = ? WHERE Author.id = ?";
	var author_query = null;
	var author_query_vals = [first_name, last_name, birthdate, country_id, gender];

	if(author_id){
		author_query = update_query;
		author_query_vals.push(author_id);
	} else {
		author_query = insert_query;
	}

	console.log(author_id);

	mysql.pool.query(author_query, author_query_vals, function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			console.log("Successful author entry");
			res.redirect("/listAuthors");
		}
	});
});

// handle request to create or edit a user
app.post('/editUser', function(req, res, next){
	var user_id = req.body.user_id;
	var user_name = req.body.user_name;
	var user_email = req.body.user_email;

	var insert_query = "INSERT IGNORE INTO User (user_name, user_email) VALUES (?, ?)";
	var update_query = "UPDATE IGNORE User SET user_name = ?, user_email = ? WHERE id = ?";
	var user_query = null;

	var user_query_vals = [user_name, user_email];

	if(user_id){
		user_id = parseInt(user_id);
		user_query = update_query;
		user_query_vals.push(user_id);
	} else {
		user_query = insert_query;
	}

	console.log("query: " + user_query);
	console.log("name: " + user_name);
	console.log("email: " + user_email);
	console.log("id: " + user_query_vals[2]);

	mysql.pool.query(user_query, user_query_vals, function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			console.log("Successful user edit");
			res.redirect("/listUsers");
		}
	})
});

// handle request to create or edit a language
app.post('/editLanguage', function(req, res, next){
	var language_id = req.body.language_id;
	var language = req.body.language_name;
	var family = req.body.language_family;
	console.log(language_id, language, family);

	var insert_query = "INSERT IGNORE INTO Language (language, language_family) VALUES (?, ?)";
	var update_query = "UPDATE IGNORE Language SET language = ?, language_family = ? WHERE id = ?";
	var query_args = [language, family];
	var language_query = null;

	if(language_id){
		language_query = update_query;
		query_args.push(language_id);
	} else {
		language_query = insert_query;
	}

	mysql.pool.query(language_query, query_args, function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('/languages');
		}
	});
});

// handle request to create or edit a country
app.post('/editCountry', function(req, res, next){
	var country_id = req.body.country_id;
	var country = req.body.country_name;
	var region = req.body.region_name;
	console.log(country_id, country, region);

	var insert_query = "INSERT IGNORE INTO Country (country, region) VALUES (?, ?)";
	var update_query = "UPDATE IGNORE Country SET country = ?, region = ? WHERE id = ?";
	var query_args = [country, region];
	var country_query = null;

	if(country_id){
		country_query = update_query;
		query_args.push(country_id);
	} else {
		country_query = insert_query;
	}

	mysql.pool.query(country_query, query_args, function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('/countries');
		}
	});
});

// handle request to create or edit a category
app.post('/editCategory', function(req, res, next){
	var category_id = req.body.category_id;
	var category = req.body.category_name;

	var insert_query = "INSERT IGNORE INTO Category (name) VALUES (?)";
	var update_query = "UPDATE IGNORE Category SET name = ? WHERE id = ?";
	var query_args = [category];
	var category_query = null;

	if(category_id){
		category_query = update_query;
		query_args.push(category_id);
	} else {
		category_query = insert_query;
	}

	mysql.pool.query(category_query, query_args, function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('categories');
		}
	});
});

// handle request to create or edit a subcategory
app.post('/editSubCategory', function(req, res, next){
	var subcategory_id = req.body.subcategory_id;
	var subcategory = req.body.subcategory_name;
	var category_id = req.body.category_id;

	var insert_query = "INSERT IGNORE INTO SubCategory (name, category_id) VALUES (?, ?)";
	var update_query = "UPDATE IGNORE SubCategory SET name = ?, category_id = ? WHERE id = ?";
	var subcategory_query = null;
	var query_args = [subcategory, category_id];

	if(subcategory_id){
		subcategory_query = update_query;
		query_args.push(subcategory_id);
	} else {
		subcategory_query = insert_query;
	}

	mysql.pool.query(subcategory_query, query_args, function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('categories');
		}
	});
})

// handle request to create or edit a format
app.post('/editFormat', function(req, res, next){
	var format = req.body.format_name;
	var format_id = req.body.format_id;

	var insert_query = "INSERT IGNORE INTO Format (format) VALUES (?)";
	var update_query = "UPDATE IGNORE Format SET format = ? WHERE id = ?";
	var format_query = null;
	var query_args = [format];

	if (format_id){
		format_query = update_query;
		query_args.push(format_id);
	} else {
		format_query = insert_query;
	}

	mysql.pool.query(format_query, query_args, function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('formats');
		}
	})
});

// handle request to create or edit a book
app.post('/editBook', function(req, res, next){
	console.log(req.body);

	var title = req.body.book_title;
	var author_id = req.body.author;
	var language = req.body.book_language;
	var year = req.body.book_year;
	var lang_id = req.body.book_language;
	var category_id = req.body.book_category
	var addl_authors = req.body.addl_authors;
	var book_id = req.body.book_id;

	console.log(lang_id);

	if(!category_id){
		category_id = null;
	}

	var is_anthology = 0;
	if(req.body.is_anthology){
		is_anthology = 1;
	}

	var insert_query = "INSERT IGNORE INTO Book (title, year, language_id, author_id, category_id, is_anthology) VALUES (?, ?, ?, ?, ?, ?)";
	var update_query = "UPDATE IGNORE Book SET title = ?, year = ?, language_id = ?, author_id = ?, category_id = ?, is_anthology = ? WHERE Book.id = ?";
	var book_query = null;

	var book_query_vals = [title, year, lang_id, author_id, category_id, is_anthology];

	if (book_id){
		// if it's an edit to an existing book, we'll use the update query
		book_query = update_query;
		// and we'll need to include the book ID
		book_query_vals.push(book_id);
	} else {
		// if it's a new book, we will use the insert query
		book_query = insert_query;
	}

	mysql.pool.query(book_query, book_query_vals, function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			// delete any authors currently associated with the book
			mysql.pool.query("DELETE FROM BookAuthor WHERE book_id = ?", [book_id], function(err, result){
				if(err){
					res.send({response: "Database error"});
					next(err);
					return;
				} else {
					if(addl_authors){
						// if there are additional authors, add them
						var multi_author_statement = "INSERT IGNORE INTO BookAuthor (book_id, author_id) VALUES (?, ?) ";
						var multi_author_vars;
						if(typeof(addl_authors) == "string"){
							// single author
							multi_author_vars = [book_id, addl_authors];
						} else {
							// multiple authors
							multi_author_vars = [book_id, addl_authors[0]];
							for(var i = 1; i < addl_authors.length; i++){
								multi_author_statement += ", (?, ?) ";
								multi_author_vars.push(book_id);
								multi_author_vars.push(addl_authors[i]);
							}
						}
						mysql.pool.query(multi_author_statement, multi_author_vars, function(err, result){
							if(err){
								res.send({response: "Database error"});
								next(err);
								return;
							} else {
								res.redirect("/listBooks");
							}
						})
					} else {
						res.redirect("/listBooks");
					}
				}
			});
		}
	});
});

/*************************************************
* User-book management
*************************************************/

// handle request to associate a book and user
app.post('/bookUser', function(req, res, next){
	var rating;
	if(req.body.rating){
		rating = req.body.rating;
	} else {
		rating = null;
	}
	var user_id = req.body.user_id;
	var book_id = req.body.book_id;
	var format_id = req.body.format_id;
	var date_read;
	if(req.body.date_read){
		date_read = req.body.date_read;
	} else {
		date_read = null;
	}

	console.log(rating);
	console.log(user_id);
	console.log(book_id);
	console.log(format_id);
	console.log(date_read);

	mysql.pool.query("INSERT IGNORE INTO BookUser (book_id, user_id, rating, date_added, date_read, format_id) \
		VALUES (?, ?, ?, (SELECT CURDATE()), ?, ?)", 
		[book_id, user_id, rating, date_read, format_id],
		function(err, result){
			if(err){
				res.send({response: "Database error"});
				next(err);
				return;
			} else {
				res.redirect('/listUserBooks?user_id=' + user_id);
			}
		})
});


/*************************************************
* Delete requests
* - delete book
* - delete author
*************************************************/
// removes book from a user's shelf by destroying the BookUser relationship
app.get('/removeBook', function(req, res, next){
	
	var book_id = req.query.book_id;
	var user_id = req.query.user_id;
	var format_id = req.query.format_id;

	// if the book and user both exist, delete the BookUser association
	if(book_id && user_id){
		mysql.pool.query("DELETE FROM BookUser WHERE book_id = ? AND user_id = ? AND format_id = ?", [book_id, user_id, format_id], function(err, result){
			if(err){
				res.send({response: "Database error"});
				next(err);
				return;
			} else {
				console.log("Successfully dissociated book " + book_id + " from user " + user_id);
				res.redirect('listUserBooks?user_id='+user_id);
			}
		})
	} else {
		console.log("missing book ID or user ID");
		res.redirect('/listBooks');
	}
});

// deletes the book altogether
app.get('/deleteBook', function(req, res, next){

	console.log("request received to delete entry " + req.query.book_id);

	mysql.pool.query("DELETE FROM Book WHERE id=?", [req.query.book_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect("/listBooks");
		}
	});
});

// deletes user
app.get('/deleteUser', function(req, res, next){
	mysql.pool.query("DELETE FROM User WHERE id = ?", [req.query.user_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('/listUsers');
		}
	})
})

app.get('/deleteAuthor', function(req, res, next){
	mysql.pool.query("DELETE FROM Author WHERE id = ?", [req.query.author_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect("/listAuthors");
		}
	});
});

app.get('/deleteSubCategory', function(req, res, next){
	mysql.pool.query("DELETE FROM SubCategory WHERE id = ?", [req.query.subcategory_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect("/categories");
		}
	});
});

app.get('/deleteCategory', function(req, res, next){
	mysql.pool.query("DELETE FROM Category WHERE id = ?", [req.query.category_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect("/categories");
		}
	})
});

app.get('/deleteCountry', function(req, res, next){
	mysql.pool.query("DELETE FROM Country WHERE id = ?", [req.query.country_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect("/countries");
		}
	})
});

app.get('/deleteLanguage', function(req, res, next){
	mysql.pool.query("DELETE FROM Language WHERE id = ?", [req.query.language_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect("/languages");
		}
	})
});

app.get('/deleteFormat', function(req, res, next){
	mysql.pool.query("DELETE FROM Format WHERE id = ?", [req.query.format_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect("/formats");
		}
	})
});

/*************************************************
* 404 and 500 handleers
*************************************************/
app.use(function(req, res){
	res.status(404);
	res.render('404');
});

app.use(function(err, req, res, next){
	console.error(err.stack);
	res.type('plain/text');
	res.status(500);
	res.render('500');
});

app.listen(app.get('port'), function(){
	console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl+C to terminate.');
});