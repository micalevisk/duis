const path = require('path')
const duis = require('../../src')

const { DUIS_CONFIG_FILENAME } = require('../../lib').constants

/**
 *
 * @param {string} pathToConfigFile
 * @param {string} pathToTrabFile
 */
module.exports = async function exec(pathToConfigFile, pathToTrabFile) {
  const configFileAbsPath = path.resolve(pathToConfigFile, DUIS_CONFIG_FILENAME)

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
      process.exit()
      return
    }
  })
}
