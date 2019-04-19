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

if ( !hshell.isReadableFile(configFileAbsPath) ) {
  console.log(sty`{error %s {bold %s}}`, 'File not found:', configFileAbsPath)
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

  console.log(sty`{warning %s {bold %s}}`, 'Para:', workingdirAbsPath)

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
  console.log(sty`{secondary %s {bold %s}}`, 'Último commit no root:', rootLastCommitId)

  let rootDirName = path.basename(rootDirAbsPath)

  let rootLookupFileAbsPath = path.join(config.lookupDirAbsPath, rootDirName + '.json')
  if ( !hshell.isReadableFile(rootLookupFileAbsPath) ) {
    console.log(sty`{error %s {bold %s}}`, 'File not found:', rootLookupFileAbsPath)

    const { reply } = await _.prompt(
      `Digitar um ou selecionar um arquivo de lookup para ${sty.emph(rootDirName)}?`)
      .list({ choices: ['selecionar', 'criar'] })

    if (reply === 'selecionar') {
      const { reply } = await _.prompt(
        'Selecione o arquivo de lookup:')
        .fuzzypath({
          excludePath: nodePath => nodePath.startsWith('node_modules'),
          itemType: 'file',
          default: rootLookupFileAbsPath,
          rootPath: rootDirAbsPath,
          suggestOnly: false,
        });

      rootLookupFileAbsPath = reply
    } else {
      const { reply: lookupFilename } = await _.prompt(
        `Informe o nome do arquivo a ser criado em ${sty.emph(config.lookupDirAbsPath)} ${sty.secondary('[sem a extensão]')}`)
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
  console.log(sty`{warning %s %s}`, 'Em:', workingdirAbsPath)
  //#endregion

  //#region [4.4]
  const workingdirLastCommitId = getLastCommit({until: config.startAnswers.commitLimitDate})
  if (!workingdirLastCommitId) return // no commits
  console.log(sty`{secondary %s {bold %s}}`, 'Último commit:', workingdirLastCommitId)

  const currStoredRelease = _.getDeep(currLookup, [entryDirName])
  if (_.getDeep(currStoredRelease, ['_id']) === workingdirLastCommitId) {
    console.log(sty`{success %s {bold %s}}`, '🗸 Versão já registrada para', entryDirName)
    return 200
  }
  //#endregion

  if (config.initServer) {
    //#region [4.5]
    const serverAddress = 'http://' + config.initServer(__workingdirAbsPath).hostaddress
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

  // TODO: [4.8]

  //#region [4.9]
  const { reply: updateLookup } = await _.prompt(
    `Finalizar avaliação de ${sty.emph(rootDirName)}?`)
    .list({ choices: ['sim', 'não salvar alterações'], filter: input => input === 'sim' })

  if (updateLookup) {
    const workingdirLookup = {
      _id: workingdirLastCommitId,
      prompts: [],
    }
    _.setDeep(currLookup, [entryDirName], workingdirLookup)
    _.writeJSON(rootLookupFileAbsPath, currLookup)
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

  // directories to ignore when looking for "workingdir"
  const blackListDirectories = [
    config.testsDirAbsPath,
  ]

  for (const workingdirAbsPath of workingdirs) {
    if (blackListDirectories.includes(workingdirAbsPath)) {
      continue
    }

    console.log();
    const code = await runAt(workingdirAbsPath)
    if (code === 401) return
    if (code === 402) return
  }

}());

}
