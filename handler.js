"use strict";
const Api = require("./apis");
const Mustache = require("mustache");
const request = require("request");
const pathToRegexp = require("path-to-regexp");
const url = require("url");
const _ = require("lodash");

class VisibleError extends Error {
  constructor(code, name) {
    super(name);
    this.code = code;
  }
  get visible() { return true; }
  toJSON() {
    return {error: this.message, code: this.code};
  }
}

function stripInitialSlash(data) {
  if (data[0] === '/') {
    return data.slice(1);
  } else {
    return data;
  }
}

// // strip '/api/v1' off the front of a path. Returns the path with a starting
// // slash
// function stripApiVersion(path) {
//   let out = path.match(/\/api\/.+\/(.+)/g);
//   if (out) {
//     return out[0];
//   } else {
//     return null;
//   }
// }

function asFullUrl(version, path) {
  return `/api/${version}/${stripInitialSlash(path)}`;
}

// find matching version and route when given req, res, and the selected api
function getMatchingVersionAndRoute(req, res, api) {
  let version;
  if (version = api.versions[req.params.version]) {
    // get the route that the user is referencing
    let keys = [], re, baseUrl;
    let route = version.routes.find(i => {
      // remove all the query variables and other stuff like that
      baseUrl = req._parsedOriginalUrl.pathname;
      // parse the path to look for param variables
      let fullUrl = asFullUrl(req.params.version, i.accept.url);
      re = pathToRegexp(fullUrl, keys);
      return i.accept.method === req.method && re.exec(baseUrl);
    });

    if (route && route.proxy.length) {
      // get url params, and remove the first match of the whole thing
      let unpairedParams = re.exec(baseUrl).slice(1);
      let params = _.zipObject(
        keys.map(i => i.name),
        unpairedParams
      );

      return {
        baseUrl,
        params,
        route,
      };
    } else {
      throw new VisibleError(404, "No such route, or route cannot handle the request");
    }
  } else {
    throw new VisibleError(400, "The api version specified isn't valid.");
  }
}

module.exports = function(req, res) {
  let version;

  Api.findAll()
  .then(apis => apis.find(api => api.slug === req.query.slug))

  // Make sure the returned api is valid
  .then(api => {
    if (api) {
      return api;
    } else {
      throw new VisibleError(400, `No such api with slug '${req.query.slug}'`);
    }
  })

  // get the route that matches the given request
  .then(getMatchingVersionAndRoute.bind(this, req, res))
  .then(data => {
    let route = data.route, baseUrl = data.baseUrl, params = data.params;
    // send the data to the client's system
    (function(data) {
      // take the proxy route and render each key
      let dataRender = Object.assign({}, data);
      for (let item in dataRender) {
        if (dataRender.hasOwnProperty(item)) {
          dataRender[item] = Mustache.render(
            dataRender[item],
            Object.assign({}, req, {
              params,
            })
          );
        }
      }

      // make the request
      let out = request(dataRender).on('error', err => {
        res.json({error: err.toString()});
      }).pipe(res);
    })(route.proxy[0]);
  })

  .catch(err => {
    if (err instanceof VisibleError) {
      res.status(err.code).json(err.toJSON());
    } else {
      throw err;
    }
  });
}
