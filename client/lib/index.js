"use strict";
const request = require("request-promise");
const argv = require('minimist')(process.argv.slice(2));
const fs = require("fs");

const baseUrl = process.env.SERVER_URL || "http://apipush.rgaus.net:8001";

import chalk from 'chalk';
import isJSON from 'is-json';

import {getLoginCredentials, saveLoginCredentials} from './auth';
import printHelpfulError from './errors';
import log from './log';
import createNewApi from './newapi';

if (argv.init) {
  createNewApi(argv.init).catch(err => {
    throw err;
  });
} else if (argv._.length) {
  // push the specified api
  let authCredentials;
  console.log(chalk.cyan(chalk.bold("Welcome!")));

  // get login credentials
  getLoginCredentials()
  .then(auth => {
    let apiContents = fs.readFileSync(argv._[0]).toString();
    if (apiContents && isJSON(apiContents)) {
      let apiData = JSON.parse(apiContents);
      log(`Loaded api docs from ${argv._[0]}`);
      authCredentials = auth;

      return request({
        method: "POST",
        url: `${baseUrl}/api/_push.json`,
        json: {
          data: apiData,
          options: argv,
        },
        auth: {
          username: auth.email,
          password: auth.password,
        },
      });
    }
  }).then(data => {
    if (data.account) {
      data.account.newAccount && log(`Created new account: ${data.account.publishedBy}`);
      log(`Published by ${data.account.publishedBy}`);
    }
    console.log();
    log(`Api ${chalk.cyan(data.api.slug)} has been provisioned!`);
    log(`Check out your new api at ${chalk.yellow(data.routes.example || data.routes.root)}`);
    log(`(and, get metadata information at ${chalk.yellow(data.routes.meta)})`);
  }).catch(printHelpfulError);
} else {
  console.error("Error: specify a api file as an argument.");
}
