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

	var query_args = [];

	// take arguments in the query string that limit the search by author, country, or language (using the ID)
	if(req.query.author_id){
		book_query += " AND b.author_id = ?";
		query_args.push(req.query.author_id);
	}
	if(req.query.language_id){
		book_query += " AND b.language_id = ?";
		query_args.push(req.query.language_id);
	}
	if(req.query.country_id){
		book_query += " AND a.country_id = ";
		query_args.push(req.query.country_id);
	}
	if(req.query.gender){
		book_query += " AND a.gender = '?'";
		query_args.push(req.query.gender);
	}
	if(req.query.category_id){
		book_query += " AND b.category_id = ?";
		query_args.push(req.query.category_id);
	}
	if(req.query.user_id){
		book_query += " AND b.id IN (SELECT book_id FROM BookUser WHERE user_id = ?)";
		query_args.push(req.query.user_id);
	}

	if(req.query.author){
		book_query += " AND (a.firstName LIKE ? OR a.lastName LIKE ? ) ";
		query_args.push('%' + req.query.author + '%');
		query_args.push('%' + req.query.author + '%');
	}

	if(req.query.title){
		book_query += " AND b.title LIKE ? ";
		query_args.push('%' + req.query.title + '%');
	}
	if(req.query.subject){
		book_query += " AND sc.name LIKE ? ";
		query_args.push('%' + req.query.subject + '%');
	}

	book_query += " ORDER BY a.lastName, b.year";

	mysql.pool.query(book_query, query_args, function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		}
		context.books = rows;
		res.render('bookList', context); 
	});
});

app.get('/listUserBooks', function(req, res, next){
	var context = {};
	
	console.log("Request received for table data");
	
	var user_id = req.query.user_id;

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

app.get('/countries', function(req, res, render){
	var context = {};
	var country_id = req.query.country_id;
	mysql.pool.query("SELECT id, country, region FROM Country ORDER BY country", function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else{
			context.countries = rows;
			if(country_id){
				mysql.pool.query("SELECT id, country, region FROM Country WHERE id = ? LIMIT 1", [country_id], function(err, rows, fields){
					if(err){
						res.send({response: "Database error"});
						next(err);
						return;
					} else {
						context.country_info = rows[0];
						res.render('countries', context);
					}
				})
			} else {
				res.render('countries', context);
			}
		}
	});
});

app.get('/languages', function(req, res, render){
	var context = {};
	var language_id = req.query.language_id;
	mysql.pool.query("SELECT id, language, language_family FROM Language ORDER BY language", function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else{
			context.languages = rows;
			if(language_id){
				mysql.pool.query("SELECT id, language, language_family FROM Language WHERE id = ?", [language_id], function(err, rows, fields){
					if(err){
						res.send({response: "Database error"});
						next(err);
						return;
					} else {
						context.language_info = rows[0];
						res.render('languages', context);
					}
				})
			} else {
				res.render('languages', context);
			}
		}
	});
});

app.get('/formats', function(req, res, render){
	var context = {};
	var format_id = req.query.format_id;
	mysql.pool.query("SELECT id, format FROM Format ORDER BY format", function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else{
			context.formats = rows;
			if(format_id){
				mysql.pool.query("SELECT id, format FROM Format WHERE id = ?", [format_id], function(err, rows, fields){
					if(err){

					} else {
						context.format_info = rows[0];
						res.render('formats', context);
					}
				})
			} else {
				res.render('formats', context);
			}
		}
	});
});

app.get('/categories', function(req, res, render){
	var context = {};
	var category_id = req.query.category_id;
	var subcategory_id = req.query.subcategory_id;
	console.log(category_id);
	mysql.pool.query("SELECT SubCategory.id AS subcategory_id, SubCategory.name AS subcategory, Category.name AS category, Category.id AS category_id FROM SubCategory RIGHT JOIN Category ON SubCategory.category_id = Category.id", function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else{
			context.subcategories = rows;
			mysql.pool.query("SELECT id, name FROM Category", function(err, rows, fields){
				if(err){
					res.send({response: "Database error"});
					next(err);
					return;
				} else {
					context.categories = rows;
					if(category_id){
						mysql.pool.query("SELECT id, name FROM Category WHERE id = ?", [category_id], function(err, rows, fields){
							if(err){
								res.send({response: "Database error"});
								next(err);
								return;
							} else {
								context.category_info = rows[0];
								console.log(context.category_info);
								res.render('categories', context);
							}
						})
					} else if(subcategory_id){
						mysql.pool.query("SELECT SubCategory.id AS subcategory_id, Category.id AS category_id, SubCategory.name AS subcategory, Category.name AS category \
							FROM SubCategory INNER JOIN Category ON SubCategory.category_id = Category.id WHERE SubCategory.id = ?", 
							[subcategory_id], function(err, rows, fields){
							if(err){
								res.send({response: "Database error"});
								next(err);
								return;
							} else {
								context.subcategory_info = rows[0];
								res.render('categories', context);
							}
						});
					} else {
						res.render('categories', context);
					}
				}
			});
		}
	});
});

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

