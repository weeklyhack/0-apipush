"use strict";

import Promise from "bluebird";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import Handlebars from "handlebars";
let app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(morgan('dev'));

// ----------------------------------------------------------------------------
// Monsoose setup
// ----------------------------------------------------------------------------
import mongoose from 'mongoose';
mongoose.connect(process.env.MONGO_URI);

// ----------------------------------------------------------------------------
// Compile sass and serve assets in public folder
// ----------------------------------------------------------------------------
import compileSass from 'express-compile-sass';
let root = path.join(process.cwd(), "public");
app.use(compileSass({
  root,
  sourceMap: true, // Includes Base64 encoded source maps in output css 
  sourceComments: true, // Includes source comments in output css 
  watchFiles: true, // Watches sass files and updates mtime on main files for each change 
  logToConsole: false, // If true, will log to console.error on errors 
}));
app.use(express.static(root));

// ----------------------------------------------------------------------------
// Set up passport
// ----------------------------------------------------------------------------
import passport from 'passport';
import expressSession from 'express-session';
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
passport.use('login', require("./auth")()); // Auth strategy
app.use(cookieParser('keyboard cat'));

// ----------------------------------------------------------------------------
// Project Files
// ------------------------------------------------------------------------------
import {
  handleApiRequest,
  getApiInformation,
  createApi,
  
  useBasicAuth,
} from "./handler";

// ----------------------------------------------------------------------------
// Handlebars helpers
// ----------------------------------------------------------------------------
Handlebars.registerHelper('json', function(context) {
  return JSON.stringify(context);
});

// ----------------------------------------------------------------------------
// Serialize and Deserialize users
// ----------------------------------------------------------------------------
passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});
 
passport.deserializeUser(function(id, done) {
  done(null, JSON.parse(id));
});


function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// ----------------------------------------------------------------------------
// Login user
// ------------------------------------------------------------------------------
app.post('/login', passport.authenticate('login', {
  successRedirect: '/',
  failureRedirect: '/?failure',
  // failureFlash: true ,
}));
app.get("/login", (req, res) => res.render("login"));
app.get("/", (req, res) => res.render("index"));

// ----------------------------------------------------------------------------
// The api querys
// ------------------------------------------------------------------------------
app.get("/api/_meta(.json)?", getApiInformation);
app.post("/api/_push(.json)?", useBasicAuth, createApi);
app.all("/api/:version/*", handleApiRequest);
app.all("/api/:version", handleApiRequest);

app.listen(process.env.PORT || 8000);
