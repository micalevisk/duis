//@ts-check
const path = require('path')
const _ = require('./utils')
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

/**
 *
 * @param {object} data
 * @returns {Function}
 */
function createTemplateMapper(data) {
  const keysToSkip = [
    // injected fields:
    'currentSession',
    'startAnswers',

    // original fields:
    'startQuestions',
    'workingdirQuestions',
  ]

  const iteratee = ({ value, key, subject, path }) => {
    if (keysToSkip.some(currKey => path.startsWith(currKey))) return value
    const newValue = (typeof value === 'string') ? _.t(value, data) : value
    subject[key] = newValue
  }

  return (objToMap) => _.deepIterate(objToMap, iteratee)
}


module.exports = {
  useConfig,
  createTemplateMapper,
}
