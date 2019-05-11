const fs = require('fs')
const path = require('path')
const boxen = require('boxen')
const inquirer = require('inquirer')
inquirer.registerPrompt('warning', require('./inquirer-warn-while-type'))
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'))
inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'))

const clearModuleFromCache = moduleName =>
  delete require.cache[require.resolve(moduleName)]

const createBoundariesArt = (columns, { headerChar = '*', bottomChar = '#' }) => [
  headerChar.repeat(columns), // header
  bottomChar.repeat(columns), // bottom
]


/**
 *
 * @param {string} path
 */
module.exports.requireUpdated = function requireUpdated(path) {
  return clearModuleFromCache(path) && require(path)
}

/**
 *
 * @param {string} path
 */
module.exports.loadJSON = function loadJSON(path) {
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
module.exports.writeJSON = function writeJSON(path, data) {
  return fs.writeFileSync(
    path.endsWith('.json') ? path : path + '.json',
    JSON.stringify(data, null, 2),
  )
}

/**
 * Simples template engine que substitui strings entre chaves,
 * por seu valor na propriedade `data`.
 * @param {string} str
 * @param {object} data
 * @returns {string}
 */
module.exports.t = function t(str, data) {
  const strReplace = (str, key) =>
    str.replace(new RegExp('{' + key + '}', 'g'), data[key])

  return Object.keys(data).reduce(strReplace, str)
}

/**
 * Decorator to write pretty output
 * @param {function} fn
 */
module.exports.wrapSyncOutput = function wrapSyncOutput(fn, chars = {}) {
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
module.exports.getDeep = function getDeep(obj, path) {
  if (obj === undefined) return

  return path.reduce(
    (xs, x) => xs && (x in xs) ? xs[x] : undefined,
    obj
  )
}

/**
 * Definição (set) segura de um valor profundamente aninhado em um objeto.
 * @param {object} obj Objeto alvo do acesso das propriedades listadas.
 * @param {string[]} path O "caminho" para o valor de `obj` a ser acessado.
 * @param {string[]} value O valor a ser definido para o `obj` no caminho `path` dado.
 * @return {*|undefined} O valor da propriedade acessada ou `undefined` caso não exista.
 */
module.exports.setDeep = function setDeep(obj, path, value) {
  if (obj === undefined) return
  let i = 0;

  for (i = 0; i < path.length - 1; i++) {
    if (obj[path[i]] === undefined) {
      obj[path[i]] = {}
    }
    obj = obj[path[i]]
  }

  obj[path[i]] = value
}

/**
 * Adiciona um _event handler_ ao evento `cleanup`.
 * @see http://man7.org/linux/man-pages/man7/signal.7.html
 * @param {(signal:any) => void} eventHandler
 */
module.exports.addToOnCleanup = function addToOnCleanup(eventHandler) {
  process.on('cleanup', eventHandler)
}

/**
 * Interface facilitada para o **Inquirer**.
 * Onde atributo `type` é definido como método
 * que invocará o prompt em si. Os valores possíveis são:
 * `input`, `confirm`, `list`, `rawlist`, `expand`, `checkbox`, `password` e `editor`.
 * A propriedade `name` é opcional.
 * @see https://www.npmjs.com/package/inquirer#questions
 * @example
 * prompt({ name: 'foo', message: 'bar' }).confirm({ default: false })
 * @param {object|string} props
 * @returns {object}
 */
module.exports.prompt = function prompt(props) {
  // problema: overhead do `Proxy`
  return new Proxy({}, {
    get(_, propName) {
      return (otherProps) =>
        inquirer.prompt({
          name: 'reply',
          type: propName,
          ...((typeof props === 'string') ? { message: props } : props),
          ...otherProps,
        })
    },
  })
}

/**
 * Interface direta ao método de prompt.
 * Verifica se o parâmetro foi definido e tem tamanho maior que 0.
 * @param {object[]} questions
 * @returns {Promise}
 */
module.exports.rawPrompt = function rawPrompt(questions) {
  if (questions && questions.length > 0) {
    return inquirer.prompt(questions)
  }
}

/**
 *
 * @param {string} pathStr
 * @param {number} [count=1]
 * @param {string} [ellipsis='...']
 */
module.exports.stripDirs = function stripDirs(pathStr, count = 1, ellipsis = '...') {
  const pathComponents = path.normalize(pathStr).split(path.sep)

  if (pathComponents.length > 1 && (pathComponents[0] === '.' || pathComponents[0] === '')) {
    pathComponents.shift()
  }

  if (count > pathComponents.length - 1) {
    return path.normalize(pathComponents[pathComponents.length - 1])
  }

  return path.join(ellipsis, ...pathComponents.slice(count))
}

/**
 *
 * @param {any[]} pairs
 * @param {[string,string]} pairKeys
 */
module.exports.mapPairsToObj = function mapPairsToObj(pairs, [val1Key, val2Key]) {
  return pairs.map(
    ([a, b]) => ({ [val1Key]: a, [val2Key]: b })
  )
}

/**
 * Verifica se a string `str` está em "upercase".
 * @param {string} str
 * @returns {boolean}
 */
module.exports.isUpper = function isUpper(str) {
  return str === str.toUpperCase()
}

/**
 * Seleciona apenas as propriedades de `obj`
 * cuja chave está listada em `keys`.
 * @param {object} obj
 * @param {string[]} keys
 */
module.exports.pick = function pick(obj, keys) {
  const selected = {}

  for (const key of keys) {
    if (key in obj) {
      selected[key] = obj[key]
    }
  }

  return selected
}

/**
 *
 * @param {string[]} lines
 * @param {object} [opts]
 */
module.exports.displayBox = function displayBox(lines, opts = {}) {
  const defaultOpts = {
    borderColor: '#b5e853'
  }

  console.log(boxen(lines.join('\n'), {
    ...defaultOpts,
    ...opts,
  }))
}


/**
 * @param {object} obj
 * @param {function} predicate
 * @returns {object}
 */
module.exports.filter = function filter(obj, predicate) {
  const result = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && predicate(obj[key])) {
      result[key] = obj[key]
    }
  }

  return result
}
