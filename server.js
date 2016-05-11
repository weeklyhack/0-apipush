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
  },
};

function stripInitialSlash(data) {
  if (data[0] === '/') {
    return data.slice(1);
  } else {
    return data;
  }
}

app.all("/api/:version/*", (req, res) => {
  let version;
  if (version = data.versions[req.params.version]) {
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
