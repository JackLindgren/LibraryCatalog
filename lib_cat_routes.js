/*************************************************
* general app setup
*************************************************/
var express = require('express');
var handlebars = require('express-handlebars');
var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 6848);
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
* List functions:
* books
* authors
*************************************************/
// list the current books in the database
app.get('/listBooks', function(req, res, next){
	var context = {};
	console.log("Request received for table data");
	var book_query = "SELECT b.title, b.year, l.language, a.firstName, a.lastName, c.country, \
		b.id AS book_id, l.id AS lang_id, a.id AS auth_id, c.id AS country_id, a.gender, b.category_id, \
		sc.name AS category_name \
		FROM Book AS b \
		LEFT JOIN Author AS a ON b.author_id = a.id \
		LEFT JOIN Country AS c ON a.country_id = c.id \
		LEFT JOIN Language AS l ON b.language_id = l.id \
		LEFT JOIN SubCategory AS sc ON b.category_id = sc.id \
		WHERE b.id ";

	// take arguments in the query string that limit the search by author, country, or language (using the ID)
	if(req.query.author){
		console.log("There is an author: ", req.query.author);
		book_query += " AND b.author_id = " + req.query.author;
	}
	if(req.query.language){
		console.log("There is a language: ", req.query.language);
		book_query += " AND b.language_id = " + req.query.language;
	}
	if(req.query.country){
		console.log("There is a country: ", req.query.country);
		book_query += " AND a.country_id = " + req.query.country;
	}
	if(req.query.gender){
		book_query += " AND a.gender = " + "'" + req.query.gender + "'";
	}
	if(req.query.category){
		book_query += " AND b.category_id = " + req.query.category;
	}
	if(req.query.user){
		book_query += " AND b.id IN (SELECT book_id FROM BookUser WHERE user_id = " + req.query.user + ")";
	}

	book_query += " ORDER BY a.lastName, b.year";

	mysql.pool.query(book_query, function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		}
		context.books = rows;
		console.log(context);
		res.render('bookList', context); 
	});
});

app.get('/listUserBooks', function(req, res, next){
	var context = {};
	
	console.log("Request received for table data");
	
	var user_id = req.query.user;

	var book_query = "SELECT b.title, b.year, l.language, a.firstName, a.lastName, c.country, \
		b.id AS book_id, l.id AS lang_id, a.id AS auth_id, c.id AS country_id, a.gender, b.category_id, \
		sc.name AS category_name, \
		bu.user_id, u.user_name, bu.date_added, bu.date_read, \
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

	mysql.pool.query(book_query, [user_id], function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			context.books = rows;
			res.render('userBooks', context);
		}
	});
})

// Render a list of authors
app.get('/listAuthors', function(req, res, render){
	mysql.pool.query("SELECT a.id, a.firstName, a.lastName, a.dob, a.gender, Country.country \
		FROM Author AS a \
		LEFT JOIN Country ON a.country_id = Country.id \
		ORDER BY a.lastName", 
	function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		}
		var context = {};
		context.authors = rows;
		res.render('authorList', context); 
	});
});

// render a list of users
app.get('/listUsers', function(req, res, render){
	console.log("request received for user data");
	mysql.pool.query("SELECT id, user_name, user_email FROM User", function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} 
		var context = {};
		context.users = rows;
		console.log(context);
		res.render('userList', context);
	});
});



app.get('/stats', function(req, res, render){
	var context = {};

	mysql.pool.query("SELECT Language.language, COUNT(Book.id) AS blcount FROM Book LEFT JOIN Language ON Book.language_id = Language.id GROUP BY Language.id ORDER BY blcount DESC, Language.language ASC", function(err, rows){
		if(err){
			console.log(err);
			res.send({response: "Database error"});
			next(err);
			return;
		}
		context.languages = rows;

		mysql.pool.query("SELECT Country.country, COUNT(Book.id) AS bookCount FROM Book LEFT JOIN Author ON Book.author_id = Author.id LEFT JOIN Country ON Author.country_id = Country.id GROUP BY Country.id ORDER BY bookCount DESC, Country.country ASC", function(err, rows){
			if(err){
				console.log(err);
				// res.send({response: "Database error"});
				// next(err);
				// return;
			}
			context.countries = rows;
			mysql.pool.query("SELECT a.firstName, a.lastName, COUNT(Book.id) AS bookCount FROM Book LEFT JOIN Author AS a ON Book.author_id = a.id GROUP BY a.id ORDER BY bookCount DESC, a.lastName ASC LIMIT 20", function(err, rows){
				if(err){
					console.log(err);
					// res.send({response: "Database error"});
					// next(err);
					// return;
				}
				context.authors = rows;
				mysql.pool.query("SELECT year DIV 10 * 10 AS decade, COUNT(id) AS count FROM Book GROUP BY decade ORDER BY count DESC, decade DESC", function(err, rows){
					if(err){
						console.log(err);
					}
					context.decades = rows;
					res.render('statsView', context);
				});
			});
		});

	});
});

