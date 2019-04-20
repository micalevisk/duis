const path = require('path')
const duis = require('./src')

module.exports = async () => {
  if (process.argv.length <= 2) return // TODO: show help

  // assuming: $ duis <PATH/TO/CONFIG-FILE> <PATH/TO/TRAB-FILE>
  let [,, pathToConfigFile, pathToTrabFile] = process.argv
  // treat as: $ duis <PATH/TO/TRAB-FILE>
  if (process.argv.length === 3) {
    pathToTrabFile = pathToConfigFile
    pathToConfigFile = '.'
  }

  const configFilename = 'duis.config.js'
  const configFileAbsPath = path.resolve(pathToConfigFile, configFilename)

  console.log(`sobre: ${pathToTrabFile}`)
  console.log(`usando: ${configFileAbsPath}`)

  return await duis(configFileAbsPath, pathToTrabFile)
}
