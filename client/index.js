"use strict";
const request = require("request-promise");
const argv = require('minimist')(process.argv.slice(2));
const fs = require("fs");
const dotfile = require("dotfun")(".pushsecret");

const baseUrl = process.env.SERVER_URL || "http://127.0.0.1:8000";

function log(data) {
  console.log("...", data);
}

// read the api file
if (argv._.length) {
  const apiData = JSON.parse(fs.readFileSync(argv._[0]).toString());
  log(`Loaded api docs from ${argv._[0]}`);

  request({
    method: "POST",
    url: `${baseUrl}/api/_create.json`,
    json: {
      data: apiData,
      options: argv,
    },
  }).then(data => {
    // write the secret locally 
    dotfile.set(data.api.slug, {secret: data.api.secret});

    log(`Provisioned new api ${data.api.slug}!`);
    log(`Check out your new api at ${data.routes.root}`);
    log(`(and, get metadata information at ${data.routes.meta})`);
  }).catch(err => {
    throw err;
  });
} else {
  console.error("Error: specify a api file as an argument.");
}
