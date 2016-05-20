import Handlebars from "handlebars";
import request from "request";
import isJSON from "is-json";
import isXML from "is-xml";

import parseHeaders from "../parseHeaders";
import {default as sendData, sendResponseIfApplicable} from "./sendData";

export default function handleHttpQuery(req, res, stashApi, routeData) {
  // take the proxy route and render each key
  let dataRender = Object.assign({}, routeData);
  for (let item in dataRender) {
    if (dataRender.hasOwnProperty(item) && typeof dataRender[item] === "string") {
      dataRender[item] = Handlebars.compile(dataRender[item])(stashApi);
    }

    // for headers, make sure to split on `\n`s
    if (item === "headers") {
      dataRender.headers = parseHeaders(dataRender.headers, stashApi);
    }
  }

  // send the response
  if (dataRender.responses) {
    request(dataRender, (err, resp, body) => {
      if (err) {
        res.json({error: err.toString()});
      } else {
        // parse the json data, if the data is json
        let parsedBody = body;
        if (isJSON(body)) {
          parsedBody = JSON.parse(body);

        // label xml data ax xml for later
        } else if (isXML(body)) {
          parsedBody = {
            _ishtml: true,
            data: body,
          };
        }

        // assemble the stash data for the http request
        let httpStashApi = Object.assign({}, stashApi, {
          proxy: {
            body: parsedBody,
          },
        });

        return sendResponseIfApplicable(res, dataRender.responses, body, httpStashApi).then(success => {
          if (!success) {
            throw new VisibleError(502, "No matching event was ever received in response to this request.")
          }
        });
      }
    });
  } else {
    // no preset responses? Just send what we get.
    request(dataRender).on('error', err => {
      res.json({error: err.toString()});
    }).pipe(res);
  }
}
