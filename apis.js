"use strict";
const Promise = require("bluebird");
import VisibleError from "./visibleError";
import {v4 as uuid} from "uuid";
import randomWords from "random-words";
import validate from "./validator";
import _ from "lodash";

let data = [
  {
    name: "My Cool API",
    slug: "coolapi",
    desc: "Doing coolness since a while ago.",
    createdBy: "1",
    icon: "http://placehold.it/300x300",
    versions: {
      v1: {
        routes: [
          {
            id: "beb18f57-217d-481f-a127-ead22feeca41",
            accept: {
              method: "GET",
              url: "/devices",
            },
            proxy: {
              // {
              //   method: "GET",
              //   url: "http://scooterlabs.com/echo?get=devices",
              // }
              id: "376882b1-f0e7-4393-886d-2aa93d357ff7",
              via: "websockets",
              url: "ws://echo.websocket.org",
              send: [
                `{"type": "UPDATE", "content": "{{query.value}}"}`,
              ],
              responses: {
                success: {
                  contains: "success",
                  then: `{"response": true}`,
                },
                fail: {
                  contains: "fail",
                  then: `{"response": false}`,
                },
              },
            }
          },
          {
            id: "de9147c5-6290-4fec-9cbb-9edcf3235669",
            accept: {
              method: "GET",
              url: "/devices/:id",
            },
            proxy: {
              id: "75d39208-cb16-413f-890f-b85a8a87aa7d",
              via: "http",
              method: "POST",
              url: "http://scooterlabs.com/echo?q={{params.id}}",
              headers: "Test: {{params.id}}",
              body: "abc",
            },
          },
          {
            id: "21e17c70-5e57-4acb-a19e-eb9a807f8290",
            accept: {
              method: "GET",
              url: "/user/:uid",
            },
            proxy: {
              id: "0291ee49-685e-4e76-8eb4-d50a844d0336",
              via: "http",
              method: "GET",
              url: "http://randomuser.me/api/{{query.user}}",
              body: "",
              headers: "",
            },
          }
        ],
      },
    },
  },
];

function getSlugVersion(slug, version) {
  let slugData = data.find(i => i.slug === slug);
  if (slugData) {
    return slugData.versions[version];
  } else {
    return false;
  }
}

// assign each api and each route an id. Also, give the api a secret.
function injectIds(api) {
  if (api) {
    if (api.versions && _.isPlainObject(api.versions)) {
      for (let version in api.versions) {
        if (api.versions.hasOwnProperty(version)) {
          let v = api.versions[version];
          if (v && v.routes && Array.isArray(v.routes)) {
            v.routes.forEach(route => {
              if (route) {
                route.id = uuid();
                if (route.proxy && Array.isArray(route.proxy)) {
                  route.proxy.forEach(proxy => {
                    proxy.id = uuid();
                  });
                }
              }
            });
          }
        }
      }
    }

    // give the api an id, too
    api.id = uuid();

    // also, add a secret that allows modifications later
    api.secret = uuid();
    return api;
  } else {
    return null;
  }
}



function findAll() {
  return Promise.resolve(data);
}

function findWithSlug(slug) {
  return Promise.resolve(data.find(i => i.slug === slug));
}

function create(api, user) {
  if (api && _.isPlainObject(api)) {
    // does an api already exist with this slug?
    return findWithSlug(api.slug)
    .then(match => {
      // no slug? make one up
      if (typeof api.slug === "undefined") {
        if (match) {
          api.slug = match.slug;
        } else {
          api.slug = randomWords(process.env.SLUG_WORD_LENGTH || 3).join("-");
        }
      }
      let isUpdate = match && user.id === match.createdBy;

      // if the api is being updated or a new one is being created
      if (isUpdate || !match) {
        // create the api
        api = injectIds(api);
        api.createdBy = user.id;

        // validate the api to make sure it matches our expectations
        let validation = validate(api);
        if (validation.errors.length === 0) {
          data.push(api);
          return api;
        } else {
          throw new VisibleError(400, `Schema Validation Errors: ${validation.errors.toString()}`);
        }
      } else {
        throw new VisibleError(403, `The slug ${api.slug} is in use by another user.`);
      }
    });
  } else {
    throw new VisibleError(400, "Api isn't defined.");
  }
};

export default {findAll, findWithSlug, create};
