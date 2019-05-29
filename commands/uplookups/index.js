//@ts-check
const path = require('path')
const fs = require('fs')
const {
  utils: _,
  core: { useConfig },
  constants,
  hshell,
  sty,
} = require('../../lib')

const { DUIS_CONFIG_FILENAME } = constants


module.exports = async function uplookups(pathToConfigFile) {
  const configFileAbsPath = path.resolve(pathToConfigFile, DUIS_CONFIG_FILENAME)

  return updateLookupsUsing(configFileAbsPath)
}

async function updateLookupsUsing(configFileAbsPath) {
  // TODO: percorrer todos os arquivos de lookup e, para cada entry, atualizar seu valor
  const pathJoinWithRoot = useConfig(configFileAbsPath)

  //#region [1]
  const config = _.requireUpdated(configFileAbsPath)
  //#endregion

  // MUST REFACT BELOW

  //#region [lift session]
  // NOTE: updateSessionFile
  config['updateSessionFile'] = () => {}
  // NOTE: removeSessionFile
  config['removeSessionFile'] = () => {}
  // NOTE: getFromSession
  config['getFromSession'] = () => {}
  if (config.session) {
    const configContext = _.getDeep(config, ['session'])

    const sessionTemplate = {
      'lastAnswersToStartQuestions': {},
      'lastWorkingdirsParents': [],
    }

    const sessionFilename = configContext.file
    const sessionAbsPath = sessionFilename && pathJoinWithRoot(sessionFilename)

    const mustCreateNewSessionFile = sessionAbsPath && configContext.new
    if (mustCreateNewSessionFile) {
      _.writeJSON(sessionAbsPath, sessionTemplate)
    }

    const currentSession = (function loadSession() {
      const session = Object.assign({}, sessionTemplate)

      if (!hshell.isReadableFile(sessionAbsPath)) {
        return session
      }

      const storedSession = _.loadJSON(sessionAbsPath)
      if (storedSession) {

        return Object.assign(session, storedSession)
      }

      return session
    }())

    const updateSessionFile = (dataToMerge) => {
      if (sessionAbsPath) {
        return _.writeJSON(sessionAbsPath, Object.assign(currentSession, dataToMerge))
      }
    }

    const removeSessionFile = () => hshell.rm(sessionAbsPath)

    const getFromSession = (pathToLookup) => {
      if (!Array.isArray(pathToLookup)) {
        pathToLookup = [pathToLookup]
      }

      const valueStored = _.getDeep(currentSession, pathToLookup)
      return valueStored
    }

    config['currentSession'] = currentSession
    // NOTE: updateSessionFile
    config['updateSessionFile'] = updateSessionFile
    // NOTE: removeSessionFile
    config['removeSessionFile'] = removeSessionFile
    // NOTE: getFromSession
    config['getFromSession'] = getFromSession

    delete config.session
  }
  //#endregion

  //#region [2]
  const defaultStartQuestions = [
    {
      type: 'input',
      name: 'commitLimitDate',
      default: new Date().toISOString().substr(0, 10),
      message: `Data máxima dos commits ${sty.secondary('[AAAA-MM-DD]')}`,
      validate: input => {
        if (!input.trim()) return 'Informe algo!'
        return (/^\d{4}-\d{2}-\d{2}$/).test(input) ? true : 'Formato inválido!'
      }
    },
  ]

  const overrideDefaultValue = (question) => {
    if (!question.default) {
      return question
    }

    const lastValue = _.coalesce(config.getFromSession(['lastAnswersToStartQuestions', question.name]), question.default)
    question.default = lastValue

    return question
  }

  const startAnswers = await _.rawPrompt([
    ...defaultStartQuestions,
    ...config.startQuestions,
  ].map(overrideDefaultValue))

  config.updateSessionFile({
    'lastAnswersToStartQuestions': {
      ...startAnswers,
    },
  })

  const namesStartVariables = Object.keys(startAnswers).filter(_.isUpper)
  // respostas com as keys (name) com letras maiúsculas
  const startVariables = _.pick(startAnswers, namesStartVariables)

  // NOTE: startAnswers
  config['startAnswers'] = startAnswers
  //#endregion

  // resolvido após responder as perguntas de setup

  const lookupDirPath = _.t(config.lookupDirPathMask, startVariables)
  const lookupDirAbsPath = pathJoinWithRoot(lookupDirPath)

  console.log('>>>>', lookupDirAbsPath);


}
