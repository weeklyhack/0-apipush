import isJSON from "is-json";

// helper to send a response
export default function sendData(res, data) {
  if (isJSON(data)) {
    res.header("content-type", "application/json");
  }
  res.send(data);
}

