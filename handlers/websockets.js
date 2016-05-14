import VisibleError from "../visibleError";

import Mustache from "mustache";
import Websocket from "ws";
import sendData from "./sendData";

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
    let sendMessages = dataRender.send.map(body => Mustache.render(body, stashApi));
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
        for (let response in dataRender.responses) {
          if (
            !requestSent &&
            dataRender.responses.hasOwnProperty(response) &&
            data.toString().indexOf(dataRender.responses[response].contains) >= 0
          ) {
            // The message was found, so render and send
            let rendered = Mustache.render(dataRender.responses[response].then, stashApi);
            console.info("Proxying inbound websocket message", data);
            clearTimeout(requestTimeout);
            requestSent = true;
            sendData(res, rendered)
            resolve();
          }
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
