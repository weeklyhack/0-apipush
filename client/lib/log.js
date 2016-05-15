import chalk from 'chalk';
export default function log(data) {
  console.log(chalk.green(chalk.bold("...")), data);
}
