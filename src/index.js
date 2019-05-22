const path = require('path')
const hshell = require('./human-shell')
const { utils: _, sty, openBrowser, PHPServer, constants } = require('../lib')

const isDev = process.env.NODE_ENV === 'development'
const log = console.log

if (isDev) hshell.set('-v')
hshell.config.silent = true

/**
 * @param {string} configFileAbsPath
 * @param {string} pathToTrabFile
 */
module.exports = async function duisAbove(configFileAbsPath, pathToTrabFile, priorityConfigs) {

if ( !hshell.isReadableFile(configFileAbsPath) ) {
  log(sty`{error %s {bold %s}}`, 'File not found:', configFileAbsPath)
  return 401
}

const pathJoinWithRoot = path.resolve.bind(null, configFileAbsPath, '..')

// ███████╗███████╗████████╗██╗   ██╗██████╗
// ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
// ███████╗█████╗     ██║   ██║   ██║██████╔╝
// ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
// ███████║███████╗   ██║   ╚██████╔╝██║
// ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝

//#region [1]
const config = _.requireUpdated(configFileAbsPath)
for (const [configName, configValue] of Object.entries(priorityConfigs)) {
  if (typeof configValue !== 'undefined') {
    let newConfigValue = configValue
    const configNamePath = configName.split('.')
    // FUTURE: check the schema defintion
    const originalConfigValue = _.getDeep(config, configNamePath)
    if ( Array.isArray(originalConfigValue) ) {
      newConfigValue = (originalConfigValue || []).concat(configValue.split(','))
    }

    _.setDeep(config, configNamePath, newConfigValue)
  }
}
//#endregion

//#region [lift session]
const sessionAbsPath = pathJoinWithRoot(constants.DUIS_SESSION_FILENAME)

const sessionTemplate = {
  'lastAnswersToStartQuestions': {},
  'lastWorkingdirsParents': [],
}

if (config.new) { // create a new session file, overwriting the last one
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

const updateSessionFile = dataToMerge =>
  _.writeJSON(sessionAbsPath, Object.assign(currentSession, dataToMerge))

const getFromSession = (pathToLookup, fallbackValue) => {
  if (!Array.isArray(pathToLookup)) {
    pathToLookup = [pathToLookup]
  }

  const valueStored = _.getDeep(currentSession, pathToLookup)
  return (typeof valueStored !== 'undefined') ? valueStored : fallbackValue
}
//#endregion

//#region [2]
const defaultStartQuestions = [
  {
    type: 'input',
    name: 'commitLimitDate',
    // default: getFromSession(['lastAnswersToStartQuestions', 'commitLimitDate'], new Date().toISOString().substr(0, 10)),
    default: new Date().toISOString().substr(0, 10),
    message: `Data máxima dos commits ${sty.secondary('[AAAA-MM-DD]')}`,
    validate: input => !input.trim() ? 'Formato inválido!' : (/^\d{4}-\d{2}-\d{2}$/).test(input)
  },
]

const overrideDefaultValue = (question) => {
  if (!question.default) {
    return question
  }

  const lastValue = getFromSession(['lastAnswersToStartQuestions', question.name], question.default)
  question.default = lastValue

  return question
}

const startAnswers = await _.rawPrompt([
  ...defaultStartQuestions,
  ...config.startQuestions,
].map(overrideDefaultValue))

updateSessionFile({
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
const workingdirParentDirPath = _.t(config.workingdirParentDirPathMask, startVariables)
const workingdirsDirAbsPath = pathJoinWithRoot(workingdirParentDirPath)
const entryDirPath = pathToTrabFile

const lookupDirPath = _.t(config.lookupDirPathMask, startVariables)
const lookupDirAbsPath = pathJoinWithRoot(lookupDirPath)

delete config['workingdirParentDirPathMask']
// NOTE: workingdirsDirAbsPath
config['workingdirsDirAbsPath'] = workingdirsDirAbsPath

// NOTE: lookupDirAbsPath
delete config['lookupDirPathMask']
config['lookupDirAbsPath'] = lookupDirAbsPath


if (config.excludeMasks) {
  const excludePatternsAbsPath = config.excludeMasks.map((excludeMask) => {
    const excludePattern = _.t(excludeMask, startVariables)
    const excludePatternAbsPath = pathJoinWithRoot(excludePattern)
    return excludePatternAbsPath
  })

  delete config['excludeMasks']
  // NOTE: excludePatternsAbsPath
  config['excludePatternsAbsPath'] = excludePatternsAbsPath
}

if (config.test && config.test.commandToRun) {
  const testsDirPath = _.t(config.test.dirPathMask, startVariables)
  const testsDirAbsPath = pathJoinWithRoot(testsDirPath)

  if ( hshell.isDirectory(testsDirAbsPath) ) {
    const commandToTest = config.test.commandToRun
    const fileExtName = config.test.fileExtName || ''

    // NOTE: testsDirAbsPath
    config['testsDirAbsPath'] = testsDirAbsPath

    // NOTE: commandOnTest
    config['commandOnTest'] = function commandOnTest(testFilename, ...args) {
      const fileToTestAbsPath = path.format({
        dir: testsDirAbsPath,
        base: testFilename + fileExtName
      })

      if (hshell.isReadableFile(fileToTestAbsPath)) {
        return `${commandToTest} ${fileToTestAbsPath} ${args.join(' ')}`
      }
    }
  }

  delete config['test']
}

if (typeof config.lookupAttachExtra !== 'function') {
  // NOTE: lookupAttachExtra
  config['lookupAttachExtra'] = () => {}
}

// NOTE: openBrowserAt
config['openBrowserAt'] = () => {}
if (config.browser && config.browser.name) {
  const browserName = config.browser.name

  // NOTE: openBrowserAt
  config['openBrowserAt'] = async function openBrowserAt(URL, usingFileProtocol) {
    const _openBrowser = openBrowser.bind(null, browserName, {
      path: URL,
      opts: config.browser.opts,
      isFile: usingFileProtocol,
    })

    if (config.browser.autoOpen) {
      return _openBrowser()
    }

    const { reply: canOpenBrowser } = await _.prompt(
      sty`Abrir o {yellow ${browserName}} em {blue ${URL}}`
    ).list({ choices: ['sim', 'não'], filter: input => input === 'sim' })

    if (canOpenBrowser) {
      return _openBrowser()
    }
  }
}

// NOTE: stopServer
config['stopServer'] = () => {}
if (config.serverPort) {
  const phpServer = new PHPServer({host: 'localhost', port: config.serverPort})
  _.addToOnCleanup(phpServer.shutDown.bind(phpServer))

  // NOTE: initServer
  config['initServer'] = function initServer(docroot, onProcessClose = () => {}) {
    phpServer.initServer(docroot).on('close', onProcessClose)
    return phpServer
  }

  // NOTE: stopServer
  config['stopServer'] = function stopServer() {
    return phpServer.shutDown()
  }
}

const userCommandsHooks = config.hooks || {}


// ██╗   ██╗████████╗██╗██╗     ███████╗
// ██║   ██║╚══██╔══╝██║██║     ██╔════╝
// ██║   ██║   ██║   ██║██║     ███████╗
// ██║   ██║   ██║   ██║██║     ╚════██║
// ╚██████╔╝   ██║   ██║███████╗███████║
//  ╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝

function getRootDirForWorkingdir(wdAbsPath) {
  return path.normalize( path.join(wdAbsPath,
    ('..' + path.sep).repeat(config.levelsToRootDir)))
}

async function runHookOn(context, name) {
  if (!context || !context[name]) return

  for (const command of context[name]) {
    if (config.safe) {
      const { reply: canRunCommand } = await confirmCmdExecution(command)
      if (!canRunCommand) continue
    }

    _.wrapSyncOutput(() => {
      log(sty`{secondary {bold %s} %s}`, '$', command)
      try {
        // if `command` needs to read from stdin, this will not work properly with `set -v` mode
        const commandOutput = hshell.runSafe(command)
        log(sty`{white %s}`, commandOutput)
      } catch (err) {
        log(sty.error(err.message))
        if (isDev) console.error(err)
      }
    })
  }
}


function truncatePath(pathToFile) {
  const homeAbsPath = process.env.HOME
  const currentWorkingDirectory = process.cwd()

  if (pathToFile.startsWith(currentWorkingDirectory)) {
    if ((pathToFile === currentWorkingDirectory) && (pathToFile.startsWith(homeAbsPath))) {
      return sty.secondary('~') + pathToFile.substr(homeAbsPath.length)
    }
    return sty.secondary('.') + pathToFile.substr(currentWorkingDirectory.length)
  }

  return _.stripDirs(pathToFile, config.levelsToRootDir * -3)
}

function getLastCommit({ until = '', parent = 'remotes/origin/master', ref = '.' }) {
  return hshell
    .runSafe(`git rev-list -1 --until="${until}" --abbrev-commit ${parent} ${ref}`)
}

async function confirmCmdExecution(command, props = {}) {
  return _.prompt(
    `Executar ${sty.danger(command)}`
  ).confirm(props)
}

async function defineEntryDirName(currLookup, defaultEntryDirName) {
  const entryNamesOnLookupfile = Object.keys(currLookup)

  if (!defaultEntryDirName) { // forces to be 'undefined' if is falsy
    defaultEntryDirName = undefined
  }

  const isAlreadyOnLookup = input =>
    entryNamesOnLookupfile.includes(input) ? sty.vdanger(input) : input

  const { reply: newEntryDirName } = await _.prompt(
    `Identificador desse trabalho no arquivo de lookup`
  ).suggest({
    default: defaultEntryDirName,
    suggestions: entryNamesOnLookupfile,
    transformer: isAlreadyOnLookup,
    validate: answer => !answer.trim() ? 'Informe algo' : true
  })

  return newEntryDirName
}


// ██████╗ ██╗   ██╗███╗   ██╗
// ██╔══██╗██║   ██║████╗  ██║
// ██████╔╝██║   ██║██╔██╗ ██║
// ██╔══██╗██║   ██║██║╚██╗██║
// ██║  ██║╚██████╔╝██║ ╚████║
// ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

/**
 *
 * @param {number} index
 * @param {string} workingdirAbsPath
 */
async function runAt(index, workingdirAbsPath) {
  if (isDev) { console.info();console.info('<---------------------');console.info(workingdirAbsPath);console.info(); }

  log() // break line
  const { reply: keepRunning } = await _.prompt(
    `${sty.secondary(`[${index}]`)} Continuar para: ${sty.warning(truncatePath(workingdirAbsPath))}`
  ).confirm()

  if (!keepRunning) return

  //#region [4.1]
  const rootDirAbsPath = getRootDirForWorkingdir(workingdirAbsPath)
  hshell.enterOnDir(rootDirAbsPath)
  //#endregion

  let __workingdirAbsPath = workingdirAbsPath
  let entryDirName = path.basename(workingdirAbsPath)

  //#region [4.2]
  const rootLastCommitId = getLastCommit({until: config.startAnswers.commitLimitDate})
  if (!rootLastCommitId) return // no commits
  log(sty`{secondary %s {bold %s}}`, 'Último commit no root:', rootLastCommitId)

  let rootDirName = path.basename(rootDirAbsPath)

  let rootLookupFileAbsPath = path.join(config.lookupDirAbsPath, rootDirName + '.json')
  if ( !hshell.isReadableFile(rootLookupFileAbsPath) ) {
    log(sty`{error %s {bold %s}}`, 'File not found:', rootLookupFileAbsPath)

    const { reply } = await _.prompt(
      `Digitar ou selecionar um arquivo de lookup para ${sty.emph(rootDirName)}?`)
      .list({ choices: ['selecionar', 'criar'] })

    if (reply === 'selecionar') {
      const { reply } = await _.prompt(
        'Selecione o arquivo de lookup:')
        .fuzzypath({
          excludePath: nodePath => nodePath.startsWith('node_modules'),
          itemType: 'file',
          default: rootLookupFileAbsPath,
          rootPath: config.lookupDirAbsPath,
          suggestOnly: false,
        });

      rootLookupFileAbsPath = reply
    } else {
      const lookupExists = (lookupFilename) => {
        const pathToFile = path.join(config.lookupDirAbsPath, lookupFilename + '.json')
        return hshell.isReadableFile(pathToFile)
      }

      const { reply: lookupFilename } = await _.prompt(
        `Informe o nome do arquivo a ser criado em ${sty.emph(truncatePath(config.lookupDirAbsPath))} ${sty.secondary('[sem a extensão]')}`)
        .warning({
          default: path.basename(rootLookupFileAbsPath, '.json'),
          warnif: lookupExists,
          warning: 'Já existe um arquivo com esse nome',
          validate: input => !input.trim() ? 'Informe algo': true,
        })

      rootLookupFileAbsPath = path.join(config.lookupDirAbsPath, lookupFilename + '.json')
    }

    hshell.createFileIfNotExists(rootLookupFileAbsPath)
    rootDirName = path.basename(rootLookupFileAbsPath, '.json')
  }

  const currLookup = _.loadJSON(rootLookupFileAbsPath)

  // making sure that the `__workingdirAbsPath` is a valid directory
  if (!hshell.isDirectory(workingdirAbsPath)) {
    __workingdirAbsPath = path.dirname(workingdirAbsPath)
  }

  //#region [4.2]
  await runHookOn(userCommandsHooks, 'onEnterWD')
  //#endregion

  //#region [4.3]
  hshell.enterOnDir(__workingdirAbsPath)
  log(sty`{info {bold %s} %s}`, 'Em:', truncatePath(__workingdirAbsPath))
  //#endregion

  //#region [4.4]
  const workingdirLastCommitId = getLastCommit({until: config.startAnswers.commitLimitDate})
  if (!workingdirLastCommitId) return // no commits
  log(sty`{secondary %s {bold %s}}`, 'Último commit:', workingdirLastCommitId)

  for (let repeatPrompt = true; repeatPrompt; ) {
    const defaultEntryDirName = config.entryDirName || (config.levelsToRootDir && entryDirName)
    entryDirName = await defineEntryDirName(currLookup, defaultEntryDirName)

    const currStoredRelease = _.getDeep(currLookup, [entryDirName])
    const isSameVersion = _.getDeep(currStoredRelease, ['_id']) === workingdirLastCommitId
    repeatPrompt = isSameVersion

    if (isSameVersion) {
      log(sty`{success {bold %s} %s {bold %s}}`, '\u{2714}', 'Versão já registrada para', entryDirName)
      const { reply: choice } = await _.prompt(sty.vdanger(
        `Continuar mesmo assim`
      )).list({ choices: ['pular', 'sim', 'tentar outro'] })

      if (choice === 'pular') {
        return
      }

      repeatPrompt = (choice !== 'sim')
    }
  }
  //#endregion

  if (config.initServer) {
    //#region [4.5]
    const serverAddress = 'http://' + config.initServer(__workingdirAbsPath).hostaddress
    // FIXME: esperar validar a conexão do server
    log(sty`{success %s {bold %s}}`, 'Server iniciado em:', serverAddress)
    await config.openBrowserAt(serverAddress)
    //#endregion
  } else {
    //#region [4.6]
    await config.openBrowserAt(workingdirAbsPath, true)
    //#endregion
  }

  //#region [4.7]
  if (config.commandOnTest) {
    const commandToRunTest = config.commandOnTest(entryDirName)
    if (commandToRunTest) {
      const { reply: canRunTests } = await confirmCmdExecution(commandToRunTest)
      if (canRunTests) {
        _.wrapSyncOutput(() =>
          hshell.exec(commandToRunTest, { silent: false }))
      }
    } else {
      log(sty`{debug %s {red %s}}`, 'Nenhum teste para', entryDirName)
    }
  }
  //#endregion

  for (let repeatPrompt = true; repeatPrompt; ) {
    //#region [4.8]
    const answersWorkingdirQuestions = await _.rawPrompt(config.workingdirQuestions)
    //#endregion

    //#region [4.9]
    const { reply: updateLookup } = await _.prompt(
      `Finalizar avaliação de ${sty.emph(rootDirName)}? Salvar como ${sty.secondary(entryDirName)}`)
      .list({ choices: ['sim', 'não salvar alterações'], filter: input => input === 'sim' })

    if (updateLookup) {
      const workingdirLookup = {
        _id: workingdirLastCommitId,
        extra: config.lookupAttachExtra(answersWorkingdirQuestions),
        prompts: answersWorkingdirQuestions &&
                 _.mapPairsToObj(Object.entries(answersWorkingdirQuestions), ['q', 'a']),
      }

      _.setDeep(currLookup, [entryDirName], workingdirLookup)
      _.writeJSON(rootLookupFileAbsPath, currLookup)
    }

    const { reply: mustRepeatPrompt } = await _.prompt(
      `Reavaliar ` + sty.secondary`-- definindo outro identificador`
    ).confirm({ default: false })

    repeatPrompt = mustRepeatPrompt
    if (repeatPrompt) {
      entryDirName = await defineEntryDirName(currLookup)
    }
  }

  config.stopServer()
  await runHookOn(userCommandsHooks, 'beforeLeaveWD')
  //#endregion
}

;(async function() {
  const globOptions = {
    absolute: true,
    ignore: config.excludePatternsAbsPath,
  }

  const userHooksDefined = constants.AVAILABLE_HOOKS.reduce((total, hookName) => {
    if ((hookName in userCommandsHooks) && (userCommandsHooks[hookName].length)) {
      total += `${sty.emph(hookName)} (${userCommandsHooks[hookName].length}) `
    }
    return total
  }, '')

  const { lastWorkingdirsParents } = currentSession

  // directories to ignore when looking for "workingdir"
  const blackListDirectories = [
    config.testsDirAbsPath,
  ]

  const initialCWD = process.cwd()

  if (userHooksDefined) {
    _.displayBox([
      `Hooks definidos: ${sty.bold(userHooksDefined)}`,
    ], { borderColor: 'blue' })

    await runHookOn(userCommandsHooks, 'beforeStart')
  }

  try {

    const parentDirs = await _.globPattern(config.workingdirsDirAbsPath, globOptions)

    const resolvedWorkindirsPath = path.resolve(config.workingdirsDirAbsPath, entryDirPath)
    const workingdirs = await _.globPattern(resolvedWorkindirsPath, globOptions)
    const workingdirsFiltered = workingdirs.filter((workingdirAbsPath) => {
      const workingdirParent = getRootDirForWorkingdir(workingdirAbsPath)
      return !lastWorkingdirsParents
        .some(lastFoundWorkingdir => _.hasSamePath(workingdirParent, lastFoundWorkingdir))
    })

    //#region [3]
    hshell.createDirIfNotExists(config.lookupDirAbsPath)
    //#endregion

    //#region
    _.displayBox([
      `Total de diretórios pai : ${sty.bold(parentDirs.length)}`,
      `Total que será analisado: ${sty.bold(workingdirsFiltered.length)}`,
    ])
    //#endregion

    for (let idx = 0; idx < workingdirsFiltered.length; ++idx) {
      const workingdirAbsPath = workingdirsFiltered[idx]

      if (blackListDirectories.includes(workingdirAbsPath)) {
        continue
      }

      const code = await runAt(idx + 1, workingdirAbsPath)
      if (code === 401) return
      if (code === 402) return

      //#region
      lastWorkingdirsParents.push( getRootDirForWorkingdir(workingdirAbsPath) )

      updateSessionFile({
        lastWorkingdirsParents,
      })
      //#endregion

      hshell.enterOnDir(initialCWD)
    }

    //#region
    if (workingdirsFiltered.length) {
      await runHookOn(userCommandsHooks, 'onFinish')
    }
    //#endregion

  } catch (err) {
    console.error(sty.error('[ERROR] ' + err.message))
    if (isDev) console.error(err)
    process.exit(1)
  }

}());

}
