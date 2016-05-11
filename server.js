"use strict";

const request = require("request");
const Mustache = require("mustache");
const Promise = require("bluebird");
const express = require("express");
const bodyParser = require("body-parser");
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

// ----------------------------------------------------------------------------
// Set up passport
// ----------------------------------------------------------------------------
const passport = require('passport');
const expressSession = require('express-session');
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
passport.use('login', require("./auth")()); // Auth strategy

// ----------------------------------------------------------------------------
// Serialize and Deserialize users
// ----------------------------------------------------------------------------
passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});
 
passport.deserializeUser(function(id, done) {
  done(null, JSON.parse(id));
});





function stripInitialSlash(data) {
  if (data[0] === '/') {
    return data.slice(1);
  } else {
    return data;
  }
}

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}
 
// ----------------------------------------------------------------------------
// Login user
// ------------------------------------------------------------------------------
app.post('/login', passport.authenticate('login', {
  successRedirect: '/home',
  failureRedirect: '/',
  // failureFlash: true ,
}));
app.get("/login", (req, res) => {
  res.send(`<form method="POST">
            <input value="a" name="username" type="text" placeholder="Username" />
            <input value="b"name="password" type="text" placeholder="Password" />
            <input type="submit" />
           </form>`);
});

// ----------------------------------------------------------------------------
// An api query
// ------------------------------------------------------------------------------
app.all("/api/:version/*", isAuthenticated, (req, res, next) => {
  if (req.user) {
    next();
  } else {
    next('No user logged in');
  }
}, (req, res) => {
  let version;
  if (version = req.user.apis[0].versions[req.params.version]) {
    let route = version.routes.find(i => {
      return i.accept.method === req.method && 
      `/api/${req.params.version}/${stripInitialSlash(i.accept.url)}` === req.url;
    });

    if (route && route.proxy.length) {
      // send the data to the client's system
      (function(data) {
        // take the proxy route and render each key
        let dataRender = Object.assign({}, data);
        for (let item in dataRender) {
          if (dataRender.hasOwnProperty(item)) {
            dataRender[item] = Mustache.render(dataRender[item], req);
          }
        }

        // make the request
        let out = request(dataRender).on('error', err => {
          res.json({error: err.toString()});
        }).pipe(res);
      })(route.proxy[0]);
    } else {
      res.status(400).json({error: "No such route, or route cannot handle the request"});
    }
  } else {
    res.status(400).json({error: `Version ${req.params.version} isn't valid.`});
  }
});

app.listen(process.env.PORT || 8000);
