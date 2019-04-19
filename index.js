const path = require('path')
const duis = require('./src')

// TODO: export o cli como func
module.exports = async () => {
  if (process.argv.length <= 2) return // TODO: show help

  const [,, pathToTrabFile, pathToConfigFile = '.'] = process.argv

  // TODO: tratar casos onde o nome do arquivo é passado em `pathToConfigFile`
  const configFilename = 'duis.config.js'
  const configFileAbsPath = path.resolve(pathToConfigFile, configFilename)

  console.log(`sobre: ${pathToTrabFile}`)
  console.log(`usando: ${configFileAbsPath}`)

  return await duis(configFileAbsPath, pathToTrabFile)
}
