const chalk = require('chalk')

Object.assign(chalk.__proto__, {
  primary: chalk.hex('#007bff'),
  secondary: chalk.hex('#6c757d'),
  success: chalk.hex('#28a745'),
  danger: chalk.hex('#dc3545'),
  warning: chalk.hex('#cc9b08'),
  error: chalk.red,
  info: chalk.hex('#17a2b8'),
  emph: chalk.keyword('orange'),
  debug: chalk.hex('#522d80').bgBlack,
})

module.exports = chalk
