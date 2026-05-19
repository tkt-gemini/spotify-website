var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api');

var app = express();

// Database setup
const { sequelize, User } = require('./models');
const seedDatabase = require('./database/seed');

sequelize.sync({ alter: true })
  .then(() => seedDatabase())
  .then(() => console.log('Database synced and seeded'))
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
  secret: 'antigravity-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // false for dev without https
}));

// Mock user authentication middleware (default to free_user for demo)
app.use(async (req, res, next) => {
  try {
    if (!req.session.user) {
      const defaultUser = await User.findOne({ where: { username: 'free_user' } });
      if (defaultUser) {
        req.session.user = defaultUser.toJSON();
      }
    }
    res.locals.user = req.session.user;
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware to detect partial requests (for seamless navigation)
app.use((req, res, next) => {
  res.locals.isPartial = req.xhr || req.headers['x-partial-request'] === 'true' || req.query.partial === 'true';
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
