var express = require('express');
var fs = require('fs');
var app = express();


// serve static files so html can access them
app.use(express.static('styles'));
app.use(express.static('node_modules'));


// load html - templates
var tmpIndex = "";
fs. readFile('index.html', 'utf8', function(err, contents) { tmpIndex = contents; });
var tmpTodo = "";
fs. readFile('templates/todoEntry.html', 'utf8', function(err, contents) { tmpTodo = contents; });

var tmpAbout = "";
fs. readFile('about.html', 'utf8', function(err, contents) { tmpAbout = contents; });
var tmpNew = "";
fs. readFile('new.html', 'utf8', function(err, contents) { tmpNew = contents; });


app.get('/', function (req, res) {
	var MongoClient = require('mongodb').MongoClient;
	
	// connect to db
	MongoClient.connect('mongodb://localhost:27017/unitodo', function(err, db) {
		if (err) {
			throw err;
		}
		
		// load todos
		db.collection('todo').find().toArray(function(err, result) {
			if (err) {
				throw err;
			}
			
			
			// build todo list from data and templates
			var todos = "";
			
			for (i = 0; i < result.length; i++) { 
				var todo = tmpTodo.replace("REPLACE_DESC", result[i].desc);
				todo = todo.replace("REPLACE_DATE", result[i].date);
				todo = todo.replace("REPLACE_PROGRESS", result[i].progress);
				todos += todo;
			}
			
			// send index html back
			res.send(tmpIndex.replace("REPLACE_TODO", todos));
			
		});
	});
});

app.get('/about.html', function (req, res) {
	res.send(tmpAbout);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});