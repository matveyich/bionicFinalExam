var express = require('express'),
    path = require('path'),
    http = require('http'),

    task = require('./routes/objects');

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.use(express.logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser()),
    app.use(express.static(path.join(__dirname, 'public')));
});

app.all('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Content-Type", "application/json");
    res.header("Charset", "utf-8");
    next();
});

app.get('/', task.serveIndexHtml);
app.get('/web2lead', task.serveWeb2LeadHtml);
app.get('/tasks', task.findAll);
app.get('/tasks/:id', task.findById);
app.post('/tasks', task.addObject);
app.put('/tasks/:id', task.updateObject);
app.delete('/tasks/:id', task.deleteObject);
app.get('/delete/tasks', task.removeAllObjects);
app.post('/updateTasksDate', task.updateTasksDate);
app.get('/updateTasksDate', task.getTasksDate);

http.createServer(app).listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
