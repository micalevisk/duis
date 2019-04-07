//@ts-check
const fs = require('fs')
const path = require('path')

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
       ? JSON.parse(buffer.toString())
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
function createBoundariesArt(columns, {headerChar = '*', bottomChar = '#'}) {
  return [
    (headerChar).repeat(columns), // header
    (bottomChar).repeat(columns), // bottom
  ]
}

/**
 * Decorator to write pretty output
 * @param {function} fn
 */
function wrapSyncOutput(fn, chars = {}) {
  const [header, bottom] = createBoundariesArt(process.stdout.columns, chars)
  console.log(header)
  fn()
  console.log(bottom)
}

/**
 * Acesso seguro a valores profundamentes aninhados em um objeto.
 * Adaptado de (c) 'sharifsbeat' at https://medium.com/javascript-inside/99bf72a0855a
 * @param {object} obj Objeto alvo do acesso das propriedades listadas.
 * @param {string[]} path O "caminho" para o valor de `obj` a ser acessado.
 * @return {*|undefined} O valor da propriedade acessada ou `undefined` caso não exista.
 */
const getDeepValue = (obj, path) =>
  path.reduce((xs, x) => (xs && x in xs) ? xs[x] : undefined, obj)


function trimPathSeparator(pathName) {
  const dir = path.parse(pathName).dir
  return dir + (dir && path.sep) + path.basename(pathName)
}


module.exports = {
  loadJSON,
  writeJSON,
  requireUpdated,
  t,
  wrapSyncOutput,
  getDeepValue,
  trimPathSeparator,
}
