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
  UserModel.findOne({email}).then(console.error.bind(console))
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
  });
}

function createAccount(email, password) {
  let globalUser, salt = uuid();
  return getByEmailPassword(email, password)
  .then(user => {
    if (user === null) {
      globalUser = user;

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
        passwordSalt: salt,
      }).save()
      .then(() => {
        return Object.assign({}, globalUser, { _newuser: true });
      });
    } else {
      return false;
    }
  });
}

export default {getByEmailPassword, createAccount};