/*************************************************
*
*
*************************************************/

app.get('/bookDetails', function(req, res, next){
	var context = {};
	var book_id = req.query.id;
	mysql.pool.query("SELECT Book.title, Book.year, Category.name AS categoryName, SubCategory.name AS subCategoryName, Language.language, Author.firstName, Author.lastName, Country.country \
		FROM Book \
		INNER JOIN SubCategory ON Book.category_id = SubCategory.id \
		INNER JOIN Category ON SubCategory.category_id = Category.id \
		INNER JOIN Author ON Book.author_id = Author.id \
		INNER JOIN Country ON Author.country_id = Country.id \
		INNER JOIN Language ON Book.language_id = Language.id \
		WHERE Book.id = ?", [book_id], function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			context.book_info = rows[0];
			mysql.pool.query("SELECT Author.firstName, Author.lastName \
				FROM BookAuthor \
				INNER JOIN Author ON BookAuthor.author_id = Author.id \
				WHERE BookAuthor.book_id = ?", [book_id], function(err, rows, fields){
				if(err){
					res.send({response: "Database error"});
					next(err);
					return;
				} else {
					context.addl_authors = rows;
					res.render('bookDetails', context);
				}
			})
		}
	});
});

/*************************************************
* Creation requests
* - post a new book
* - post a new author
*************************************************/
// add a book - POST
app.post('/addBook', function(req, res, next){
	console.log("POST request received on the server-side");
	console.log(req.body);

	var title = req.body.book_title;
	// var first_name = req.body.author_first_name;
	// var last_name = req.body.author_last_name;
	var author_id = req.body.author_id;
	var language = req.body.book_language;
	var year = req.body.book_year;
	var language_id = req.body.book_language;
	var category_id = req.body.book_category;

	console.log(title, first_name, last_name, language, year);

	mysql.pool.query("INSERT INTO Book (title, year, language_id, author_id, category_id) \
		VALUES (?, ?, ?, ?, ?)", 
		[title, year, language_id, author_id, category_id], 
		function(err, result){
		if(err){
			console.log(err);
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			console.log("Successful book entry");
			res.redirect("/listBooks");
		}
	});
});

// add an author - POST
app.post('/addAuthor', function(req, res, next){
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var birthdate = req.body.author_dob;
	var country = req.body.author_country;
	var gender = req.body.gender;

	console.log(birthdate);

	mysql.pool.query("INSERT INTO Author (firstName, lastName, dob, country_id, gender) VALUES (?, ?, ?, ?, ?)", 
		[first_name, last_name, birthdate, country, gender], 
		function(err, result){
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

app.post('/addUser', function(req, res, next){
	var user_name = req.body.user_name;
	var user_email = req.body.user_email;

	mysql.pool.query("INSERT INTO User (user_name, user_email) VALUES (?, ?)",
		[user_name, user_email],
		function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			console.log("Successful user entry");
			res.redirect("/listUsers");
		}
	});
});

/*************************************************
* User-book management
*************************************************/
app.get('/bookUser', function(req, res, next){
	var context = {};
	mysql.pool.query("SELECT id, user_name, user_email FROM User", function(err, rows, result){
		if(err){
			return;
		} else {
			context.users = rows;
			mysql.pool.query("SELECT Book.id, Book.title, Author.lastName FROM Book INNER JOIN Author ON Book.author_id = Author.id ORDER BY Book.title", function(err, rows, result){
				if(err){
					res.send({response: "Database error"});
					next(err);
					return;
				} else {
					context.books = rows;
					mysql.pool.query("SELECT id, format FROM Format ORDER BY format", function(err, rows, result){
						context.formats = rows;
						res.render('bookUser', context);
					})
				}
			})
		}
	});	
});

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

	mysql.pool.query("INSERT INTO BookUser (book_id, user_id, rating, date_added, date_read, format_id) \
		VALUES (?, ?, ?, (SELECT CURDATE()), ?, ?)", 
		[book_id, user_id, rating, date_read, format_id],
		function(err, result){
			if(err){
				res.send({response: "Database error"});
				next(err);
				return;
			} else {
				res.redirect('/listUserBooks?user=' + user_id);
			}
		})
});

