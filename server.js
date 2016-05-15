"use strict";

import Promise from "bluebird";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import basicAuth from "basic-auth";
let app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(morgan('dev'));

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
} from "./handler";

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

import Users from './users';
function useBasicAuth(req, res, next) {
  function error() {
    res.status(401).send({error: "Please provide valid authorization over basic auth.", code: 401});
  }

  let auth = basicAuth(req);
  if (auth && auth.name && auth.pass) {
    Users.getByEmailPassword(auth.name, auth.pass)
    .then(user => {
      if (user) {
        req.user = user;
        next();
      } else {
        error();
      }
    });
  } else {
    error();
  }
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
app.all("/api/:version/*", handleApiRequest);
app.get("/api/_meta(.json)?", getApiInformation);
app.post("/api/_create(.json)?", useBasicAuth, createApi);

app.listen(process.env.PORT || 8000);
