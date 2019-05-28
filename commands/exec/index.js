const path = require('path')
const duis = require('../../src')

const { sty, constants } = require('../../lib')
const { DUIS_CONFIG_FILENAME } = constants
const isDev = process.env.NODE_ENV === 'development'

/**
 *
 * @param {string} pathToConfigFile
 * @param {string} pathToTrabFile
 * @param {object} priorityConfigs
 */
module.exports = async function exec(pathToConfigFile, pathToTrabFile, priorityConfigs = {}) {
  const configFileAbsPath = path.resolve(pathToConfigFile, DUIS_CONFIG_FILENAME)

  setupProcessListeners()

  return duis(configFileAbsPath, pathToTrabFile, priorityConfigs)
    .catch(onExecFatalError)
}

function setupProcessListeners() {
  process.stdin.resume() // the program will not close instantly

  /** @see https://nodejs.org/api/process.html#process_process_setuncaughtexceptioncapturecallback_fn */
  process.setUncaughtExceptionCaptureCallback(onExecFatalError)

  /** @see https://nodejs.org/api/process.html#process_event_unhandledrejection */
  process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at', p, 'reason:', reason)
    process.exit(1)
  })

  /** @see https://stackoverflow.com/a/12506613 */
  process.stdin.setRawMode(true)
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', function stdinOnData(key) {
    // when press `ctrl-c` (end of text) or `Esc` keys
    if (key === '\u0003' || key === '\x1b') {
      process.emit('cleanup')
      process.emit('exit')
      process.exit()
      return
    }
  })
}

function onExecFatalError(err) {
  console.error(sty`{error {bold %s} %s}`, '[ERROR]', err.message)
  if (isDev) console.error(err)
  process.exit(9)
}
