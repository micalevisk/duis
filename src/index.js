const path = require('path')
const hshell = require('./human-shell')
const { utils: _, log, openBrowser, PHPServer } = require('../lib')

const isDev = process.env.NODE_ENV === 'development'

// if (isDev) hshell.set('-v')
hshell.config.silent = true

const pathJoinWithRoot = path.join.bind(null, __dirname, '..', './example')//§


// ███████╗███████╗████████╗██╗   ██╗██████╗
// ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
// ███████╗█████╗     ██║   ██║   ██║██████╔╝
// ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
// ███████║███████╗   ██║   ╚██████╔╝██║
// ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝

//#region [1]
const CONFIG_PATH = pathJoinWithRoot('duis.config.js')
const config = _.requireUpdated(CONFIG_PATH)
//#endregion

// TODO: [2]
// respostas com as keys (name) com letras maiúsculas
const startVariables = { TURMA: 'CB01', NICK_ALUNO: '*' }
// NOTE: startAnswers
config['startAnswers'] = { commitLimitDate: new Date().toISOString().substr(0, 10) }

// resolvido após responder as perguntas de setup
const workingdirParentDirPathMask = _.t(config.workingdirParentDirPathMask, startVariables)
const workingdirsDirAbsPath = pathJoinWithRoot(workingdirParentDirPathMask)
const entryDirPath = _.trimPathSeparator('PHP1/') // o primeiro arg passado ao `duis` CLI

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
      `Abrir o navegador ${log.other(browserName)} em ${log.info(URL)}`
    ).confirm()

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
  return _.prompt(`Executar ${log.error(command)}`)
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

// if (!isDev) { !hshell.hasProgram('git') && process.exit(1); }


//#region [3]
hshell.createDirIfNotExists(config.lookupDirAbsPath)
//#endregion

//#region [4]
const resolvedWorkindirsPath = path.join(config.workingdirsDirAbsPath, entryDirPath)
const workingdirs = hshell.listDirectoriesFrom(resolvedWorkindirsPath)
//#endregion


;(async () => {

for (const workingdirAbsPath of workingdirs) {
  // if (isDev) console.info();console.info('<---------------------');console.info(workingdirAbsPath);console.info()

  const userCommandsHooks = getHookFor('commandsForEachRootDir')

  //#region [4.1]
  const rootDirAbsPath = getRootDirForWorkingdir(workingdirAbsPath)
  hshell.enterOnDir(rootDirAbsPath)
  console.log('Em: ' + log.warning(rootDirAbsPath))
  //#endregion

  //#region [4.2]
  await runHookOn(userCommandsHooks, 'onEnter')
  //#endregion

  //#region [4.3]
  hshell.enterOnDir(workingdirAbsPath)
  //#endregion

  //#region [4.4]
  const rootDirName = path.basename(rootDirAbsPath)
  const rootLookupDirAbsPath = path.join(lookupDirAbsPath, rootDirName + '.json')

  const rootLastCommitId = getLastCommit({until: config.startAnswers.commitLimitDate})
  if (!rootLastCommitId.trim()) continue

  const currLookup = _.loadJSON(rootLookupDirAbsPath)
  if (currLookup._id === rootLastCommitId) continue
  console.log(`passou[${rootLastCommitId}]`)

  const currStoredRelease = _.getDeepValue(currLookup, ['releases', entryDirPath])
  if (currStoredRelease && currStoredRelease._id === rootLastCommitId) continue
  //#endregion

  //#region [4.5]
  if (config.initServer) {
    const serverAddress = 'http://' + config.initServer(workingdirAbsPath).hostaddress
    await config.openBrowserAt(serverAddress)
  }
  //#endregion

  //#region [4.6]
  await config.openBrowserAt('file:///' + workingdirAbsPath)
  //#endregion

  //#region [4.7]
  if (config.commandOnTest) {
    const commandToRunTest = config.commandOnTest(entryDirPath)
    if (commandToRunTest) {
      await confirmExecution(commandToRunTest)
      _.wrapSyncOutput(() => {
        hshell.exec(commandToRunTest, { silent: false })
      })
    } else {
      console.log( log.debug(`Nenhum teste para '${entryDirPath}'`) )
    }
  }
  //#endregion

  // TODO: [4.8]
  await _.prompt('Finalizar avaliação deste aluno?').list({ choices: ['sim'] })

  /*
  _.writeJSON(parentLookupDirAbsPath, { id: lastCommitId, })
  const [...workingdirFiles] = hshell.ls('*')
  console.log(workingdirFiles)
  */

}

})();

// console.dir(config, {depth: null})
