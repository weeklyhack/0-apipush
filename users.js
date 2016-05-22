import Promise from 'bluebird';
import {v4 as uuid} from 'uuid';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt-as-promised';
import VisibleError from './visibleError';

const UserModel = mongoose.model('User', {
  email: String,
  passwordHash: String,
  passwordSalt: String,
});

function getByEmailPassword(email, password) {
  let globalUser;
  return UserModel.findOne({email})
  .then(user => {
    if (user) {
      globalUser = user;
      // does the password match?
      return bcrypt.compare(`${password}${user.passwordSalt}`, user.passwordHash);
    } else {
      return null; // no user
    }
  }).then(hashValid => {
    if (hashValid) {
      return globalUser;
    } else {
      return null;
    }
  }).catch(error => {
    // catch password mismatch errors
    if (error.message === "invalid") {
      return false;
    } else {
      throw error;
    }
  });
}

function createAccount(email, password) {
  let salt = uuid();
  return exports.default.getByEmailPassword(email, password)
  .then(user => {
    if (user === null) {

      // create the user
      return bcrypt.hash(`${password}${salt}`, 10);
    } else {
      throw new VisibleError(401, "This email is already associated with an account.");
    }
  }).then(hash => {
    if (hash) {
      return new UserModel({
        email,
        passwordHash: hash,
        passwordSalt: salt
      }).save().then((user) => {
        return Object.assign({}, user._doc, { _newuser: true });
      });
    } else {
      return false;
    }
  });
}

export default {getByEmailPassword, createAccount, UserModel};
