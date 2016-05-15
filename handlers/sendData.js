import isJSON from "is-json";
import Handlebars from "handlebars";

// helper to send a response
export default function sendData(res, data) {
  if (isJSON(data)) {
    res.header("content-type", "application/json");
  }
  res.send(data);
}

export function sendResponseIfApplicable(res, responses, data, stashApi) {
  return new Promise((resolve) => {
    for (let response in responses) {
      let test = responses[response];
      if (
        responses.hasOwnProperty(response) &&
        data.toString().indexOf(test.contains) >= 0
      ) {
        // The message was found, so render and send
        let rendered = Handlebars.compile(test.then)(stashApi);
        console.info("Proxying inbound message");
        sendData(res, rendered)
        resolve(true);
      }
    }
    resolve(false);
  });
}
