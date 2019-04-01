const fs = require('fs')

const clearModuleFromCache = moduleName => delete require.cache[require.resolve(moduleName)]

/**
 *
 * @param {string} path
 */
const requireUpdated = path => clearModuleFromCache(path) && require(path)

/**
 *
 * @param {string} path
 */
const loadJSON = (path) => {
  const buffer = fs.readFileSync(path)
  return buffer.length
       ? JSON.parse(buffer)
       : Object.create(null)
}

/**
 *
 * @param {string} path
 * @param {object} data
 */
const writeJSON = (path, data) => fs.writeFileSync(path.endsWith('.json') ? path : path + '.json', JSON.stringify(data, null, 2))

/**
 *
 * @param {string} str
 * @param {object} data
 */
function t(str, data) {
  const strReplace = (str, key) => str.replace( new RegExp('{' + key + '}', 'g'), data[key] )
  return Object.keys(data).reduce(strReplace, str)
}

/**
 *
 * @param {number} columns
 */
function createBoundariesArt(columns, [headerChar = '*', bottomChar = '#']) {
  return [
    (headerChar).repeat(columns), // header
    (bottomChar).repeat(columns), // bottom
  ]
}

/**
 * Decorator to write pretty output
 * @param {functino} fn
 */
function wrapSyncOutput(fn, chars) {
  const [header, bottom] = createBoundariesArt(process.stdout.columns, chars)
  console.log(header)
  fn()
  console.log(bottom)
}


module.exports = {
  loadJSON,
  writeJSON,
  requireUpdated,
  t,
  wrapSyncOutput,
}
