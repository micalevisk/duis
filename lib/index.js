const fs = require('fs')

//#region utils

const clearModuleFromCache = moduleName => delete require.cache[require.resolve(moduleName)]
const requireUpdated = path => clearModuleFromCache(path) && require(path)

const loadJSON = (path) => {
  const buffer = fs.readFileSync(path)
  return buffer.length
       ? JSON.parse(buffer)
       : Object.create(null)
}

const writeJSON = (path, data) => fs.writeFileSync(path.endsWith('.json') ? path : path + '.json', JSON.stringify(data, null, 2))

function t(str, data) {
  const strReplace = (str, key) => str.replace( new RegExp('{'+key+'}','g'), data[key] )
  return Object.keys(data).reduce(strReplace, str)
}
//#endregion


module.exports = {
  loadJSON,
  writeJSON,
  requireUpdated,
  t,
}