/*************************************************
*
*
*************************************************/

app.get('/bookDetails', function(req, res, next){
	var context = {};
	var book_id = req.query.book_id;
	mysql.pool.query("SELECT Book.title, Book.year, Book.is_anthology, \
		Category.name AS categoryName, SubCategory.name AS subCategoryName, \
		Language.language, Author.firstName, Author.lastName, Country.country \
		FROM Book \
		LEFT JOIN SubCategory ON Book.category_id = SubCategory.id \
		LEFT JOIN Category ON SubCategory.category_id = Category.id \
		INNER JOIN Author ON Book.author_id = Author.id \
		LEFT JOIN Country ON Author.country_id = Country.id \
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

					console.log(context);
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

// add an author - POST
app.post('/addAuthor', function(req, res, next){
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var birthdate = req.body.author_dob;
	if(!birthdate){
		birthdate = null;
	}
	var country = req.body.author_country;
	var gender = req.body.gender;

	console.log(birthdate);

	mysql.pool.query("INSERT INTO Author (firstName, lastName, dob, country_id, gender) VALUES (?, ?, ?, ?, ?)", 
		[first_name, last_name, birthdate, country, gender], 
		function(err, result){
		if(err){
			// res.send({response: "Database error"});
			console.log(err);
			console.log("error:");
			console.log(err.Error = "ER_DUP_ENTRY");
			next(err);
			return;
		} else {
			console.log("Successful author entry");
			// res.redirect("/listAuthors");
		}
	});
	res.redirect("/listAuthors");
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

app.post('/addLanguage', function(req, res, next){
	var language = req.body.language_name;
	var language_family = req.body.language_family;
	mysql.pool.query("INSERT INTO Language (language, language_family) VALUES (?, ?)", [language, language_family], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('languages');
		}
	});
});

app.post('/addCountry', function(req, res, next){
	var country = req.body.country_name;
	var region = req.body.region_name;
	mysql.pool.query("INSERT INTO Country (country, region) VALUES (?, ?)", [country, region], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('countries');
		}
	});
});

app.post('/addCategory', function(req, res, next){
	var category = req.body.category_name;
	mysql.pool.query("INSERT INTO Category (name) VALUES (?)", [category], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('categories');
		}
	});
});

app.post('/editCategory', function(req, res, next){
	var category_id = req.body.category_id;
	var category = req.body.category_name;
	mysql.pool.query("UPDATE Category SET name = ? WHERE id = ?", [category, category_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('categories');
		}
	});
});

app.post('/addSubCategory', function(req, res, next){
	var subcategory = req.body.subcategory_name;
	var category_id = req.body.category_id;
	mysql.pool.query("INSERT INTO SubCategory (name, category_id) VALUES (?, ?)", [subcategory, category_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('categories');
		}
	});
});

app.post('/editSubCategory', function(req, res, next){
	var subcategory_id = req.body.subcategory_id;
	var subcategory = req.body.subcategory_name;
	var category_id = req.body.category_id;
	mysql.pool.query("UPDATE SubCategory SET name = ?, category_id = ? WHERE id = ?", [subcategory, category_id, subcategory_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('categories');
		}
	});
})

app.post('/addFormat', function(req, res, next){
	var format = req.body.format_name;
	mysql.pool.query("INSERT INTO Format (format) VALUES (?)", [format], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('formats');
		}
	});
});

app.post('/editFormat', function(req, res, next){
	var format = req.body.format_name;
	var format_id = req.body.format_id;
	mysql.pool.query("UPDATE FORMAT SET format = ? WHERE id = ?", [format, format_id], function(err, result){
		if(err){

		} else {
			res.redirect('formats');
		}
	})
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
				res.redirect('/listUserBooks?user_id=' + user_id);
			}
		})
});

