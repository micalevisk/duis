const path = require('path')
const hshell = require('./human-shell')
const { utils: _, sty, openBrowser, PHPServer } = require('../lib')

const isDev = process.env.NODE_ENV === 'development'
const log = console.log

if (isDev) hshell.set('-v')
hshell.config.silent = true


/**
 * @param {string} configFileAbsPath
 * @param {string} pathToTrabFile
 */
module.exports = async function duisAbove(configFileAbsPath, pathToTrabFile) {

if ( !hshell.isReadableFile(configFileAbsPath) ) {
  log(sty`{error %s {bold %s}}`, 'File not found:', configFileAbsPath)
  return 401
}

const pathJoinWithRoot = path.resolve.bind(null, configFileAbsPath, '..')

const defaultStartQuestions = [
  {
    type: 'input',
    name: 'commitLimitDate',
    default: new Date().toISOString().substr(0, 10),
    message: `Data máxima dos commits ${sty.secondary('[AAAA-DD-MM]')}`,
    validate: input => !input.trim() ? 'Formato inválido!' : (/^\d{4}-\d{2}-\d{2}$/).test(input)
  },
]

// ███████╗███████╗████████╗██╗   ██╗██████╗
// ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
// ███████╗█████╗     ██║   ██║   ██║██████╔╝
// ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
// ███████║███████╗   ██║   ╚██████╔╝██║
// ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝

//#region [1]
const config = _.requireUpdated(configFileAbsPath)
//#endregion

//#region [2]
const startAnswers = await _.rawPrompt([
  ...defaultStartQuestions,
  ...config.startQuestions,
])

const namesStartVariables = Object.keys(startAnswers).filter(_.isUpper)
// respostas com as keys (name) com letras maiúsculas
const startVariables = _.pick(startAnswers, namesStartVariables)

// NOTE: startAnswers
config['startAnswers'] = startAnswers
//#endregion

// resolvido após responder as perguntas de setup
const workingdirParentDirPathMask = _.t(config.workingdirParentDirPathMask, startVariables)
const workingdirsDirAbsPath = pathJoinWithRoot(workingdirParentDirPathMask)
const entryDirPath = pathToTrabFile

const lookupDirPath = _.t(config.lookupDirPathMask, startVariables)
const lookupDirAbsPath = pathJoinWithRoot(lookupDirPath)

delete config['workingdirParentDirPathMask']
// NOTE: workingdirsDirAbsPath
config['workingdirsDirAbsPath'] = workingdirsDirAbsPath

// NOTE: lookupDirAbsPath
delete config['lookupDirPathMask']
config['lookupDirAbsPath'] = lookupDirAbsPath

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

    if (config.autoOpenBrowser) {
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

  // NOTE: initServer
  config['initServer'] = function initServer(docroot, onProcessClose = () => {}) {
    phpServer.initServer(docroot).on('close', onProcessClose)
    _.addToOnCleanup(phpServer.shutDown.bind(phpServer))
    return phpServer
  }

  // NOTE: stopServer
  config['stopServer'] = function stopServer() {
    return phpServer.shutDown()
  }
}


// ██╗   ██╗████████╗██╗██╗     ███████╗
// ██║   ██║╚══██╔══╝██║██║     ██╔════╝
// ██║   ██║   ██║   ██║██║     ███████╗
// ██║   ██║   ██║   ██║██║     ╚════██║
// ╚██████╔╝   ██║   ██║███████╗███████║
//  ╚═════╝    ╚═╝   ╚═╝╚══════╝╚══════╝

function getRootDirForWorkingdir(wdAbs) {
  return path.join(
    wdAbs,
    ('..' + path.sep).repeat(config.levelsToRootDir))
}

function getHookFor(context) {
  return config[context]
}

async function runHookOn(context, name) {
  if (!context || !context[name]) return

  for (const command of context[name]) {
    if (config.safeMode) {
      const { reply: canRunCommand } = await confirmCmdExecution(command)
      if (!canRunCommand) continue
    }

    _.wrapSyncOutput(() => {
      log(command)
      try {
        // if `command` needs to read from stdin, this not work properly with `set -v` mode
        hshell.runSafe(command)
      } catch (err) {
        log(err)
      }
    })
  }
}


function truncatePath(pathToFile) {
  const homeAbsPath = process.env.HOME

  if (pathToFile.startsWith(homeAbsPath)) {
    return sty.secondary('~') + pathToFile.substr(homeAbsPath.length)
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

  const newEntryDirName = await _.prompt(
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

async function runAt(workingdirAbsPath) {
  if (isDev) { console.info();console.info('<---------------------');console.info(workingdirAbsPath);console.info(); }

  log() // break line
  const { reply: keepRunning } = await _.prompt(
    `Continuar para: ${sty.warning(truncatePath(workingdirAbsPath))}`
  ).confirm()

  if (!keepRunning) return

  let __workingdirAbsPath = workingdirAbsPath
  let entryDirName = path.basename(workingdirAbsPath)
  const userCommandsHooks = getHookFor('commandsForEachRootDir')

  //#region [4.1]
  const rootDirAbsPath = getRootDirForWorkingdir(workingdirAbsPath)
  hshell.enterOnDir(rootDirAbsPath)
  //#endregion

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
  await runHookOn(userCommandsHooks, 'onEnter')
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
    entryDirName = await defineEntryDirName(currLookup, config.levelsToRootDir && entryDirName)

    const currStoredRelease = _.getDeep(currLookup, [entryDirName])
    const isSameVersion = _.getDeep(currStoredRelease, ['_id']) === workingdirLastCommitId
    repeatPrompt = isSameVersion

    if (isSameVersion) {
      log(sty`{success {bold %s} %s {bold %s}}`, '\u{2714}', 'Versão já registrada para', entryDirName)
      const { reply: keepRunning } = await _.prompt(sty.vdanger(
        `Continuar mesmo assim`
      )).confirm({ default: false })

      repeatPrompt = !keepRunning
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
  await runHookOn(userCommandsHooks, 'onBeforeLeave')
  //#endregion
}

;(async function() {

  try {

    const parentDirs = hshell.listDirectoriesFrom(config.workingdirsDirAbsPath)

    const resolvedWorkindirsPath = path.resolve(config.workingdirsDirAbsPath, entryDirPath)
    const workingdirs = hshell.listDirectoriesFrom(resolvedWorkindirsPath) // may throw an error

    //#region [3]
    hshell.createDirIfNotExists(config.lookupDirAbsPath)
    //#endregion

    // directories to ignore when looking for "workingdir"
    const blackListDirectories = [
      config.testsDirAbsPath,
    ]

    _.displayBox([
      `Total: ${sty.bold(parentDirs.length)}`,
      `Encontrados: ${sty.bold(workingdirs.length)}`,
    ])

    for (const workingdirAbsPath of workingdirs) {
      if (blackListDirectories.includes(workingdirAbsPath)) {
        continue
      }

      const code = await runAt(workingdirAbsPath)
      if (code === 401) return
      if (code === 402) return
    }

  } catch (err) {
    console.error(sty.error('[ERROR] ' + err.message))
    if (isDev) console.error(err)
    process.exit(1)
  }

}());

}
