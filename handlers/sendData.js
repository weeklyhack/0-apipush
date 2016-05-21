import isJSON from "is-json";
import Handlebars from "handlebars";
import cheerio from "cheerio";

// helper to send a response
export default function sendData(res, data) {
  if (isJSON(data)) {
    res.header("content-type", "application/json");
  }
  res.status(200).send(data);
}

export function sendResponseIfApplicable(res, responses, data, stashApi) {
  return new Promise((resolve) => {
    for (let response in responses) {
      let test = responses[response];
      if (
        responses.hasOwnProperty(response) &&
        data.toString().indexOf(test.contains) >= 0
      ) {

        // jquery helper for xml
        if (stashApi.proxy.body._ishtml) {
          let jQuery = cheerio.load(stashApi.proxy.body.data);

          // register a jquery helper to fetch data from inside of xml, and get
          // the contents of an imput
          Handlebars.registerHelper('jquery_text', function(context) {
            return jQuery(context).text().trim().split('\n').join('');
          });
          Handlebars.registerHelper('jquery_val', function(context) {
            return jQuery(context).val().trim().split('\n').join('');
          });
        }

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
