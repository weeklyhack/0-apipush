"use strict";
let LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport) {
  return new LocalStrategy((username, password, done) => {
    console.log("Logging in", username, password);
    return done(null, {
      apis: [
        {
          name: "My Cool API",
          desc: "Doing coolness since a while ago.",
          owner: "username",
          icon: "http://placehold.it/300x300",
          versions: {
            v1: {
              routes: [
                {
                  accept: {
                    method: "GET",
                    url: "/devices",
                  },
                  proxy: [{
                    method: "GET",
                    url: "http://jsfiddle.net/echo/json/?q={{query.abc}}",
                  }],
                },
              ],
            },
          },
        },
      ]
    });
  });
}
