import Promise from 'bluebird';
import {v4 as uuid} from 'uuid';
import VisibleError from './visibleError';

let data = [
  {
    email: "ryan@rgaus.net",
    id: uuid(),
    password: "key",
  },
];

function getByEmailPassword(email, password) {
  let user = data.find(i => i.email === email && i.password === password)
  return Promise.resolve(user || null);
}

function createAccount(email, password) {
  return getByEmailPassword(email, password)
  .then(user => {
    if (user === null) {
      let user = {
        email, password,
        id: uuid(),
      };
      data.push(user);
      return Object.assign({}, user, {
        _newuser: true,
      });
    } else {
      throw new VisibleError(401, "This email is already associated with an account.");
    }
  })
}

export default {getByEmailPassword, createAccount};
