
/*************************************************
* general app setup
*************************************************/
var express = require('express');
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
	console.log("Requested the home page");
	res.render('home');
});

/*************************************************
* List functions:
* books
* authors
*************************************************/
// list the current books in the database
app.get('/listBooks', function(req, res, next){
	console.log("Request received for table data");
	var book_query = "SELECT b.title, b.year, l.language, a.firstName, a.lastName, c.country FROM Book AS b LEFT JOIN Author AS a ON b.author_id = a.id LEFT JOIN Country AS c ON a.country_id = c.id LEFT JOIN Language AS l ON b.language_id = l.id"

	// take arguments in the query string that limit the search by author, country, or language (using the ID)

	mysql.pool.query(book_query, function(err, rows, fields){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		}
		var context = {};
		context.books = rows;
		res.render('bookList', context); 
	});
});

// Render a list of authors
app.get('/listAuthors', function(req, res, render){
	mysql.pool.query("SELECT a.firstName, a.lastName, a.dob, Country.country FROM Author AS a LEFT JOIN Country ON a.country_id = Country.id", function(err, rows, fields){
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

// get a single entry matching the given ID
// app.get('/showBook', function(req, res, next){
// 	console.log("Request received for data for entry " + req.query.id);
	
// 	mysql.pool.query(/* joins to get the additional data from other tables... */"WHERE book.id = ? LIMIT 1", [req.query.id], function(err, rows, fields){
// 		if(err){
// 			res.send({response: "Database error"});
// 			next(err);
// 			return;
// 		}

// 		res.set('Content-Type', 'application/json');
// 		res.status(200);
// 		res.send(rows);
// 	})
// });

/*************************************************
* Creation requests
* - new book form
* - post a new book
* - new author form
* - post a new author
*************************************************/
// Render the book creation form
app.get('/addBook', function(req, res, render){
	console.log("Rendering the book form");
	res.render('bookForm');
});

// add a book - POST
app.post('/addBook', function(req, res, next){
	console.log("POST request received on the server-side");
	console.log(req.body);

	var title = req.body.book_title;
	var first_name = req.body.author_first_name;
	var last_name = req.body.author_last_name;
	var language = req.body.book_language;
	var year = req.body.book_year;

	console.log(title, first_name, last_name, language, year);

	mysql.pool.query("INSERT INTO Book (title, year, language_id, author_id) VALUES (?, ?, (SELECT id FROM Language WHERE language=?), (SELECT id FROM Author WHERE firstName=? AND lastName=?))", 
		[title, year, language, first_name, last_name], 
		function(err, result){
		if(err){
			res.send({response: "Database error"});
			next(err);
			return;
		} else {
			console.log("Successful book entry");
			res.redirect("/listBooks");
		}
	});
});

// Render the author creation form
app.get('/addAuthor', function(req, res, render){
	res.render('authorForm');
});

// delete a book
// app.get('/removeBook', function(req, res, next){
// 	console.log("request received to delete entry " + req.query.id);

// 	mysql.pool.query("DELETE FROM Book WHERE id=?", [req.query.id], function(err, result){
// 		if(err){
// 			res.send({response: "Database error"});
// 			next(err);
// 			return;
// 		}

// 		// send a success message back to the requester
// 		res.set('Content-Type', 'application/json');
// 		res.status(200);
// 		res.send({response: "Successful deletion"});
// 	});

// });


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