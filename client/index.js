"use strict";
const request = require("request-promise");
const argv = require('minimist')(process.argv.slice(2));
const fs = require("fs");
const inquirer = require("inquirer-async").promptAsync;

const baseUrl = process.env.SERVER_URL || "http://127.0.0.1:8000";

import chalk from 'chalk';

import {getLoginCredentials, saveLoginCredentials} from './lib/auth';
import printHelpfulError from './lib/errors';
import log from './lib/log';

// read the api file
if (argv._.length) {
  let authCredentials;
  console.log(chalk.cyan(chalk.bold("Welcome!")));

  // get login credentials
  getLoginCredentials()
  .then(auth => {
    const apiData = JSON.parse(fs.readFileSync(argv._[0]).toString());
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
  }).then(data => {
    if (data.account) {
      data.account.newAccount && log(`Created new account: ${data.account.publishedBy}`);
      log(`Published by ${data.account.publishedBy}`);
    }
    console.log();
    log(`Api ${chalk.cyan(data.api.slug)} has been provisioned!`);
    log(`Check out your new api at ${chalk.yellow(data.routes.root)}`);
    log(`(and, get metadata information at ${chalk.yellow(data.routes.meta)})`);
  }).catch(printHelpfulError);
} else {
  console.error("Error: specify a api file as an argument.");
}
