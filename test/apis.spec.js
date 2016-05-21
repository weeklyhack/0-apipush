import apis from "../apis";
import assert from 'assert';
import {v4 as uuid} from "uuid";
import VisibleError from "../visibleError";
import Promise from 'bluebird';
import sinon from 'sinon';

let user1 = {
  email: "user@example.com",
  password: "foobar1",
  _id: uuid(),
};
let user2 = {
  email: "user2@example.com",
  password: "foobar2",
  _id: uuid(),
};
let api1 = {
  model: {
    "name": "My Cool API",
    "slug": "abc",
    "createdBy": user1._id,
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
      },
      "v2": {
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
  },
  slug: "abc",
};

describe("apis", function() {
  describe("create", function() {
    describe("with find and upsert both resolving", function() {
      beforeEach(() => {
        // the first find doesn't work, the second does
        sinon.stub(apis, "findWithSlug").resolves(api1.model);
        sinon.stub(apis, "upsertApi").resolves(api1); // correctly upsert
      });
      afterEach(() => {
        apis.findWithSlug.restore();
        apis.upsertApi.restore();
      });

      it("should work, inheriting schema from find query rather than the passed api", function() {
        let apiData = Object.assign({}, api1.model, {slug: undefined});
        return apis.create(apiData, user1).then(data => {
          assert.deepEqual(data.api.slug, api1.model.slug);
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
        return apis.create(api1.model, user1).then(data => {
          assert.deepEqual(data, {api: api1.model});
        });
      });
      it("should create a custom slug if one doesn't exist", function() {
        let apiData = Object.assign({}, api1.model, {slug: undefined});
        return apis.create(apiData, user1).then(data => {
          assert.deepEqual(typeof data.api.slug, "string");
        });
      });
      it("should not let invalid schema's through", function() {
        let apiData = Object.assign({}, api1.model, {versions: "invalid schema"});
        return apis.create(apiData, user1).catch(err => {
          assert.deepEqual(err.message, "Schema Validation Errors: instance.versions is not of a type(s) object");
        });
      });
    });
    describe("with first find not returning anything", function() {
      beforeEach(() => {
        // the first find doesn't work, the second does
        let findStub = sinon.stub(apis, "findWithSlug");
        findStub.onCall(0).resolves(null);
        findStub.onCall(1).resolves(api1.model);
        sinon.stub(apis, "upsertApi").resolves(api1); // correctly upsert
      });
      afterEach(() => {
        apis.findWithSlug.restore();
        apis.upsertApi.restore();
      });

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
    });
    describe("with upsert error", function() {
      beforeEach(() => {
        sinon.stub(apis, "findWithSlug").resolves(null);
        sinon.stub(apis, "upsertApi").rejects("error from upsert"); // fail to upsert
      });
      afterEach(() => {
        apis.findWithSlug.restore();
        apis.upsertApi.restore();
      });

      it("should handle error from upsert", function() {
        let apiData = Object.assign({}, api1.model, {slug: undefined});
        return apis.create(apiData, user1).catch(err => {
          assert.deepEqual(err.message, "error from upsert");
        });
      });
    });
    describe("with find error", function() {
      beforeEach(() => {
        sinon.stub(apis, "findWithSlug").rejects("error from find");
        sinon.stub(apis, "upsertApi").resolves(null);
      });
      afterEach(() => {
        apis.findWithSlug.restore();
        apis.upsertApi.restore();
      });

      it("should handle error from upsert", function() {
        let apiData = Object.assign({}, api1.model, {slug: undefined});
        return apis.create(apiData, user1).catch(err => {
          assert.deepEqual(err.message, "error from find");
        });
      });
    });
  });

  describe("findWithSlug", function() {
    describe("with findOne resolving an api", function() {
      beforeEach(() => {
        sinon.stub(apis.ApiModel, "findOne").resolves(api1);
      });
      afterEach(() => {
        apis.ApiModel.findOne.restore();
      });

      it("should resolve when searching for an api", function() {
        return apis.findWithSlug(api1.slug).then(data => {
          assert.deepEqual(data, api1.model);
        });
      });
      it("should resolve null on falsey slug", function() {
        return apis.findWithSlug(false).then(data => {
          assert.deepEqual(data, null);
        });
      });
    });
    describe("with findOne resolving null", function() {
      beforeEach(() => {
        sinon.stub(apis.ApiModel, "findOne").resolves(null);
      });
      afterEach(() => {
        apis.ApiModel.findOne.restore();
      });

      it("should resolve when searching for an api", function() {
        return apis.findWithSlug("bogus").then(data => {
          assert.deepEqual(data, null);
        });
      });
    });
    describe("with findOne reject", function() {
      beforeEach(() => {
        sinon.stub(apis.ApiModel, "findOne").rejects("error");
      });
      afterEach(() => {
        apis.ApiModel.findOne.restore();
      });

      it("should handle errors", function() {
        return apis.findWithSlug(api1.slug).catch(error => {
          assert.deepEqual(error.message, "error");
        });
      });
    });
  });
});
