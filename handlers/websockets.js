import Mustache from "mustache";
import Websocket from "ws";
import isJSON from "is-json";

export default function handleWebsocketsQuery(req, res, stashApi, routeData) {
  let dataRender = Object.assign({}, routeData);
  let sendMessages = dataRender.send.map(body => Mustache.render(body, stashApi));

  // create websocket and send data
  let ws = new Websocket(dataRender.url);
  ws.on('open', () => {
    sendMessages.forEach(message => ws.send(message));
  });

  ws.on('message', (data) => {
    // if json, sent the corrent headers
    if (isJSON(data)) {
      res.header("content-type", "application/json");
    }

    res.send(data);
  });
}
