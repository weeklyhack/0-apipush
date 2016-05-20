import Promise from 'bluebird';
import {promptAsync as inquirer} from 'inquirer-async';
import dotfun from 'dotfun';
import log from './log';
const dotfile = dotfun(".pushsecret");
dotfile.set("account", null)

export function askForLoginCredentialsFromUser(existingCredentials={}) {
  console.log("Please login or create an account by entering below an email and a password:");
  return inquirer([
    {
      type: "input",
      name: "email",
      message: "Email Address",
      when: () => !existingCredentials.email,
    },
    {
      type: "password",
      name: "password",
      message: (answers) => `Password for ${existingCredentials.email || answers.email}`,
      when: () => !existingCredentials.password,
    },
    // {
    //   type: "list",
    //   name: "savePassword",
    //   choices: ["No (more secure)", "Yes"],
    //   message: "Save Password?",
    //   when: () => !existingCredentials.password,
    // },
  ]);
}

export function getLoginCredentials(api) {
  // fetch login credentials from local system
  let apiConfig = dotfile.get("account") || {};
  let auth = {email: apiConfig.email, password: apiConfig.password};

  // if they don't exist, then create some new credentials.
  if (!auth.email || !auth.password) {
    return askForLoginCredentialsFromUser(auth)
    .then(({email, password, savePassword}) => {
      // append any new login information
      auth.email = auth.email || email;
      auth.password = auth.password || password;
      auth.savePassword = auth.password || savePassword.indexOf('Yes') !== -1;

      // save the credentials to a file
      return saveLoginCredentials(auth, api);
    });
  } else {
    // return the stored credentials and save the credentials to a file
    return Promise.resolve(auth);
  }
}

// write the data to a local dotfile for later access
export function saveLoginCredentials({email, password, savePassword}, api) {
  let settings = {email};

  // only save the password if prompted
  if (savePassword) {
    settings.password = password;
  }

  dotfile.set("account", settings);
  dotfile.set("api", api);
  return {email, password, savePassword};
}

export function logOut() {
  dotfile.set("account", null);
  console.log("Logged out.");
}
