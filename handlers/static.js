import Mustache from "mustache";
import Promise from "bluebird";

import sendData from "./sendData";
import parseHeaders from "../parseHeaders";

export default function handleStaticQuery(req, res, stashApi, routeData) {
  return new Promise((resolve, reject) => {
    if (routeData.body) {
      let dataRender = Mustache.render(routeData.body, stashApi);

      // if headers were specified, send them too
      if (routeData.headers) {
        let headers = parseHeaders(routeData.headers);
        Object.keys(headers).forEach(header => {
          res.header(header, headers[header]);
        });
      }

      sendData(res, dataRender);
    } else {
      res.status(500).send({code: 500, error: "This static response wasn't given data."})
    }
  });
}
