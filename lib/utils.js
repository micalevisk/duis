const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
inquirer.registerPrompt('fuzzypath', require('inquirer-fuzzy-path'))


function __(cb) {
  module.exports[cb.name] = cb
}


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
__(function requireUpdated(path) {
  return clearModuleFromCache(path) && require(path)
})

/**
 *
 * @param {string} path
 */
__(function loadJSON(path) {
  const buffer = fs.readFileSync(path)
  return buffer.length
       ? JSON.parse(buffer.toString())
       : Object.create(null)
})

/**
 *
 * @param {string} path
 * @param {object} data
 */
__(function writeJSON(path, data) {
  return fs.writeFileSync(
    path.endsWith('.json') ? path : path + '.json',
    JSON.stringify(data, null, 2),
  )
})

/**
 * Simples template engine que substitui strings entre chaves,
 * por seu valor na propriedade `data`.
 * @param {string} str
 * @param {object} data
 * @returns {string}
 */
__(function t(str, data) {
  const strReplace = (str, key) =>
    str.replace(new RegExp('{' + key + '}', 'g'), data[key])

  return Object.keys(data).reduce(strReplace, str)
})

/**
 * Decorator to write pretty output
 * @param {function} fn
 */
__(function wrapSyncOutput(fn, chars = {}) {
  const [header, bottom] = createBoundariesArt(process.stdout.columns, chars)
  console.log(header)
  fn()
  console.log(bottom)
})

/**
 * Acesso seguro a valores profundamentes aninhados em um objeto.
 * Adaptado de (c) 'sharifsbeat' at https://medium.com/javascript-inside/99bf72a0855a
 * @param {object} obj Objeto alvo do acesso das propriedades listadas.
 * @param {string[]} path O "caminho" para o valor de `obj` a ser acessado.
 * @return {*|undefined} O valor da propriedade acessada ou `undefined` caso não exista.
 */
__(function getDeep(obj, path) {
  if (obj === undefined) return

  return path.reduce(
    (xs, x) => xs && (x in xs) ? xs[x] : undefined,
    obj
  )
})

/**
 * Definição (set) segura de um valor profundamente aninhado em um objeto.
 * @param {object} obj Objeto alvo do acesso das propriedades listadas.
 * @param {string[]} path O "caminho" para o valor de `obj` a ser acessado.
 * @param {string[]} value O valor a ser definido para o `obj` no caminho `path` dado.
 * @return {*|undefined} O valor da propriedade acessada ou `undefined` caso não exista.
 */
__(function setDeep(obj, path, value) {
  if (obj === undefined) return
  let i = 0;

  for (i = 0; i < path.length - 1; i++) {
    if (obj[path[i]] === undefined) {
      obj[path[i]] = {}
    }
    obj = obj[path[i]]
  }

  obj[path[i]] = value
})

/**
 * Adiciona um _event handler_ ao evento `SIGINT`.
 * Disparado quando o processo é interrompido pelo teclado.
 * @see http://man7.org/linux/man-pages/man7/signal.7.html
 * @param {(signal:any) => void} eventHandler
 */
__(function addHandlerToSIGINT(eventHandler) {
  return process.on('SIGINT', eventHandler)
})

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
__(function prompt(props) {
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
})

/**
 *
 * @param {string} pathStr
 * @param {number} [count=1]
 * @param {string} [ellipsis='...']
 */
__(function stripDirs(pathStr, count = 1, ellipsis = '...') {
  const pathComponents = path.normalize(pathStr).split(path.sep)

  if (pathComponents.length > 1 && (pathComponents[0] === '.' || pathComponents[0] === '')) {
    pathComponents.shift()
  }

  if (count > pathComponents.length - 1) {
    return path.normalize(pathComponents[pathComponents.length - 1])
  }

  return path.join(ellipsis, ...pathComponents.slice(count))
})
