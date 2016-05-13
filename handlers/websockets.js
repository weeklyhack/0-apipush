import Mustache from "mustache";
import Websocket from "ws";

export default function handleWebsocketsQuery(req, res, stashApi, routeData) {
  let dataRender = Object.assign({}, routeData);
  let sendMessages = dataRender.send.map(body => Mustache.render(body, stashApi));

  // create websocket and send data
  let ws = new Websocket(dataRender.url);
  ws.on('open', () => {
    sendMessages.forEach(message => ws.send(message));
  });

  ws.on('message', (data) => {
    res.send(data);
  });
}
