const path = require('path')
const hsell = require('../../src/human-shell')

const { DUIS_CONFIG_FILENAME } = require('../../lib').constants

/**
 *
 * @param {string} cwd - Current Working Directory.
 * @param {boolean} canOverride - If `true` will override if file exists.
 */
module.exports = function init(cwd, canOverride = false) {
  const absPathToTemplateFile = path.join(__dirname, '__template__' + DUIS_CONFIG_FILENAME)
  const absPathToLookupFile = path.resolve(cwd, DUIS_CONFIG_FILENAME)

  const createFile = () =>
    hsell.cat(absPathToTemplateFile).toEnd(absPathToLookupFile)

  const resultMsg = code => (code === 0)
    ? `File created at: ${absPathToLookupFile}`
    : `Can't create the file in: ${absPathToLookupFile}`

  if (canOverride) {
    const { code } = createFile()
    console.log(resultMsg(code))
  } else {
    if (hsell.test('-f', absPathToLookupFile)) {
      console.log(`The file "${absPathToLookupFile}" already exist`);
    } else {
      const { code } = createFile()
      console.log(resultMsg(code))
    }
  }
}
