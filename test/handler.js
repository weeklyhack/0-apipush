import {handleApiRequest, getApiInformation, createApi} from "../handler";
import Api from "../apis";
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
let api1_invalid_proxy = {
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
            "via": "bogus",
            "body": "hello world!",
            "headers": "Custom-header: {{query.abc}}"
          }
        }]
      },
    },
  },
  slug: "abc",
};

let api2 = {
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
            "via": "http",
            "method": "GET",
            "url": "http://google.com",
            "responses": {
              "success": {
                "contains": "Google",
                "then": "{\"success\": true, \"title\": \"{{jquery_text 'title'}}\"}"
              },
              "failure": {
                "contains": "",
                "then": "{\"success\": false, \"title\": null}"
              }
            }
          }
        }],
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
let api2_no_matching_event = {
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
            "via": "http",
            "method": "GET",
            "url": "http://google.com",
            "responses": {
              "success": {
                "contains": "I won't ever match because I am obscure.",
                "then": "{\"success\": true, \"title\": \"{{jquery_text 'title'}}\"}"
              },
            }
          }
        }],
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

function generateReq({method, path, slug, version, body, user}) {
  let url = `/${slug}/api/${version}${path}`;
  return {
    method,
    url,
    params: {
      slug,
      version,
    },
    _parsedOriginalUrl: {
      pathname: url,
    },
    body,
    user,
  };
}

describe("handleApiRequest", function() {
  it("should not work with versions that start with _", function(done) {
    let res = {
      send(data) {
        assert.deepEqual(data, {
          code: 500,
          error: "Versions that start with an underscore aren't permitted.",
        });
        done();
        return res;
      },
      status(code) {
        assert.equal(code, 500);
        return res;
      }
    };
    handleApiRequest({params: {version: "_version"}}, res);
  });

  describe("with a successfully resolving api (static)", function() {
    beforeEach(() => {
      sinon.stub(Api, "findWithSlug").resolves(api1.model);
    });
    afterEach(() => {
      Api.findWithSlug.restore();
    });

    it("should work fine", function(done) {
      let res = {
        send(data) {
          assert.deepEqual(data, "hello world!");
          done();
          return res;
        },
        status(code) {
          assert.equal(code, 200);
          return res;
        },
        header(name, value) {
          assert.deepEqual(name, "Custom-header");
          return res;
        },
      };
      handleApiRequest(generateReq({method: "GET", slug: "abc", version: "v1", path: "/data"}), res);
    });
    it("should not work with a bad version", function(done) {
      let res = {
        send(data) {
          assert.deepEqual(data, {
            error: "The api version specified isn't valid.",
            code: 400,
          });
          done();
          return res;
        },
        status(code) {
          assert.equal(code, 400);
          return res;
        },
      };
      res.json = res.send;
      handleApiRequest(generateReq({method: "GET", slug: "abc", version: "bad", path: "/data"}), res);
    });
    it("should not work with a bad route", function(done) {
      let res = {
        send(data) {
          assert.deepEqual(data, {
            error: "No such route, or route cannot handle the request",
            code: 404,
          });
          done();
          return res;
        },
        status(code) {
          assert.equal(code, 404);
          return res;
        },
      };
      res.json = res.send;
      handleApiRequest(generateReq({method: "GET", slug: "abc", version: "v1", path: "/bad-route"}), res);
    });
  });
  describe("with a successfully resolving api (http)", function() {
    beforeEach(() => {
      sinon.stub(Api, "findWithSlug").resolves(api2.model);
    });
    afterEach(() => {
      Api.findWithSlug.restore();
    });

    it("should work fine", function(done) {
      let res = {
        send(data) {
          assert.deepEqual(data, `{"success": true, "title": "Google"}`);
          done();
          return res;
        },
        status(code) {
          assert.equal(code, 200);
          return res;
        },
        header(name, value) {
          assert.equal(name, "content-type");
          assert.equal(value, "application/json");
          return res;
        },
      };
      handleApiRequest(generateReq({method: "GET", slug: "def", version: "v1", path: "/data"}), res);
    });
  });
  describe("with a non-successfully resolving api (http)", function() {
    beforeEach(() => {
      sinon.stub(Api, "findWithSlug").resolves(api2_no_matching_event.model);
    });
    afterEach(() => {
      Api.findWithSlug.restore();
    });

    it("should not work if no matching response is received", function(done) {
      let res = {
        send(data) {
          assert.deepEqual(data, {error: "Error: No matching event was ever received in response to this request."});
          done();
          return res;
        },
        status(code) {
          console.log(code)
          assert.equal(code, 502);
          return res;
        },
        header(name, value) {
          return res;
        },
      };
      res.json = res.send;
      handleApiRequest(generateReq({method: "GET", slug: "def", version: "v1", path: "/data"}), res);
    });
  });

  describe("with a successfully resolving api, but with a invalid proxy type", function() {
    beforeEach(() => {
      sinon.stub(Api, "findWithSlug").resolves(api1_invalid_proxy.model);
    });
    afterEach(() => {
      Api.findWithSlug.restore();
    });

    it("should not work with bad proxy type", function(done) {
      let res = {
        send(data) {
          assert.deepEqual(data, {
            error: "No such handler for request: bogus",
            code: 500,
          });
          done();
          return res;
        },
        status(code) {
          assert.equal(code, 500);
          return res;
        },
      };
      res.json = res.send;
      handleApiRequest(generateReq({method: "GET", slug: "abc", version: "v1", path: "/data"}), res);
    });
  });
  describe("with a un-successfully resolving api", function() {
    beforeEach(() => {
      sinon.stub(Api, "findWithSlug").resolves(null);
    });
    afterEach(() => {
      Api.findWithSlug.restore();
    });

    it("should not work with bad api", function(done) {
      let res = {
        send(data) {
          assert.deepEqual(data, {
            error: "No such api with slug 'abc'",
            code: 400,
          });
          done();
          return res;
        },
        status(code) {
          assert.equal(code, 400);
          return res;
        },
      };
      res.json = res.send;
      handleApiRequest(generateReq({method: "GET", slug: "abc", version: "v1", path: "/bad-route"}), res);
    });
  });
});

