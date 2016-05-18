import VisibleError from "../visibleError";

import Handlebars from "handlebars";
import Websocket from "ws";
import isJSON from "is-json";
import {default as sendData, sendResponseIfApplicable} from "./sendData";

// Cases:
// Without responses
//   1. Request made, responze comes it, its sent out
//   2. Request made, no response, request timeout
// With responses
//   (all the without responses cases too)
//   3. Request made, response comes in, matchs a filter, its sent out
//   4. Request made, response comes in, doesn't match filters, request timeout
//   5. Request made, response comes in, matchs a filter, its sent out, another
//      response comes it, its ignored
export default function handleWebsocketsQuery(req, res, stashApi, routeData) {
  return new Promise((resolve, reject) => {
    let dataRender = Object.assign({}, routeData);
    let sendMessages = dataRender.send.map(body => Handlebars.compile(body)(stashApi));
    let requestSent = false;

    // create websocket and send data
    let ws = new Websocket(dataRender.url);
    ws.on('open', () => {
      sendMessages.forEach(message => ws.send(message));
    });

    // after a timeout, respond with a timeout error.
    let requestTimeout = setTimeout(function() {
      reject(
        new VisibleError(502, "No matching event was ever received in response to this request.")
      );
    }, process.env.MATCHING_EVENT_TIMEOUT || 1000);

    ws.on('message', (data) => {
      if (dataRender.responses) {
        if (!requestSent) {
          // parse the json data, if the data is json
          let parsedData = data;
          if (isJSON(data)) {
            parsedData = JSON.parse(data);
          }

          // assemble the stash data for the http request
          let websocketsStashApi = Object.assign({}, stashApi, {
            proxy: {
              data: parsedData,
            },
          });

          return sendResponseIfApplicable(res, dataRender.responses, data, websocketsStashApi).then(() => {
            requestSent = true;
            clearTimeout(requestTimeout);
          });
        }
        console.info("Skipping inbound websocket message", data, requestSent ? "(already fulfilled request)" : "(didn't match filters)");
      } else {
        // no preset responses? Just send the first thing we get.
        clearTimeout(requestTimeout);
        sendData(res, data);
      }
    });
  });
}
