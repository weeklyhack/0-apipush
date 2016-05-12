"use strict";
const Api = require("./apis");
const Mustache = require("mustache");
const request = require("request");
const url = require("url");

function stripInitialSlash(data) {
  if (data[0] === '/') {
    return data.slice(1);
  } else {
    return data;
  }
}

module.exports = function(req, res) {
  let version;

  Api.findAll()
  .then(apis => apis.find(api => api.slug === req.query.slug))
  .then(api => {
    if (api) {
      if (version = api.versions[req.params.version]) {
        // get the route that the user is referencing
        let route = version.routes.find(i => {
          let baseUrl = url.parse(req.url);
          return i.accept.method === req.method && 
          `/api/${req.params.version}/${stripInitialSlash(i.accept.url)}` === baseUrl.pathname;
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
    } else {
      res.status(400).json({error: `No such api with slug ${req.query.slug}`});
    }
  });
}
