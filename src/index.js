const path = require('path')
const hshell = require('./human-shell')
const { utils: _, sty, openBrowser, PHPServer } = require('../lib')

const isDev = process.env.NODE_ENV === 'development'


if (isDev) hshell.set('-v')
hshell.config.silent = true


/**
 * @param {string} configFileAbsPath
 * @param {string} pathToTrabFile
 */
module.exports = async function duisAbove(configFileAbsPath, pathToTrabFile) {

if ( !hshell.isReadableFile(configFileAbsPath) ) {
  console.log(sty`{error %s {bold %s}}`, 'File not found:', configFileAbsPath)
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

// NOTE: openBrowserAt
config['openBrowserAt'] = () => {}
// NOTE: killBrowser
config['killBrowser'] = () => {}
if (config.browser && config.browser.name) {
  const browserName = config.browser.name
  // NOTE: openBrowserAt
  config['openBrowserAt'] = async function openBrowserAt(URL, onProcessClose) {
    const _openBrowser = () => {
      const browserProcess = openBrowser({
        name: browserName,
        path: URL,
        opts: config.browser.opts, onProcessClose,
      })

      // NOTE: killBrowser
      config['killBrowser'] = function killBrowser() {
        if (browserProcess) {
          browserProcess.kill('SIGTERM')
          browserProcess.kill('SIGINT')
        }
      }

      return browserProcess
    }

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
    _.addHandlerToSIGINT(phpServer.shutDown.bind(phpServer)) // making sure the server will close
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
      const { reply: canRunCommand } = await confirmExecution(command)
      if (!canRunCommand) continue
    }

    _.wrapSyncOutput(() => {
      console.log(command)
      try {
        // if `command` needs to read from stdin, this not work properly with `set -v` mode
        hshell.runSafe(command)
      } catch (err) {
        console.log(err)
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

async function confirmExecution(command, props = {}) {
  return _.prompt(`Executar ${sty.danger(command)}`)
    .confirm(props)
}

async function defineEntryDirName(currLookup) {
  const releasesOnLookupfile = Object.keys(currLookup);
  return _.prompt(
    `Identificador desse trabalho no arquivo de lookup`
  ).suggest({
    suggestions: releasesOnLookupfile,
    validate: answer => !answer.trim() ? 'Informe algo' : true
  }).then(({ reply }) => reply.trim())
}


// ██████╗ ██╗   ██╗███╗   ██╗
// ██╔══██╗██║   ██║████╗  ██║
// ██████╔╝██║   ██║██╔██╗ ██║
// ██╔══██╗██║   ██║██║╚██╗██║
// ██║  ██║╚██████╔╝██║ ╚████║
// ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

async function runAt(workingdirAbsPath) {
  if (isDev) { console.info();console.info('<---------------------');console.info(workingdirAbsPath);console.info(); }

  const { reply: keepRunning } = await _.prompt(
    `Continuar para: ${sty.warning(truncatePath(workingdirAbsPath))}`
  ).confirm()

  if (!keepRunning) return
  console.log() // break line

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
  console.log(sty`{secondary %s {bold %s}}`, 'Último commit no root:', rootLastCommitId)

  let rootDirName = path.basename(rootDirAbsPath)

  let rootLookupFileAbsPath = path.join(config.lookupDirAbsPath, rootDirName + '.json')
  if ( !hshell.isReadableFile(rootLookupFileAbsPath) ) {
    console.log(sty`{error %s {bold %s}}`, 'File not found:', rootLookupFileAbsPath)

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
      const { reply: lookupFilename } = await _.prompt(
        `Informe o nome do arquivo a ser criado em ${sty.emph(truncatePath(config.lookupDirAbsPath))} ${sty.secondary('[sem a extensão]')}`)
        .input({
          default: path.basename(rootLookupFileAbsPath, '.json'),
          validate(input) {
            if (!input.toLowerCase().trim()) return 'Informe algo'
            return true
          }
        })

      rootLookupFileAbsPath = path.join(config.lookupDirAbsPath, lookupFilename + '.json')
    }

    hshell.createFileIfNotExists(rootLookupFileAbsPath)
    rootDirName = path.basename(rootLookupFileAbsPath, '.json')
  }

  const currLookup = _.loadJSON(rootLookupFileAbsPath)
  // if (_.getDeep(currLookup, ['_id']) === rootLastCommitId) {
  //   console.log(sty.danger`✗ Nenhuma atualização no diretório`)
  //   return
  // }
  //#endregion

  // making sure that the `__workingdirAbsPath` is a valid directory
  if (!hshell.isDirectory(workingdirAbsPath)) {
    __workingdirAbsPath = path.dirname(workingdirAbsPath)
  }

  //#region [4.2]
  await runHookOn(userCommandsHooks, 'onEnter')
  //#endregion

  //#region [4.3]
  hshell.enterOnDir(__workingdirAbsPath)
  console.log(sty`{warning {bold %s} %s}`, 'Em:', truncatePath(__workingdirAbsPath))
  //#endregion

  //#region [4.4]
  const workingdirLastCommitId = getLastCommit({until: config.startAnswers.commitLimitDate})
  if (!workingdirLastCommitId) return // no commits
  console.log(sty`{secondary %s {bold %s}}`, 'Último commit:', workingdirLastCommitId)

  entryDirName = await defineEntryDirName(currLookup)

  const currStoredRelease = _.getDeep(currLookup, [entryDirName])
  if (_.getDeep(currStoredRelease, ['_id']) === workingdirLastCommitId) {
    console.log(sty`{success {bold %s} %s {bold %s}}`, '🗸', 'Versão já registrada para', entryDirName)
    return 200
  }
  //#endregion

  if (config.initServer) {
    //#region [4.5]
    const serverAddress = 'http://' + config.initServer(__workingdirAbsPath).hostaddress
    console.log(sty`{success %s {bold %s}}`, 'Server iniciado em:', serverAddress)
    await config.openBrowserAt(serverAddress)
    //#endregion
  } else {
    //#region [4.6]
    await config.openBrowserAt('file:///' + workingdirAbsPath)
    //#endregion
  }

  //#region [4.7]
  if (config.commandOnTest) {
    const commandToRunTest = config.commandOnTest(entryDirName)
    if (commandToRunTest) {
      const { reply: canRunTests } = await confirmExecution(commandToRunTest)
      if (canRunTests) {
        _.wrapSyncOutput(() =>
          hshell.exec(commandToRunTest, { silent: false }))
      }
    } else {
      console.log(sty`{debug %s {red %s}}`, 'Nenhum teste para', entryDirName)
    }
  }
  //#endregion

  for (let repeatPromp = true; repeatPromp; ) {
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
        prompts: answersWorkingdirQuestions &&
                 _.mapPairsToObj(Object.entries(answersWorkingdirQuestions), ['q', 'a']),
      }
      _.setDeep(currLookup, [entryDirName], workingdirLookup)
      _.writeJSON(rootLookupFileAbsPath, currLookup)
    }

    const { reply: mustRepeatPrompt } = await _.prompt(
      `Reavaliar ` + sty.secondary`-- definindo outro identificador`
    ).confirm({ default: false })

    repeatPromp = mustRepeatPrompt
    if (repeatPromp) {
      entryDirName = await defineEntryDirName(currLookup)
    }
  }

  config.stopServer()
  await runHookOn(userCommandsHooks, 'onBeforeLeave')
  //#endregion

  //#region [4.10]
  config.killBrowser()
  //#endregion
}

;(async function() {

  try {

    const resolvedWorkindirsPath = path.resolve(config.workingdirsDirAbsPath, entryDirPath)
    const workingdirs = hshell.listDirectoriesFrom(resolvedWorkindirsPath) // may throw an error

    //#region [3]
    hshell.createDirIfNotExists(config.lookupDirAbsPath)
    //#endregion

    // directories to ignore when looking for "workingdir"
    const blackListDirectories = [
      config.testsDirAbsPath,
    ]

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
