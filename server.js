"use strict";

import Promise from "bluebird";
import express from "express";
import bodyParser from "body-parser";
let app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// ----------------------------------------------------------------------------
// Set up passport
// ----------------------------------------------------------------------------
import passport from 'passport';
import expressSession from 'express-session';
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
passport.use('login', require("./auth")()); // Auth strategy

// ----------------------------------------------------------------------------
// Project Files
// ------------------------------------------------------------------------------
import {handleApiRequest, getApiInformation} from "./handler";

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
app.all("/api/:version/*", handleApiRequest);
app.all("/api/_meta(.json)?", getApiInformation);

app.listen(process.env.PORT || 8000);
