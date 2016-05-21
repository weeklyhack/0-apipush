import users from "../users";
import assert from 'assert';
import {v4 as uuid} from "uuid";
import VisibleError from "../visibleError";
import Promise from 'bluebird';
import sinon from 'sinon';

let user1 = {
  email: "user@example.com",
  passwordHash: "$2a$10$hhzhSaFv.WtN7WW5utT3VuJ.k.lrSqwuqoFtdA6NF4L0MVmH3u1.u",
  passwordSalt: "salt", // password is "password"
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

describe.only("users", function() {
  describe("getByEmailPassword", function() {
    describe("with find resolving a user", function() {
      beforeEach(() => {
        sinon.stub(users.UserModel, "findOne").resolves(user1);
      });
      afterEach(() => {
        users.UserModel.findOne.restore();
      });

      it("should work", function() {
        return users.getByEmailPassword("user@example.com", "password").then(data => {
          assert.deepEqual(data, user1);
        });
      });
      it("should not work with invalid password", function() {
        return users.getByEmailPassword("user@example.com", "bad password").then(data => {
          assert.deepEqual(data, false);
        });
      });
    });
    describe("with find resolving null", function() {
      beforeEach(() => {
        sinon.stub(users.UserModel, "findOne").resolves(null);
      });
      afterEach(() => {
        users.UserModel.findOne.restore();
      });

      it("should return null with bad email", function() {
        return users.getByEmailPassword("bogus@example.com", "password").then(data => {
          assert.deepEqual(data, null);
        });
      });
    });
    describe("with find rejecting", function() {
      beforeEach(() => {
        sinon.stub(users.UserModel, "findOne").rejects("An Error");
      });
      afterEach(() => {
        users.UserModel.findOne.restore();
      });

      it("should pass other errors through", function() {
        return users.getByEmailPassword("bogus@example.com", "password").catch(data => {
          assert.deepEqual(data.message, "An Error");
        });
      });
    });
  });

  describe("createAccount", function() {
    describe("with a resolved user", function() {
      beforeEach(() => {
        sinon.stub(users, "getByEmailPassword").resolves(user1);
      });
      afterEach(() => {
        users.getByEmailPassword.restore();
      });

      it("should not let users with the same email be created", function() {
        return users.createAccount("user@example.com", "password").catch(error => {
          assert.deepEqual(error.message, "This email is already associated with an account.");
        });
      });
    });
  });
});
