require('dotenv').config();
const express = require('express');
const db = require("./utils/db");
const app = new express();
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const session = require("express-session");
const flash = require('connect-flash');
const config = require("./config/config");
const nocache = require('nocache');

app.use(session({
    secret: config.sessionSecret,
    saveUninitialized: false,
    resave: false
}));

db();

app.use(sassMiddleware({
    src: path.join(__dirname, 'public/scss'),
    dest: path.join(__dirname, 'public/css'),
    prefix: '/css',
    outputStyle: 'compressed',
    indentedSyntax: true,
}));

app.use(flash());
app.use(nocache());
app.use(logger("dev"));

app.use(bodyParser.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));

const userRoute = require("./routes/userRoute");
app.use('/', userRoute);

const adminRoute = require("./routes/adminRoute");
app.use('/admin', adminRoute);

const port = 8000
app.listen(port, () => {
    console.log(`Server is running on ${port}`);
})

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;