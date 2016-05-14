import {Validator} from "jsonschema";
import urlRegex from "url-regex";

Validator.prototype.customFormats.url = function url(input) {
  return urlRegex({exact: true}).test(input);
}

var v = new Validator();

let httpMethodTypes = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

let proxyHttpSchema = {
  type: "object",
  properties: {
    via: {type: {enum: ["http"]}},
    url: { type: "string", format: "url" },
    method: {type: {enum: httpMethodTypes}},
    headers: {type: "string"},
    body: {type: "string"},
    id: {type: "string"},
  },
  required: ["id", "via", "url", "method", "headers", "body"],
};

let proxyWebsocketsSchema = {
  type: "object",
  properties: {
    via: {type: {enum: ["websockets"]}},
    url: { type: "string", format: "url" },
    id: {type: "string"},
    send: {
      type: "array",
      items: { type: "string" },
    },
    responses: {
      type: "object",
      patternProperties: {
        "^[a-zA-Z0-9_]+$": {
          type: "object",
          properties: {
            contains: {type: "string"},
            then: {type: "string"},
          },
          required: ["contains", "then"],
        },
      },
    },
  },
  required: ["id", "via", "url", "send", "responses"],
};

let schema = {
  type: "object",
  properties: {
    lines: {
      type: "array",
      items: {"type": "string"}
    },
    name: {type: "string"},
    slug: {type: "string"},
    desc: {type: "string"},
    icon: {type: "string"},
    secret: {type: "string"},
    versions: {
      type: "object",
      patternProperties: {
        "^[a-zA-Z0-9_]+$": {
          type: "object",
          properties: {
            routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  accept: {
                    type: "object",
                    properties: {
                      method: {type: {enum: httpMethodTypes}},
                      url: { type: "string" },
                    },
                  },
                  proxy: {
                    type: "array",
                    items: {
                      type: "object",
                      oneOf: [proxyHttpSchema, proxyWebsocketsSchema],
                    },
                  },
                },
                required: ["id", "accept", "proxy"],
              },
            },
            required: ["routes"],
          },
        },
      },
    },
  },
  required: ["name", "slug", "id", "secret"],
};

export default function validate(instance) {
  return v.validate(instance, schema);
};
