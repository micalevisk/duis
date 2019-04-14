const chalk = require('chalk');

Object.assign(chalk, {
  error: chalk.hex('#e0244c'),
  warning: chalk.keyword('orange'),
  success: chalk.green,
  info: chalk.blue,
  debug: chalk.hex('#522d80').bgBlack,
})

const miles = 18;
const calculateFeet = miles => miles * 5280;

console.log(chalk.error('aaaaaaaaaaa'))
console.log(chalk.warning('aaaaaaaaaaa'))
console.log(chalk.success('aaaaaaaaaaa'))
console.log(chalk.info('aaaaaaaaaaa'))
console.log(chalk.debug('aaaaaaaaaaa'))

console.log(
  chalk`
  There are {bold 5280 feet} in a mile.
  In {bold ${miles} miles}, there are {green.bold ${calculateFeet(miles)} feet}.
  `);