/*************************************************
* Edit requests
* - edit book
* - edit author
*************************************************/
app.get('/editBook', function(req, res, next){
	var book_id = req.query.id;
	
	var context = {};

	if(book_id){
		context.route = "/editBook";
	} else {
		context.route = "/addBook";
	}

	// send back a list of author names and languages 
	var author_names = [];
	var languages = [];

	mysql.pool.query("SELECT b.title, b.year, l.language, a.firstName, a.lastName, c.country, \
		b.id AS book_id, l.id AS language_id, a.id AS auth_id, c.id AS country_id, \
		b.category_id, s.name \
		FROM Book AS b \
		LEFT JOIN Author AS a ON b.author_id = a.id \
		LEFT JOIN Country AS c ON a.country_id = c.id \
		LEFT JOIN Language AS l ON b.language_id = l.id \
		LEFT JOIN SubCategory AS s ON b.category_id = s.category_id \
		WHERE b.id = ? LIMIT 1", 
		[book_id], 
		function(err, rows, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			context.book_info = rows[0];
			mysql.pool.query("SELECT language, id AS language_id FROM Language ORDER BY language", function(err, rows, result){
				if(err){
					res.send({response: "Database error"});
					next(err);
					return;
				} else {
					context.languages = rows;
					mysql.pool.query("SELECT id, firstName, lastName FROM Author ORDER BY lastName, firstName", function(err, rows, result){
						if(err){
							res.send({response: "Database error"});
							next(err);
							return;
						} else {
							context.author_names = rows;
							mysql.pool.query("SELECT id, name FROM SubCategory ORDER BY name", function(err, rows, result){
								if(err){
									res.send({response: "Database error"});
									next(err);
									return;
								} else {
									context.categories = rows;
									res.render('editBook', context);
								}
							});
						}
					});
				}
			});
		}
	});
});

