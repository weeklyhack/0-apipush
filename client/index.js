"use strict";
const request = require("request-promise");
const argv = require('minimist')(process.argv.slice(2));
const fs = require("fs");
const dotfile = require("dotfun")(".pushsecret");
const inquirer = require("inquirer-async").promptAsync;

const baseUrl = process.env.SERVER_URL || "http://127.0.0.1:8000";

function log(data) {
  console.log("...", data);
}

// read the api file
if (argv._.length) {
  const apiData = JSON.parse(fs.readFileSync(argv._[0]).toString());
  log(`Loaded api docs from ${argv._[0]}`);

  // fetch login credentials from local system
  let apiConfig = dotfile.get("api") || {};
  let authCredentials = {
    email: apiConfig.account,
    password: apiConfig.password,
  };
  log(`Before we push ${argv._[0]}, you'll need to login:`);

  // get login credentials
  inquirer([
    {
      type: "input",
      name: "email",
      message: "Email Address",
      when: () => !authCredentials.email,
    },
    {
      type: "password",
      name: "password",
      message: (answers) => `Password for ${authCredentials.email || answers.email}`,
      when: () => !authCredentials.password,
    },
    {
      type: "list",
      name: "savePassword",
      choices: ["No (more secure)", "Yes"],
      message: "Save Password?",
      when: () => !authCredentials.email && !authCredentials.password,
    },
  ]).then(auth => {
    log(`Loaded api docs from ${argv._[0]}`);

    // add any entered username / password to the correct place
    authCredentials.email = authCredentials.email || auth.email;
    authCredentials.password = authCredentials.password || auth.password;

    return request({
      method: "POST",
      url: `${baseUrl}/api/_create.json`,
      json: {
        data: apiData,
        options: argv,
      },
      auth: {
        username: authCredentials.email,
        password: authCredentials.password,
      },
    });
  }).then(data => {
    // write the data locally
    let settings = {
      api: data.api,
      account: authCredentials.email,
    };
    if (authCredentials.password || authCredentials.savePassword) {
      settings.password = authCredentials.password;
    }
    dotfile.set("api", settings);

    log(`Provisioned new api ${data.api.slug}!`);
    log(`Check out your new api at ${data.routes.root}`);
    log(`(and, get metadata information at ${data.routes.meta})`);
  }).catch(err => {
    console.error(err.message);
  });
} else {
  console.error("Error: specify a api file as an argument.");
}
