"use strict";
const Promise = require("bluebird");

module.exports = {
  findAll() {
    return Promise.resolve([
      {
        name: "My Cool API",
        slug: "coolapi",
        desc: "Doing coolness since a while ago.",
        createdBy: "1",
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
              {
                accept: {
                  method: "GET",
                  url: "/devices/:id",
                },
                proxy: [{
                  method: "GET",
                  url: "http://jsfiddle.net/echo/json/?q={{params.id}}",
                }],
              },
            ],
          },
        },
      },
    ]);
  },
};
