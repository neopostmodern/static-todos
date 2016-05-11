// configure
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();


// serve static files so html can access them
app.use(express.static('styles'));
app.use(express.static('node_modules'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));  


// setup database connection
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var database;
MongoClient.connect('mongodb://localhost:27017/todo', function(err, db) {
	if (err) {
		throw err;
	}
	
	database = db;
});
		



// load html - templates
var tmpIndex = "";
fs. readFile('index.html', 'utf8', function(err, contents) { tmpIndex = contents; });
var tmpTodo = "";
fs. readFile('templates/todoEntry.html', 'utf8', function(err, contents) { tmpTodo = contents; });

var tmpAbout = "";
fs. readFile('about.html', 'utf8', function(err, contents) { tmpAbout = contents; });
var tmpNew = "";
fs. readFile('new.html', 'utf8', function(err, contents) { tmpNew = contents; });
var tmpEdit = "";
fs. readFile('edit.html', 'utf8', function(err, contents) { tmpEdit = contents; });


app.get('/', function (req, res) {
	// load todos
	database.collection('todo').find().toArray(function(err, result) {
		if (err) { throw err; }
		
		// build todo list from data and templates
		var todos = "";
		
		for (i = 0; i < result.length; i++) { 
			var todo = tmpTodo.replace("REPLACE_DESC", result[i].desc);
			todo = todo.replace("REPLACE_DATE", result[i].date);
			todo = todo.replace("REPLACE_PROGRESS", result[i].progress);
			// replace twice because delete and edit need to know
			todo = todo.replace("REPLACE_ID", result[i]._id);
			todo = todo.replace("REPLACE_ID", result[i]._id);
			todos += todo;
		}
		
		// send index html back
		res.send(tmpIndex.replace("REPLACE_TODO", todos));
			
	});
});

// serve html pages
app.get('/about.html', function (req, res) {
	res.send(tmpAbout);
});

app.get('/new.html', function (req, res) {
	res.send(tmpNew);
});

// post requests
app.post('/delete', function(req, res) {
	var id = req.body.id;
	database.collection('todo').remove({_id: new mongodb.ObjectID(id)});
	console.log("todo.removeByID(" + id + ")")
	
	// redirect to index.html
	res.send('<html><head><meta http-equiv="refresh" content="0; url=/" /></head></html>');
});

app.post('/edit', function(req, res) {
	var id = req.body.id;	
	
	
	database.collection('todo').find({_id: new mongodb.ObjectID(id)}).toArray(function(err, result) {
		
			var todo = tmpEdit.replace("REPLACE_DESC", result[0].desc);
			todo = todo.replace("REPLACE_DATE", result[0].date);
			todo = todo.replace("REPLACE_PROGRESS", result[0].progress);
			todo = todo.replace("REPLACE_ID", result[0]._id);
		
			res.send(todo);
	});
});

app.post('/new/insert', function(req, res) {
	var desc = req.body.desc;
	var date = req.body.date;
	var progress = req.body.progress;
	
	database.collection('todo').insert({"desc":desc, "date":date, "progress":progress});
	
	// redirect to index.html
	res.send('<html><head><meta http-equiv="refresh" content="0; url=/" /></head></html>');
});

app.post('/edit/update', function(req, res) {
	var desc = req.body.desc;
	var date = req.body.date;
	var progress = req.body.progress;
	
	database.collection('todo').update({'_id': new mongodb.ObjectID(req.body.id)}, {$set: {"desc" : desc, "date":date, "progress":progress}}, {w:1});
	
	// redirect to index.html
	res.send('<html><head><meta http-equiv="refresh" content="0; url=/" /></head></html>');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});