/*************************************************
* Edit requests
* - edit book
* - edit author
*************************************************/
app.get('/editBook', function(req, res, next){
	var book_id = req.query.book_id;
	
	var context = {};

	mysql.pool.query("SELECT b.title, b.year, l.language, a.firstName, a.lastName, c.country, b.is_anthology, \
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
					mysql.pool.query("SELECT id, firstName, lastName FROM Author WHERE id NOT IN (SELECT author_id FROM BookAuthor WHERE book_id = ?) ORDER BY lastName, firstName", [book_id], function(err, rows, result){
						if(err){
							res.send({response: "Database error"});
							next(err);
							return;
						} else {
							context.non_selected_authors = rows;
							mysql.pool.query("SELECT id, name FROM SubCategory ORDER BY name", function(err, rows, result){
								if(err){
									res.send({response: "Database error"});
									next(err);
									return;
								} else {
									context.categories = rows;
									mysql.pool.query("SELECT id, firstName, lastName FROM Author WHERE id IN (SELECT author_id FROM BookAuthor WHERE book_id = ?) ORDER BY lastName, firstName", [book_id], function(err, rows, result){
										if(err){
											res.send({response: "Database error"});
											next(err);
											return;
										} else {
											context.selected_authors = rows;
											res.render('editBook', context);
										}
									});
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
	var lang_id = parseInt(req.body.book_language);
	var category_id = req.body.book_category
	var addl_authors = req.body.addl_authors;
	var book_id = req.body.book_id;

	var is_anthology = 0;
	if(req.body.is_anthology){
		is_anthology = 1;
	}

	var new_book = false;
	if(book_id == "NEW"){
		new_book = true;
	}

	var insert_query = "INSERT INTO Book (title, year, language_id, author_id, category_id, is_anthology) VALUES (?, ?, ?, ?, ?, ?)";
	var update_query = "UPDATE Book SET title = ?, year = ?, language_id = ?, author_id = ?, category_id = ?, is_anthology = ? WHERE Book.id = ?";
	var book_query = null;

	var book_query_vals = [title, year, lang_id, author_id, category_id, is_anthology];
	
	if(new_book){
		// if it's a new book, we will use the insert query
		book_query = insert_query;
	} else {
		// if it's an edit to an existing book, we'll use the update query
		book_query = update_query;
		// and we'll need to include the book ID
		book_query_vals.push(book_id);
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
						var multi_author_statement = "INSERT INTO BookAuthor (book_id, author_id) VALUES (?, ?) ";
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

app.get('/editAuthor', function(req, res, next){
	
	var author_id = req.query.author_id;

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

			// format the DOB to a string so that it can populate the form DOB value
			if(context.author_info){
				context.author_info.dob = context.author_info.dob.toISOString().split("T")[0];
			}

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
	var user_id = req.query.user_id;
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

app.post('/editUser', function(req, res, next){
	var user_id = req.body.user_id;
	var user_name = req.body.user_name;
	mysql.pool.query("UPDATE User SET user_name = ? WHERE id = ?", [user_name, user_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			console.log("Successful user edit");
			res.redirect("/listUsers");
		}
	})
})

app.post('/editLanguage', function(req, res, next){
	var language_id = req.body.language_id;
	var language = req.body.language_name;
	var family = req.body.language_family;
	console.log(language_id, language, family);

	mysql.pool.query("UPDATE Language SET language = ?, language_family = ? WHERE id = ?", [language, family, language_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('/languages');
		}
	});
});

app.post('/editCountry', function(req, res, next){
	var country_id = req.body.country_id;
	var country = req.body.country_name;
	var region = req.body.region_name;
	console.log(country_id, country, region);

	mysql.pool.query("UPDATE Country SET country = ?, region = ? WHERE id = ?", [country, region, country_id], function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			res.redirect('/countries');
		}
	});
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
			res.redirect('/editBook?book_id=' + book_id);
		}
	});
});

/*************************************************
* Delete requests
* - delete book
* - delete author
*************************************************/
// removes book from a user's shelf
app.get('/removeBook', function(req, res, next){
	
	var book_id = req.query.book_id;
	var user_id = req.query.user_id;

	// if the book and user both exist, delete the BookUser association
	if(book_id && user_id){
		mysql.pool.query("DELETE FROM BookUser WHERE book_id = ? AND user_id = ?", [book_id, user_id], function(err, result){
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