app.post('/editBook', function(req, res, next){
	var title = req.body.book_title;
	var author_id = req.body.author;
	var language = req.body.book_language;
	var year = req.body.book_year;
	var book_id = parseInt(req.body.book_id);
	var lang_id = parseInt(req.body.book_language);
	var category_id = req.body.book_category

	var addl_authors = req.body.addl_authors;

	console.log(req.body);

	mysql.pool.query("UPDATE Book SET title = ?, year = ?, language_id = ?, author_id = ?, category_id = ? WHERE Book.id = ? ", 
		[title, year, lang_id, author_id, category_id, book_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			console.log("Successful book entry");
			if(addl_authors){
				var multi_author_statement = "INSERT INTO BookAuthor (book_id, author_id) VALUES (?, ?) ";
				var multi_author_vars;
				if(typeof(addl_authors) == "string"){
					multi_author_vars = [book_id, addl_authors];
				} else {
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
});

app.get('/editAuthor', function(req, res, next){
	
	var author_id = req.query.id;

	var context = {};
	if(author_id){
		context.route = "/editAuthor";
	} else {
		context.route = "/addAuthor";
	}

	// get the current author's information
	mysql.pool.query("SELECT a.id, a.firstName, a.lastName, a.dob, a.gender, Country.country, Country.id AS country_id FROM Author AS a LEFT JOIN Country ON a.country_id = Country.id WHERE a.id = ? LIMIT 1",
		[author_id],
		function(err, rows, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {

			context.author_info = rows[0];

			// get the current valid countries
			mysql.pool.query("SELECT country, id AS country_id FROM Country", function(err, rows, result){
				if(err){
					res.send({response: "Database error"});
					next(err);
					return;
				} else {
					context.countries = rows;
					res.render('editAuthor', context);
				}
			});
		}
	});
});

app.post('/editAuthor', function(req, res, next){
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var birthdate = req.body.author_dob;
	var country_id = req.body.author_country;
	var gender = req.body.gender;
	var author_id = req.body.author_id;

	mysql.pool.query("UPDATE Author SET firstName = ?, lastName = ?, dob = ?, country_id = ?, gender = ? WHERE Author.id = ?", 
		[first_name, last_name, birthdate, country_id, gender, author_id], 
		function(err, result){
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

app.get('/editUser', function(req, res, next){
	var user_id = req.query.id;
	var context = {};
	if(user_id){
		context.editing = true;
		context.route = '/editUser';
	} else {
		context.route = '/addUser';
	}
	mysql.pool.query("SELECT id, user_name, user_email FROM User WHERE id = ? LIMIT 1",
		[user_id],
		function(err, row, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			context.user_info = row[0];
			console.log(context);
			res.render('editUser', context);
		}
	});
});

app.get('/addSecondaryAuthor', function(req, res, next){
	var book_id = req.query.id;
	
	var context = {};

	mysql.pool.query("SELECT b.title, b.year, l.language, a.firstName, a.lastName, c.country, \
		b.id AS book_id, l.id AS language_id, a.id AS auth_id, c.id AS country_id \
		FROM Book AS b \
		LEFT JOIN Author AS a ON b.author_id = a.id \
		LEFT JOIN Country AS c ON a.country_id = c.id \
		LEFT JOIN Language AS l ON b.language_id = l.id \
		WHERE b.id = ? LIMIT 1", 
		[book_id],
		function(err, rows, result){
			if(err){
				console.log("error");
			} else {
				context.book_info = rows[0];
				mysql.pool.query("SELECT id, firstName, lastName FROM Author", function(err, rows, result){
					if(err){
						res.send({response: "Database error"});
						next(err);
						return;
					} else {
						context.author_names = rows;
						res.render('addSecondaryAuthor', context);
					}
				});
			}
		}
	)
});


app.post('/addSecondaryAuthor', function(req, res, next){
	var book_id = req.body.book_id;
	var author_id = req.body.author;
	console.log(book_id + " " + author_id);

	mysql.pool.query("INSERT INTO BookAuthor (book_id, author_id) VALUES (?, ?)", [book_id, author_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('/editBook?id=' + book_id);
		}
	});
});

/*************************************************
* Delete requests
* - delete book
* - delete author
*************************************************/
app.get('/removeBook', function(req, res, next){
	var book_id = req.query.book_id;
	var user_id = req.query.user_id;
	if(book_id && user_id){
		mysql.pool.query("DELETE FROM BookUser WHERE book_id = ? AND user_id = ?", [book_id, user_id], function(err, result){
			if(err){
				res.send({response: "Database error"});
				next(err);
				return;
			} else {
				console.log("Successfully dissociated book " + book_id + " from user " + user_id);
				res.redirect('listUserBooks?user='+user_id);
			}
		})
	} else {
		console.log("missing book ID or user ID");
		res.redirect('/listBooks');
	}
});

app.get('/deleteBook', function(req, res, next){
	console.log("request received to delete entry " + req.query.id);

	mysql.pool.query("DELETE FROM Book WHERE id=?", [req.query.id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect("/listBooks");
		}
	});
});

app.get('/removeAuthor', function(req, res, next){
	mysql.pool.query("DELETE FROM Book WHERE author_id = ?", [req.query.id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			mysql.pool.query("DELETE FROM Author WHERE id = ?", [req.query.id], function(err, result){
				if(err){
					res.send({response: "Database error"});
					next(err);
					return;
				} else {
					res.redirect("/listAuthors");
				}
			});
		}
	});

	// mysql.pool.query("DELETE FROM Author WHERE id = ?", [req.query.id], function(err, result){
	// 	if(err){
	// 		res.send({response: "Database error"});
	// 		next(err);
	// 		return;
	// 	} else {
	// 		res.redirect("/listAuthors");
	// 	}
	// });
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