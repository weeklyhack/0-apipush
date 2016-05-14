"use strict";
const Promise = require("bluebird");
import VisibleError from "./visibleError";

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
            proxy: [
              // {
              //   method: "GET",
              //   url: "http://scooterlabs.com/echo?get=devices",
              // }
              {
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
            ],
          },
          {
            id: "de9147c5-6290-4fec-9cbb-9edcf3235669",
            accept: {
              method: "GET",
              url: "/devices/:id",
            },
            proxy: [{
              id: "75d39208-cb16-413f-890f-b85a8a87aa7d",
              via: "http",
              method: "POST",
              url: "http://scooterlabs.com/echo?q={{params.id}}",
              headers: "Test: {{params.id}}",
              body: "abc",
            }],
          },
          {
            id: "21e17c70-5e57-4acb-a19e-eb9a807f8290",
            accept: {
              method: "GET",
              url: "/user/:uid",
            },
            proxy: [{
              id: "0291ee49-685e-4e76-8eb4-d50a844d0336",
              via: "http",
              method: "GET",
              url: "http://randomuser.me/api/{{query.user}}",
            }],
          }
        ],
      },
    },
  },
];

module.exports = {
  findAll() {
    return Promise.resolve(data);
  },
  updateRouteProxy(slug, version, route, index, proxy) {
    let slugData = data.find(i => i.slug === slug);
    if (slugData) {
      let versionData = slugData.versions[version];
      let routeData = versionData.routes.find(i => i.id === route);

      // update route data
      routeData.proxy[index] = proxy;
      return Promise.resolve(routeData);
    } else {
      return Promise.reject(`No such slug ${slug}`);
    }
  },
};
