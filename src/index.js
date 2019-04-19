const path = require('path')
const hshell = require('./human-shell')
const { utils: _, sty, openBrowser, PHPServer } = require('../lib')

const isDev = process.env.NODE_ENV === 'development'

/** @see https://nodejs.org/api/process.html#process_event_unhandledrejection */
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at', p, 'reason:', reason)
  process.exit(1)
});


if (isDev) hshell.set('-v')
hshell.config.silent = true


/**
 * @param {string} configFileAbsPath
 * @param {string} pathToTrabFile
 */
module.exports = async function duisAbove(configFileAbsPath, pathToTrabFile) {

if (!hshell.isReadableFile(configFileAbsPath)) {
  console.log(sty.error`File not found: %s`, configFileAbsPath)
  return 404
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
//#endregion

// TODO: [2]
// respostas com as keys (name) com letras maiúsculas
const startVariables = { TURMA: 'CB01', NICK_ALUNO: '*' }
// NOTE: startAnswers
config['startAnswers'] = { commitLimitDate: new Date().toISOString().substr(0, 10) }

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

if (config.browser && config.browser.name) {
  const browserName = config.browser.name
  // NOTE: openBrowserAt
  config['openBrowserAt'] = async function openBrowserAt(URL, onProcessClose) {
    const createBrowserProcess = openBrowser.bind(openBrowser, {
      name: browserName,
      path: URL,
      opts: config.browser.opts, onProcessClose,
    })

    if (config.autoOpenBrowser) {
      return createBrowserProcess()
    }

    const { reply: canOpenBrowser } = await _.prompt(
      sty`Abrir o navegador {yellow ${browserName}} em {blue ${URL}}`
    ).list({ choices: ['sim', 'não'], filter: input => input === 'sim' })

    if (canOpenBrowser) {
      return createBrowserProcess()
    }
  }
} else {
  // NOTE: openBrowserAt
  config['openBrowserAt'] = () => {}
}

if (config.serverPort) {
  const phpServer = new PHPServer({host: 'localhost', port: config.serverPort})

  // NOTE: initServer
  config['initServer'] = function initServer(docroot, onProcessClose = () => {}) {
    phpServer.initServer(docroot).terminal.on('close', onProcessClose)
    _.addHandlerToSIGINT(phpServer.shutDown) // making sure the server will close
    return phpServer
  }
}


function getHookFor(context) {
  return config[context]
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

function getLastCommit({ until = '', parent = 'remotes/origin/master', ref = '.' }) {
  return hshell
    .runSafe(`git rev-list -1 --until="${until}" --abbrev-commit ${parent} ${ref}`)
}

async function confirmExecution(command, props = {}) {
  return _.prompt(`Executar ${sty.danger(command)}`)
    .confirm(props)
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


// ██████╗ ██╗   ██╗███╗   ██╗
// ██╔══██╗██║   ██║████╗  ██║
// ██████╔╝██║   ██║██╔██╗ ██║
// ██╔══██╗██║   ██║██║╚██╗██║
// ██║  ██║╚██████╔╝██║ ╚████║
// ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

async function runAt(workingdirAbsPath) {
  if (isDev) { console.info();console.info('<---------------------');console.info(workingdirAbsPath);console.info(); }

  let __workingdirAbsPath = workingdirAbsPath
  const entryDirName = path.basename(workingdirAbsPath)
  const userCommandsHooks = getHookFor('commandsForEachRootDir')

  //#region [4.1]
  const rootDirAbsPath = getRootDirForWorkingdir(workingdirAbsPath)
  hshell.enterOnDir(rootDirAbsPath)
  //#endregion

  //#region [4.2]
  const rootLastCommitId = getLastCommit({until: config.startAnswers.commitLimitDate})
  if (!rootLastCommitId) return // no commits
  console.log(sty`{secondary Último commit no root: {bold %s}}`, rootLastCommitId)

  const rootDirName = path.basename(rootDirAbsPath)
  const rootLookupDirAbsPath = path.join(lookupDirAbsPath, rootDirName + '.json')
  const currLookup = _.loadJSON(rootLookupDirAbsPath)
  if (_.getDeep(currLookup, ['_id']) === rootLastCommitId) {
    console.log(sty.danger`✗ Nenhuma atualização no diretório`)
    return
  }
  //#endregion

  // making sure that the `__workingdirAbsPath` is a valid directory
  if (!hshell.isDirectory(workingdirAbsPath)) {
    __workingdirAbsPath = path.dirname(workingdirAbsPath)
  }

  //#region [4.3]
  await runHookOn(userCommandsHooks, 'onEnter')
  //#endregion

  //#region [4.4]
  hshell.enterOnDir(__workingdirAbsPath)
  console.log('Em: ' + sty.warning(__workingdirAbsPath))
  //#endregion

  //#region [4.5]
  const workingdirLastCommitId = getLastCommit({until: config.startAnswers.commitLimitDate})
  if (!workingdirLastCommitId) return // no commits
  console.log(sty`{secondary Último commit: {bold %s}}`, workingdirLastCommitId)

  const currStoredRelease = _.getDeep(currLookup, ['releases', entryDirName])
  if (_.getDeep(currStoredRelease, ['_id']) === workingdirLastCommitId) {
    console.log(sty.success`🗸 Versão já registrada`)
    return
  }
  //#endregion

  if (config.initServer) {
    //#region [4.6]
    const serverAddress = 'http://' + config.initServer(__workingdirAbsPath).hostaddress
    await config.openBrowserAt(serverAddress)
    //#endregion
  } else {
    //#region [4.7]
    await config.openBrowserAt('file:///' + workingdirAbsPath)
    //#endregion
  }

  //#region [4.8]
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

  // TODO: [4.9]

  //#region [4.10]
  const { reply: updateLookup } = await _.prompt(`Finalizar avaliação de ${sty.emph(rootDirName)}?`)
    .list({ choices: ['sim', 'não salvar alterações'], filter: input => input === 'sim' })

  if (updateLookup) {
    _.setDeep(currLookup, ['_id'], rootLastCommitId)
    const workingdirLookup = {
      _id: workingdirLastCommitId,
      prompts: [],
    }
    _.setDeep(currLookup, ['releases', entryDirName], workingdirLookup)
    _.writeJSON(rootLookupDirAbsPath, currLookup)
  }
  //#endregion
}

;(async function() {

  //#region [3]
  hshell.createDirIfNotExists(config.lookupDirAbsPath)
  //#endregion

  //#region [4]
  const resolvedWorkindirsPath = path.resolve(config.workingdirsDirAbsPath, entryDirPath)
  const workingdirs = hshell.listDirectoriesFrom(resolvedWorkindirsPath)
  //#endregion

  for (const workingdirAbsPath of workingdirs) {
    await runAt(workingdirAbsPath)
  }

}());

}
