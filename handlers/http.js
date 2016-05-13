import Mustache from "mustache";
import request from "request";

import parseHeaders from "../parseHeaders";

export default function handleHttpQuery(req, res, stashApi, routeData) {
  // take the proxy route and render each key
  let dataRender = Object.assign({}, routeData);
  for (let item in dataRender) {
    if (dataRender.hasOwnProperty(item)) {
      dataRender[item] = Mustache.render(dataRender[item], stashApi);
    }

    // for headers, make sure to split on `\n`s
    if (item === "headers") {
      dataRender.headers = parseHeaders(dataRender.headers);
    }
  }

  // make the request
  let out = request(dataRender).on('error', err => {
    res.json({error: err.toString()});
  }).pipe(res);
}
