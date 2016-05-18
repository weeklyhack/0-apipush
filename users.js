import Promise from 'bluebird';
import {v4 as uuid} from 'uuid';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt-nodejs';
import VisibleError from './visibleError';

const UserModel = mongoose.model('User', {
  email: String,
  passwordHash: String,
  passwordSalt: String,
});

function getByEmailPassword(email, password) {
  return new Promise((resolve, reject) => {
    UserModel.findOne({email}, (err, user) => {
      if (err) {
        reject(err);
      } else if (user) {
        // does the password match?
        let toHash = `${user.passwordSalt}${password}`;
        bcrypt.compare(user.passwordHash, toHash, (err, hash) => {
          if (err) {
            reject(err);
          } else if (hash) {
            resolve(user); // all looks good
          } else {
            resolve(null); // passowrd didn't match
          }
        })
      } else {
        // no user
        resolve(null);
      }
    });
  });
}

function createAccount(email, password) {
  return getByEmailPassword(email, password)
  .then(user => {
    if (user === null) {
      let salt = uuid();

      // create the user
      return new Promise((resolve, reject) => {
        bcrypt.hash(`${salt}${password}`, "", () => null, (err, hash) => {
          if (err) {
            reject(err);
          } else {
            new UserModel({
              email,
              passwordHash: hash,
              passwordSalt: salt,
            }).save(() => {
              resolve(
                Object.assign({}, user, {
                _newuser: true,
                })
              );
            })
          }
        });
      });
    } else {
      throw new VisibleError(401, "This email is already associated with an account.");
    }
  })
}
// createAccount("ryan@rgaus.net", "key")

export default {getByEmailPassword, createAccount};
