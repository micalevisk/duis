const path = require('path')
const shell = require('shelljs')
const _ = require('../lib')

const isDev = process.env.NODE_ENV === 'development'

// if (isDev) shell.set('-v')

const pathJoinWithRoot = path.join.bind(null, __dirname, '..', './example')

const CONFIG_PATH = pathJoinWithRoot('duis.config.js')
const config = _.requireUpdated(CONFIG_PATH)

// após ler as respostas de `startQuestions` e filtrar as keys com letras maiúsculas
const startVariables = { TURMA: 'CB01', NICK_ALUNO: '*' }

// resolvido após responder as perguntas de setup
const workingdirParentDirPathMask = _.t(config.workingdirParentDirPathMask, startVariables)
const workingdirsDirAbsPath = pathJoinWithRoot(workingdirParentDirPathMask)
const classDirPath = 'PHP1/' // o primeiro arg passado ao `duis` CLI

const lookupDirPath = _.t(config.lookupDirPathMask, startVariables)
const lookupDirAbsPath = pathJoinWithRoot(lookupDirPath)

if (config.test && config.test.commandToRun) {
  const testsDirPath = _.t(config.test.dirPathMask, startVariables)
  const testsDirAbsPath = pathJoinWithRoot(testsDirPath)

  if (shell.test('-d', testsDirAbsPath)) {
    const commandToTest = config.test.commandToRun
    const fileExtName = config.test.fileExtName || ''

    function commandOnTest(testFilename, ...args) {
      const fileToTestAbsPath = path.format({
        dir: testsDirAbsPath,
        base: testFilename + fileExtName
      })

      if (shell.test('-f', fileToTestAbsPath))
        return `${commandToTest} ${fileToTestAbsPath} ${args.join(' ')}`
    }

    config['commandOnTest'] = commandOnTest
  }

  delete config['test']
}


/******************************************************************************/

function getSudentDirName(wdAbsPath) {
  return path.basename(
    path.join(wdAbsPath,
             '../'.repeat(config.levelsToParentDir))
  )
  /*
  const dirnameExec = shell.exec('dirname ' + wdAbsPath, {silent:true})
  if (dirnameExec.code) throw Error(dirnameExec.stderr)

  const basenameExec = shell.exec('basename ' + dirnameExec.stdout, {silent:true})
  if (basenameExec.code) throw Error(basenameExec.stderr)

  return basenameExec.stdout
  */
}


if (!isDev) { !shell.which('git') && process.exit(1); }


delete config['workingdirParentDirPathMask']
config['workingdirsDirAbsPath'] = workingdirsDirAbsPath

delete config['lookupDirPathMask']
config['lookupDirAbsPath'] = lookupDirAbsPath


// console.dir(config, {depth: null})


shell.mkdir('-p', config.lookupDirAbsPath)

const workingdirs = shell.ls('-d', path.join(workingdirsDirAbsPath, classDirPath))


for (const workingdir of workingdirs) {

  if (isDev) console.info();console.info('<---------------------');console.info(workingdir);console.info()

  // if (shell.test('-f', path.join(lookupDirAbsPath, )))

  shell.cd(workingdir)
  const studentGitRepoDirName = getSudentDirName(workingdir)
  const studentlookupDirAbsPath = path.join(lookupDirAbsPath, studentGitRepoDirName + '.json')
  // shell.touch(studentlookupDirAbsPath) // cria o arquivo de lookup para o aluno atual (se não existir)

  // const lastCommitId = shell.exec(`git --git-dir "${'.'}" rev-list -1 --until="2019-03-27" --abbrev-commit master`, {silent:true})
  const commitLimitDate = '2019-03-27' // resposta da pergunta
  const lastCommitId = shell.exec(`git rev-list -1 --until="${commitLimitDate}" --abbrev-commit remotes/origin/master`, {silent:true}).stdout.trim()

  const currLookup = _.loadJSON(studentlookupDirAbsPath)
  if (currLookup.id === lastCommitId) continue

  console.log('passou')

  // TODO: [4.3]

  // TODO: [4.4]

  //#region [4.5]
  if (!isDev)
  if (config.commandOnTest) {
    const commandToRunTest = config.commandOnTest( path.basename(classDirPath) )
    if (commandToRunTest) {
      // TODO: confirmar se deseja rodar o comando `commandToRunTest`

      _.wrapSyncOutput(() => {
        shell.exec(commandToRunTest)
      })
    }
  }
  //#endregion

  // TODO: [4.6]

  // TODO: [4.7]

  /*
  _.writeJSON(studentlookupDirAbsPath, { id: lastCommitId, })
  const [...workingdirFiles] = shell.ls('*')
  console.log(workingdirFiles)
  */

}

// console.dir(config, {depth: null})
