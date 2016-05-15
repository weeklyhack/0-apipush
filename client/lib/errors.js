import chalk from 'chalk';
const possibleErrors = [
  [/^The slug (.+) is in use by another user.$/g, ([total, slug]) => {
    return `The slug you are pushing to (${slug}) already is in use by someone else. Slug names are first come first serve, so please pick another.`
  }],
  [/^Schema Validation Error/g, () => {
    return `The format of the api you are pushing wasn't what we expected. Ensure that the file is valid JSON, and correct any errors in the file format.`
  }],
  [/^Api isn't defined.$/, () => {
    return `The api data wasn't passed to the server - ensure that the api file you're refererencing exists and has contenta that are JSON parseable.`;
  }],
  [/The slug (.*) hasn't been used - create an api instead./g, ([total, slug]) => {
    return `The passed slug references an api that hasn't yet been defined and cannot be updated. Try creating an api first.`
  }]
];

export default function logError(err) {
  if (err instanceof Error) {
    let {statusCode, error} = err;
    if (error && error.error) {

      // look through all of the error regexes to find a matching one.
      let finalErrorExplaination = possibleErrors.reduce((acc, [regex, more]) => {
        if (acc) {
          return acc;
        } else {
          let match = regex.exec(error.error);
          return match ? more(match) : false;
        }
      }, null);

      // then, log it out
      console.error("|", chalk.red(error.error), "|");
      console.error(chalk.red(finalErrorExplaination || ''));
    } else {
      console.error(statusCode, error);
    }
  } else {
    console.error(err);
  }
}
