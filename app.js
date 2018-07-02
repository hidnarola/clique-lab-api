var createError = require('http-errors');
var express = require('express');
var path = require('path');
var fs = require('fs');
var db = require('./models/db');
var auth = require('./middlewares/auth');
var authorization = require('./middlewares/authorization');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var dotenv = require('dotenv').config();

var fileUpload = require('express-fileupload');
var expressValidator = require('express-validator');

// Create cluster environment
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

/* config files */

var config = require('./config');
var dbConnect = require('./database/mongoDbConnection');
var swaggerUi = require('swagger-ui-express'),
swaggerDocument = require('./swagger.json');

var app = express();
app.use(fileUpload());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/',express.static(path.join(__dirname, 'build')));
app.use('/api',express.static(path.join(__dirname, 'public')));
app.use('/api',express.static(path.join(__dirname, 'doc')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

var options = {
  swaggerOptions: {
    authAction :{ JWT: {name: "JWT", schema: {type: "apiKey", in: "header", name: "x-access-token", description: ""}, value: "<JWT>"} }
  }
};
app.use('/api/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument,options));

app.use(expressValidator());

// Support corss origin request
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'x-access-token,content-type');

  // Set to true if you need the website to include cookies in the requests sent to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // If option request, send okay response
  if (req.method == 'OPTIONS') {
    res.status(200).json();
  } else {
    next()
  }
});

var index = require('./routes/index');
var user = require('./routes/user');
var promoter = require('./routes/promoter');
var admin = require('./routes/admin');
var cron = require("./routes/cron");
// var admin = require('./routes/admin');


app.use('/api/',index);
app.use('/api/user', user);
app.use('/api/promoter', promoter);
app.use('/api/admin', admin);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler, will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: err
    });
  });
}

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// if (cluster.isMaster) {
  // for (var i = 0; i < numCPUs; i++) {
    // // Create a worker
    // cluster.fork();
  // }
// } else {
  // var server = app.listen((config.node_port || 3000), function () {
    // //console.log('Listening on port ' + (config.node_port || 3000) + '...');
  // });
// }
// cluster.on('exit', function (worker, code, signal) {
  // console.log('Worker %d died with code/signal %s. Restarting worker...', worker.process.pid, signal || code);
  // cluster.fork();
// });

module.exports = app;