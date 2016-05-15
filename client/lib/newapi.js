import {promptAsync as inquirer} from "inquirer-async";
import log from './log';
import path from 'path';
import fs from 'fs';

export default function createNewApi(filename) {
  return inquirer([
    {
      name: "name",
      message: "Name of service",
      required: true,
    },
    {
      name: "slug",
      default: undefined,
      message: "Machine-readable slug for this api",
    },
  ]).then(answers => {
    let newApi = JSON.stringify({
      name: answers.name,
      versions: {
        v1: {
          routes: [
            {
              accept: {
                method: "GET",
                url: "/",
              },
              proxy: {
                via: "static",
                body: "Hello {{query.name}}",
              },
            }
          ]
        },
      },
    }, null, 2);

    // add slug, if possible
    if (answers.slug) {
      newApi.slug = answers.slug;
    }

    fs.writeFile(
      path.join(process.cwd(), filename)
    , newApi, (err) => {
      if (err) {
        throw err;
      } else {
        log(`Created new api ${filename}!`);
      }
    });
  })
};
