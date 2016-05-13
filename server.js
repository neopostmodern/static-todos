"use strict";

// configure
var fs = require('fs');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

var express = require('express');
var bodyParser = require('body-parser');
var app = express();


// serve static files so html can access them
app.use(express.static('styles'));
app.use(express.static('node_modules'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// setup database connection
var database;
MongoClient.connect('mongodb://localhost:27017/todo', function(err, db) {
  if (err) {
    throw err;
  }

  database = db;
});

var templates = {
  'index': null,
  'todoEntry': null,
  'about': null,
  'new': null,
  'edit': null
};
// load html - templates
for (let templateName in templates) {
  fs.readFile(`templates/${ templateName }.html`, 'utf8', function(error, contents) {
    if (error) {
      throw error;
    } else {
      templates[templateName] = contents;
    }
  });
}


app.get('/', function (req, res) {
  // load todos
  database.collection('todo').find().toArray(function(err, result) {
    if (err) { throw err; }

    // build todo list from data and templates
    var todos = result.map((todo) =>
      templates.todoEntry.replace("REPLACE_DESC", todo.desc)
        .replace("REPLACE_DATE", todo.date)
        .replace("REPLACE_PROGRESS", todo.progress)
        .replace(/REPLACE_ID/g, todo._id)
    ).join("\n");

    let message = "";
    if (req.query.message) {
      message = `<div id="message">${ req.query.message }</div>`;
    }

    // send index html back
    res.send(templates.index.replace("REPLACE_TODO", todos).replace("REPLACE_MESSAGE", message));
  });
});

// serve html pages
app.get('/about.html', function (req, res) {
  res.send(templates.about);
});

app.get('/new.html', function (req, res) {
  res.send(templates.new);
});

// post requests
app.post('/delete', function(req, res) {
  var id = req.body.id;
  database.collection('todo').removeOne(
    {_id: new mongodb.ObjectID(id)},
    (error, result) => {
      if (error) {
        console.error(error);
        res.redirect("/?message=Delete failed");
      } else {
        res.redirect("/?message=Delete successful");
      }
    }
  );
});

app.post('/edit', function(req, res) {
  var id = req.body.id;

  database.collection('todo').find({_id: new mongodb.ObjectID(id)}).toArray(function(err, result) {
    var todo = templates.edit.replace("REPLACE_DESC", result[0].desc);
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
  if(!validateInput(res, desc, date, progress)) return;
  
  database.collection('todo').insertOne(
    { desc, date, progress},
    (error, result) => {
      if (error) {
        console.error(error);
        res.redirect("/?message=Insert failed");
      } else {
        res.redirect("/?message=Insert successful");
      }
    }
  );
});

app.post('/edit/update', function(req, res) {
  var desc = req.body.desc;
  var date = req.body.date;
  var progress = req.body.progress;
  if(!validateInput(res, desc, date, progress)) return;

  database.collection('todo').updateOne(
    { '_id': new mongodb.ObjectID(req.body.id) },
    { $set: { desc, date, progress} },
    (error, result) => {
      if (error) {
        console.error(error);
        res.redirect("/?message=Update failed");
      } else {
        res.redirect("/?message=Update successful");
      }
    }
  );
});


function validateInput(res, desc, date, progress)
{
	if(desc == "" || date == "" || progress == "")
  {
	  res.redirect("/?message=Invalid input: all parameters must be set");
	  return false;
  }else if(progress < 0 || progress >  100)
  {
	  res.redirect("/?message=Invalid input: progress must be in range [0,100]");
	  return false;
  }
  
  return true;
}


// --- START SERVER -----
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});