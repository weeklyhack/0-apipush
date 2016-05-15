import apis from "../apis";
import assert from 'assert';
import {v4 as uuid} from "uuid";
import VisibleError from "../visibleError";
import Promise from 'bluebird';

let user1 = {
  email: "user@example.com",
  password: "foobar1",
  id: uuid(),
};
let user2 = {
  email: "user2@example.com",
  password: "foobar2",
  id: uuid(),
};

describe("apis", function() {
  describe("create", function() {
    it("should not create an api with the same slug but two users twice", function() {
      return apis.create({
        "name": "My Cool API",
        "slug": "abc",
        "versions": {
          "v1": {
            "routes": [{
              "accept": {
                "method": "GET",
                "url": "/data"
              },
              "proxy": {
                "via": "static",
                "body": "hello world!",
                "headers": "Custom-header: {{query.abc}}"
              }
            }]
          }
        },
      }, user1).then(() => {
        return apis.create({
          "name": "My Cool API",
          "slug": "abc",
          "versions": {
            "v1": {
              "routes": [{
                "accept": {
                  "method": "GET",
                  "url": "/data"
                },
                "proxy": {
                  "via": "static",
                  "body": "hello world!",
                  "headers": "Custom-header: {{query.abc}}"
                }
              }]
            }
          },
        }, user2);
      }).catch(err => {
        assert.deepEqual(err.message, `The slug abc is in use by another user.`);
      });
    });
    it("should not create an api with a bad body", function() {
      return apis.create({}, user1).catch(err => {
        assert.deepEqual(err.message, `Schema Validation Errors: instance requires property "name"`);
      });
    });
    it("should not create an api with a bad non-object body", function() {
      return new Promise(() => {
        return apis.create(null, user1);
      }).catch(err => {
        assert.deepEqual(err.message, `Api isn't defined.`);
      });
    });
    it("should work", function() {
      let apiData = {
        "name": "My Cool API",
        "slug": "abc",
        "versions": {
          "v1": {
            "routes": [{
              "accept": {
                "method": "GET",
                "url": "/data"
              },
              "proxy": {
                "via": "static",
                "body": "hello world!",
                "headers": "Custom-header: {{query.abc}}"
              }
            }]
          }
        },
      };

      return apis.create(apiData, user1).then(data => {
        assert.deepEqual(data, apiData);
      });
    });
    it("should create a custom slug if one doesn't exist", function() {
      let apiData = {
        "name": "My Cool API",
        // no slug
        "versions": {
          "v1": {
            "routes": [{
              "accept": {
                "method": "GET",
                "url": "/data"
              },
              "proxy": {
                "via": "static",
                "body": "hello world!",
                "headers": "Custom-header: {{query.abc}}"
              }
            }]
          }
        },
      };

      return apis.create(apiData, user1).then(data => {
        assert.deepEqual(typeof data.slug, "string");
      });
    });
  });
});
