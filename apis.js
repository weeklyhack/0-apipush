"use strict";
const Promise = require("bluebird");

module.exports = {
  findAll() {
    return Promise.resolve([
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
                  via: "http",
                  method: "GET",
                  url: "http://randomuser.me/api/{{query.user}}",
                }],
              }
            ],
          },
        },
      },
    ]);
  },
};
