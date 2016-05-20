"use strict";
const Promise = require("bluebird");
import VisibleError from "./visibleError";
import {v4 as uuid} from "uuid";
import randomWords from "random-words";
import validate from "./validator";
import _ from "lodash";
import mongoose from 'mongoose';

const ApiModel = mongoose.model('Api', {
  model: Object,
  slug: String,
});

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
  return ApiModel.find({});
}

function findWithSlug(slug) {
  if (slug) {
    return ApiModel.findOne({slug}).then(api => {
      if (api) {
        return api.model;
      } else {
        return null;
      }
    });
  } else {
    return Promise.resolve(null);
  }
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
      let isUpdate = match && user._id.toString() === match.createdBy.toString();

      // if the api is being updated or a new one is being created
      if (isUpdate || !match) {
        // create the api
        api = injectIds(api);
        api.createdBy = user._id;

        // validate the api to make sure it matches our expectations
        let validation = validate(api);
        if (validation.errors.length === 0) {
          // upsert the model
          return ApiModel.update({slug: api.slug}, {
            model: api,
            slug: api.slug,
          }, {upsert: true});
        } else {
          throw new VisibleError(400, `Schema Validation Errors: ${validation.errors.toString()}`);
        }
      } else {
        throw new VisibleError(403, `The slug ${api.slug} is in use by another user.`);
      }
    }).then(() => {
      return {api};
    });
  } else {
    throw new VisibleError(400, "Api isn't defined.");
  }
};

export default {findAll, findWithSlug, create};
