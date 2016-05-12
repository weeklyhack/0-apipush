"use strict";
let LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
  return new LocalStrategy((username, password, done) => {
    console.log("Logging in", username, password);
    return done(null, {
      username,
      _id: "1",
    });
  });
}
