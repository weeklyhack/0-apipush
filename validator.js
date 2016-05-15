import {Validator} from "jsonschema";
import urlRegex from "url-regex";

Validator.prototype.customFormats.url = function url(input) {
  return urlRegex({exact: true}).test(input);
}

var v = new Validator();

let httpMethodTypes = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

let responsesSchema = {
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
};

let proxyHttpSchema = {
  id: "HTTPSchema",
  type: "object",
  properties: {
    via: {type: {enum: ["http"]}},
    url: { type: "string", format: "url" },
    method: {type: {enum: httpMethodTypes}},
    headers: {type: "string"},
    body: {type: "string"},
    responses: responsesSchema,
  },
  required: ["via", "url", "method"],
};

let proxyStaticSchema = {
  id: "StaticSchema",
  type: "object",
  properties: {
    via: {type: {enum: ["static"]}},
    headers: {type: "string"},
    body: {type: "string"},
  },
  required: ["via", "body"],
};

let proxyWebsocketsSchema = {
  id: "WebsocketsSchema",
  type: "object",
  properties: {
    via: {type: {enum: ["websockets"]}},
    url: { type: "string", format: "url" },
    send: {
      type: "array",
      items: { type: "string" },
    },
    responses: responsesSchema,
  },
  required: ["via", "url", "send", "responses"],
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
        "^[^_][a-zA-Z0-9]+$": {
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
                    type: "object",
                    oneOf: [proxyHttpSchema, proxyWebsocketsSchema, proxyStaticSchema],
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
