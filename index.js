const path = require('path')
const duis = require('./src')

async function duisBootstrap() {
  if (process.argv.length <= 2) return // TODO: show help

  // assuming: $ duis <PATH/TO/CONFIG-FILE> <PATH/TO/TRAB-FILE>
  let [,, pathToConfigFile, pathToTrabFile] = process.argv
  // treat as: $ duis <PATH/TO/TRAB-FILE>
  if (process.argv.length === 3) {
    pathToTrabFile = pathToConfigFile
    pathToConfigFile = '.'
  }

  const configFilename = 'duis.config.js'
  const configFileAbsPath = path.resolve(pathToConfigFile, configFilename)

  setupProcessListeners()
  return await duis(configFileAbsPath, pathToTrabFile)
}

function setupProcessListeners() {
  process.stdin.resume() // the program will not close instantly

  /** @see https://nodejs.org/api/process.html#process_event_unhandledrejection */
  process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at', p, 'reason:', reason)
    process.exit(1)
  })

  /** @see https://stackoverflow.com/a/12506613 */
  process.stdin.setRawMode(true)
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', function stdinOnData(key) {
    // ctrl-c (end of text) or Esc
    if (key === '\u0003' || key === '\x1b') {
      process.emit('cleanup')
      process.emit('exit')
      return
    }
  })
}


module.exports = duisBootstrap
