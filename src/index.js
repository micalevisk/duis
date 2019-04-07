//@ts-check
const path = require('path')
const hshell = require('./human-shell')
const { utils: _, openBrowser } = require('../lib')

const isDev = process.env.NODE_ENV === 'development'

if (isDev) hshell.set('-v')
hshell.config.silent = true

const pathJoinWithRoot = path.join.bind(null, __dirname, '..', './example')

//#region [1]
const CONFIG_PATH = pathJoinWithRoot('duis.config.js')
const config = _.requireUpdated(CONFIG_PATH)
//#endregion

// TODO: [2]
// respostas com as keys (name) com letras maiúsculas
const startVariables = { TURMA: 'CB01', NICK_ALUNO: '*' }
// respostas restantes
config['startAnswers'] = { commitLimitDate: new Date().toISOString().substr(0, 10) }

// resolvido após responder as perguntas de setup
const workingdirParentDirPathMask = _.t(config.workingdirParentDirPathMask, startVariables)
const workingdirsDirAbsPath = pathJoinWithRoot(workingdirParentDirPathMask)
const entryDirPath = _.trimPathSeparator('HTML/') // o primeiro arg passado ao `duis` CLI

const lookupDirPath = _.t(config.lookupDirPathMask, startVariables)
const lookupDirAbsPath = pathJoinWithRoot(lookupDirPath)

if (config.test && config.test.commandToRun) {
  const testsDirPath = _.t(config.test.dirPathMask, startVariables)
  const testsDirAbsPath = pathJoinWithRoot(testsDirPath)

  if ( hshell.isDirectory(testsDirAbsPath) ) {
    const commandToTest = config.test.commandToRun
    const fileExtName = config.test.fileExtName || ''

    config['commandOnTest'] = function commandOnTest(testFilename, ...args) {
      const fileToTestAbsPath = path.format({
        dir: testsDirAbsPath,
        base: testFilename + fileExtName
      })

      if (hshell.isReadableFile(fileToTestAbsPath))
        return `${commandToTest} ${fileToTestAbsPath} ${args.join(' ')}`
    }
  }

  delete config['test']
}

if (config.browser && config.browser.name) {
  config['openBrowserAt'] = function openBrowserAt(URL, onProcessClose) {
    const createBrowserProcess = openBrowser.bind(openBrowser, {
      name: config.browser.name,
      path: URL,
      opts: config.browser.opts, onProcessClose,
    })

    if (config.autoOpenBrowser) {
      return createBrowserProcess()
    }

    // TODO: perguntar
  }
} else {
  config['openBrowserAt'] = () => {}
}


function getHookFor(context) {
  return config[context]
}


function getRootDirForWorkingdir(wdAbs) {
  return path.join(wdAbs, ('..' + path.sep).repeat(config.levelsToRootDir))
}

function runHookOn(context, name) {
  if (!context || !context[name]) return;
  for (const command of context[name]) {
    //if (config.safeMode) // TODO: perguntar se deseja executar `command`
		// FIXME: programas que esperam entrada do usuário ficam assíncronos
    _.wrapSyncOutput(() => {
      console.log(command)
      try {
        hshell.runSafe(command)
      } catch (err) {
        console.log(err)
      }
    })
  }
}

function getLastCommit({ until, parent = 'remotes/origin/master', ref = '.' }) {
  return  hshell
    .runSafe(`git rev-list -1 --until="${until}" --abbrev-commit ${parent} ${ref}`)
}

/******************************************************************************/


if (!isDev) { !hshell.hasProgram('git') && process.exit(1); }


delete config['workingdirParentDirPathMask']
config['workingdirsDirAbsPath'] = workingdirsDirAbsPath

delete config['lookupDirPathMask']
config['lookupDirAbsPath'] = lookupDirAbsPath


//#region [3]
hshell.createDirIfNotExists(config.lookupDirAbsPath)
//#endregion

//#region [4]
const resolvedWorkindirsPath = path.join(config.workingdirsDirAbsPath, entryDirPath)
const workingdirs = hshell.listDirectoriesFrom(resolvedWorkindirsPath)
//#endregion

for (const workingdirAbsPath of workingdirs) {
  if (isDev) console.info();console.info('<---------------------');console.info(workingdirAbsPath);console.info()

  const userCommandsHooks = getHookFor('commandsForEachRootDir')

  //#region [4.1]
  const rootDirAbsPath = getRootDirForWorkingdir(workingdirAbsPath)
  hshell.enterOnDir(rootDirAbsPath)
  //#endregion

  //#region [4.2]
  runHookOn(userCommandsHooks, 'onEnter')
  //#endregion

  //#region [4.3]
  hshell.enterOnDir(workingdirAbsPath)
  //#endregion

  //#region [4.4]
  const rootDirName = path.basename(rootDirAbsPath)
  const rootLookupDirAbsPath = path.join(lookupDirAbsPath, rootDirName + '.json')

  const rootLastCommitId = getLastCommit({until: config.startAnswers.commitLimitDate})
  if (!rootLastCommitId.trim()) throw Error(`Nenhuma commit feito em: ${workingdirAbsPath}`)

  const currLookup = _.loadJSON(rootLookupDirAbsPath)
  if (currLookup._id === rootLastCommitId) continue
  console.log(`passou[${rootLastCommitId}]`)

  const currStoredRelease = _.getDeepValue(currLookup, ['releases', entryDirPath])
  if (currStoredRelease && currStoredRelease._id === rootLastCommitId) continue
  //#endregion

  //#region [4.5]
  if (config.serverPort) {
    // const serverHostname =
    // config.openBrowserAt(serverHostname)
  }
  //#endregion

  // TODO: [4.5]
  // config.openBrowserAt('file:///' + workingdir)

  //#region [4.6]
  if (!isDev)
  if (config.commandOnTest) {
    const commandToRunTest = config.commandOnTest( path.basename(entryDirPath) )
    if (commandToRunTest) {
      // TODO: confirmar se deseja rodar o comando `commandToRunTest`

      _.wrapSyncOutput(() => {
        hshell.exec(commandToRunTest)
      })
    }
  }
  //#endregion

  // TODO: [4.7]

  // TODO: [4.8]

  /*
  _.writeJSON(parentLookupDirAbsPath, { id: lastCommitId, })
  const [...workingdirFiles] = hshell.ls('*')
  console.log(workingdirFiles)
  */

}

// console.dir(config, {depth: null})
