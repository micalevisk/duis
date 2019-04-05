//@ts-check
const path = require('path')
const hshell = require('./human-shell')
const { utils: _, openBrowser } = require('../lib')

const isDev = process.env.NODE_ENV === 'development'

// if (isDev) hshell.set('-v')
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
config['startAnswers'] = { commitLimitDate: '2019-03-31' }

// resolvido após responder as perguntas de setup
const workingdirParentDirPathMask = _.t(config.workingdirParentDirPathMask, startVariables)
const workingdirsDirAbsPath = pathJoinWithRoot(workingdirParentDirPathMask)
const entryDirPath = 'PHP1/' // o primeiro arg passado ao `duis` CLI

const lookupDirPath = _.t(config.lookupDirPathMask, startVariables)
const lookupDirAbsPath = pathJoinWithRoot(lookupDirPath)

if (config.test && config.test.commandToRun) {
  const testsDirPath = _.t(config.test.dirPathMask, startVariables)
  const testsDirAbsPath = pathJoinWithRoot(testsDirPath)

  if ( hshell.isDirectory(testsDirAbsPath) ) {
    const commandToTest = config.test.commandToRun
    const fileExtName = config.test.fileExtName || ''

    function commandOnTest(testFilename, ...args) {
      const fileToTestAbsPath = path.format({
        dir: testsDirAbsPath,
        base: testFilename + fileExtName
      })

      if (hshell.isReadableFile(fileToTestAbsPath))
        return `${commandToTest} ${fileToTestAbsPath} ${args.join(' ')}`
    }

    config['commandOnTest'] = commandOnTest
  }

  delete config['test']
}

if (config.serverPort) {
  // TODO: instanciar o server, sem "iniciá-lo", i.e., deixar o diretório a ser aberto pendente
}

if (config.browser && config.browser.name) {
  config['openBrowserAt'] = (URL, onProcessClose) =>
    openBrowser({ name: config.browser.name, path: URL, opts: config.browser.opts, onProcessClose })
} else {
  config['openBrowserAt'] = () => {}
}


function getHookFor(context) {
  return config[context]
}


function getParentDirFor(wdAbs) {
  return path.join(wdAbs, ('..' + path.sep).repeat(config.levelsToParentDir))
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

/******************************************************************************/


if (!isDev) { !hshell.hasProgram('git') && process.exit(1); }


delete config['workingdirParentDirPathMask']
config['workingdirsDirAbsPath'] = workingdirsDirAbsPath

delete config['lookupDirPathMask']
config['lookupDirAbsPath'] = lookupDirAbsPath


// console.dir(config, {depth: null})

//#region [3]
hshell.createDirIfNotExists(config.lookupDirAbsPath)
//#endregion

const workingdirs = hshell.listDirectoriesFrom( path.join(workingdirsDirAbsPath, entryDirPath) )


for (const workingdir of workingdirs) {
  if (isDev) console.info();console.info('<---------------------');console.info(workingdir);console.info()

  const userCommandsHooks = getHookFor('commandsForEachParentDir')

  const parentDirAbsPath = getParentDirFor(workingdir)
  hshell.enterOnDir(parentDirAbsPath)

  //#region [4.2]
  runHookOn(userCommandsHooks, 'onEnter')
  //#endregion

  //#region [4.3]
  const parentDirName = path.basename(parentDirAbsPath)
  const parentLookupDirAbsPath = path.join(lookupDirAbsPath, parentDirName + '.json')
  //#endregion

  //#region [4.1]
  hshell.enterOnDir(workingdir)
  //#endregion

  //#region [4.3]
  const lastCommitId = hshell.runSafe(`git rev-list -1 --until="${config.startAnswers.commitLimitDate}" --abbrev-commit remotes/origin/master`)
  const currLookup = _.loadJSON(parentLookupDirAbsPath)
  if (currLookup.id === lastCommitId) continue
  //#endregion

  console.log(`passou[${lastCommitId}]`)

  // TODO: [4.4]
  // TODO: [4.5]
  const onBrowserClose = (...args) => console.log('BROWSER FECHADO', args)
  config.openBrowserAt('file:///' + workingdir, onBrowserClose)//§
  console.log('>>>>>>>>.')
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
