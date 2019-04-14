const chalk = require('chalk')

module.exports = {
  error: chalk.hex('#e0244c'),
  warning: chalk.keyword('orange'),
  success: chalk.green,
  info: chalk.blue,
  debug: chalk.hex('#522d80').bgBlack,
  other: chalk,
}