describe("getApiInformation", function() {
  describe("with a successful api find", function() {
    beforeEach(() => {
      let findSlug = sinon.stub(Api, "findWithSlug");
      findSlug.withArgs(api1.slug).resolves(api1.model);
      findSlug.withArgs().resolves(null);
    });
    afterEach(() => {
      Api.findWithSlug.restore();
    });

    it("should work with api1", function(done) {
      let res = {
        json(data) {
          assert.deepEqual(data, {
            name: "My Cool API",
            slug: "abc",
            versions: ["v1", "v2"],
            desc: undefined,
          });
          done();
          return res;
        },
      };
      getApiInformation(generateReq({method: "GET", slug: "abc", version: "v1", path: "/data"}), res);
    });
    it("should not work with a bad slug", function(done) {
      let res = {
        json(data) {
          assert.deepEqual(data, {
            error: "No such api with slug 'bad slug'",
            code: 400,
          });
          done();
          return res;
        },
        status(code) {
          assert.equal(code, 400);
          return res;
        },
      };
      getApiInformation(generateReq({method: "GET", slug: "bad slug", version: "v1", path: "/"}), res);
    });
  });
  describe("with findWithSlug throwing an error", function() {
    beforeEach(() => {
      sinon.stub(Api, "findWithSlug").rejects("An Error from findWithSlug");
    });
    afterEach(() => {
      Api.findWithSlug.restore();
    });

    it("should not work with api1 when erros are thrown", function(done) {
      let res = {
        json(data) {
          assert.deepEqual(data, {
            error: "An Error from findWithSlug",
            code: undefined,
          });
          done();
          return res;
        },
        status(code) {
          assert.equal(code, 500);
          return res;
        },
      };
      getApiInformation(generateReq({method: "GET", slug: "abc", version: "v1", path: "/data"}), res);
    });
  });
});

describe("createApi", function() {
  describe("with a successful api creation", function() {
    beforeEach(() => {
      sinon.stub(Api, "create").resolves({api: api1.model});
    });
    afterEach(() => {
      Api.create.restore();
    });

    it("should successfully create an api", function(done) {
      let res = {
        send(data) {
          assert.deepEqual(data.status, 200);
          assert.deepEqual(data.routes, {
            root: "http://apipush.apps.rgaus.net/abc/api/",
            example: "http://apipush.apps.rgaus.net/abc/api/v1",
            meta: "http://apipush.apps.rgaus.net/abc/api/_meta.json",
          });
          assert.deepEqual(data.account, {
            publishedBy: user1.email,
            newAccount: false,
          });
          done();
        },
      };
      createApi(generateReq({
        method: "GET",
        slug: "abc",
        version: "v1",
        path: "/data",
        body: {options: {}, data: api1.model},
        user: user1,
      }), res);
    });
    it("should successfully create an api, with a new user", function(done) {
      let user = Object.assign({}, user1, {_newuser: true});
      let res = {
        send(data) {
          assert.deepEqual(data.status, 200);
          assert.deepEqual(data.routes, {
            root: "http://apipush.apps.rgaus.net/abc/api/",
            example: "http://apipush.apps.rgaus.net/abc/api/v1",
            meta: "http://apipush.apps.rgaus.net/abc/api/_meta.json",
          });
          assert.deepEqual(data.account, {
            publishedBy: user.email,
            newAccount: true,
          });
          done();
        },
      };
      createApi(generateReq({
        method: "GET",
        slug: "abc",
        version: "v1",
        path: "/data",
        body: {options: {}, data: api1.model},
        user,
      }), res);
    });
    it("should not create an api with empty input params", function(done) {
      let res = {
        status(code) {
          assert.equal(code, 400);
          return res;
        },
        send(data) {
          assert.deepEqual(data, {
            error: "Invalid request format. Please include a data and options key."
          });
          done();
        },
      };
      createApi(generateReq({
        method: "GET",
        slug: "abc",
        version: "v1",
        path: "/data",
        body: {}, // empty body
        user: user1,
      }), res);
    });
    it("should not create an api with bad input params", function(done) {
      let res = {
        status(code) {
          assert.equal(code, 400);
          return res;
        },
        send(data) {
          assert.deepEqual(data, {
            error: "Invalid request format. Please include a data and options key."
          });
          done();
        },
      };
      createApi(generateReq({
        method: "GET",
        slug: "abc",
        version: "v1",
        path: "/data",
        body: {options: false, body: true}, // bad body
        user: user1,
      }), res);
    });
  });
  describe("with a failed api creation", function() {
    beforeEach(() => {
      sinon.stub(Api, "create").rejects("Thrown Error");
    });
    afterEach(() => {
      Api.create.restore();
    });

    it("should not create an api when errors happen", function(done) {
      let res = {
        status(code) {
          assert.equal(code, 500);
          return res;
        },
        send(data) {
          assert.deepEqual(data, {
            error: "Thrown Error",
            code: undefined,
          });
          done();
          return res;
        },
      };
      res.json = res.send;
      createApi(generateReq({
        method: "GET",
        slug: "abc",
        version: "v1",
        path: "/data",
        body: {options: {}, data: api1.model},
        user: user1,
      }), res);
    });
  });
});
