"use strict";

const request = require("request");
const Mustache = require("mustache");
const express = require("express");
let app = express();

const data = {
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
  }
};

data.versions.v1.routes.forEach(i => {
  app[i.accept.method.toLowerCase()](i.accept.url, (req, res) => {

    // send the data to the client's system
    i.proxy.forEach(data => {
      // take the proxy route and render each key
      let dataRender = Object.assign({}, data);
      for (let item in dataRender) {
        if (dataRender.hasOwnProperty(item)) {
          dataRender[item] = Mustache.render(dataRender[item], req);
        }
      }
      console.log(dataRender);

      // make the request
      let out = request(dataRender).on('error', err => {
        res.json({error: err.toString()});
      }).pipe(res);
    });
  });
});

app.listen(process.env.PORT || 8000);
