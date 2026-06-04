var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var apiRouter = require('./routes/api');
var adminRouter = require('./routes/admin');

var app = express();

// Database setup
const { sequelize, User } = require('./models');
const seedDatabase = require('./database/seed');

sequelize.sync()
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Failed to sync database:', err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'antigravity-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' } // secure in production
}));

// Real Auth Middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/auth') || req.path.startsWith('/stylesheets') || req.path.startsWith('/javascripts') || req.path.startsWith('/media') || req.path.startsWith('/api')) {
    return next();
  }
  if (!req.session.user) {
    if (req.xhr || req.headers['x-partial-request'] === 'true' || req.query.partial === 'true') {
      return res.status(401).send('Unauthorized. Please login.');
    }
    return res.redirect('/auth/login');
  }
  res.locals.user = req.session.user;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter);
app.use('/admin', adminRouter);

const errorHandler = require('./middlewares/errorHandler');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// global error handler
app.use(errorHandler);

module.exports = app;
