//@ts-check
const path = require('path')
const hshell = require('./human-shell')

/**
 *
 * @param {string} configFileAbsPath
 * @returns {Function}
 */
function useConfig(configFileAbsPath) {
  if ( !hshell.isReadableFile(configFileAbsPath) ) {
    throw new Error('{FILE_CONFIG}:: ' + `File not found: ${configFileAbsPath}`)
  }

  const pathJoinWithRoot = path.resolve.bind(null, configFileAbsPath, '..')

  return pathJoinWithRoot
}


module.exports = {
  useConfig,
}
