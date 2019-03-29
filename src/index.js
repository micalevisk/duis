const path = require('path')
const shell = require('shelljs')
const _ = require('../lib')

const isDev = process.env.NODE_ENV === 'development'

const pathJoinWithRoot = path.join.bind(null, __dirname, '..', './example')

const CONFIG_PATH = pathJoinWithRoot('duis.config.js')
const config = _.requireUpdated(CONFIG_PATH)

// após ler as respostas de `startQuestions` e filtrar as keys com letras maiúsculas
const startVariables = { TURMA: 'CB01', NICK_ALUNO: '*' }

// resolvido após responder as perguntas de setup
const workingdirParentDirPathMask = _.t(config.workingdirParentDirPathMask, startVariables)
const workingdirsAbsPath = pathJoinWithRoot(workingdirParentDirPathMask)
const classDirPath = 'PHP1/' // o primeiro arg passado ao `duis` CLI

const lookupDirPath = _.t(config.lookupDirPathMask, startVariables)
const lookupAbsPath = pathJoinWithRoot(lookupDirPath)

const testsDirPath = _.t(config.testsDirPathMask, startVariables)
const testsAbsPath = pathJoinWithRoot(testsDirPath)


/******************************************************************************/

/**
 * Considera que o repo do aluno será o diretório
 * pai do "working dir" (diretório do exercício).
 * ie., está no nível anterior
 * @param {string} wdAbsPath
 */
function getSudentDirName(wdAbsPath) {
  return path.basename( path.join(wdAbsPath, '..') )
  /*
  const dirnameExec = shell.exec('dirname ' + wdAbsPath, {silent:true})
  if (dirnameExec.code) throw Error(dirnameExec.stderr)

  const basenameExec = shell.exec('basename ' + dirnameExec.stdout, {silent:true})
  if (basenameExec.code) throw Error(basenameExec.stderr)

  return basenameExec.stdout
  */
}

if (isDev) shell.set('-v')

if (!isDev) { !shell.which('git') && process.exit(1); }


delete config['inspectDirPathMask']
config['inspectDirAbsPath'] = workingdirsAbsPath

delete config['lookupDirPathMask']
config['lookupDirAbsPath'] = lookupAbsPath

delete config['testsDirPathMask']
if ( shell.test('-d', testsAbsPath) ) config['testsDirAbsPath'] = testsAbsPath

// console.dir(config, {depth: null})


shell.mkdir('-p', lookupAbsPath)

const workingdirs = shell.ls('-d', path.join(workingdirsAbsPath, classDirPath))


for (const workingdir of workingdirs) {
  console.info()
  console.info('<---------------------')
  console.info(workingdir)

  // if (shell.test('-f', path.join(lookupDirAbsPath, )))

  shell.cd(workingdir)
  console.log( process.cwd() )
  const studentGitRepoDirName = getSudentDirName(workingdir)
  const studentLookupAbsPath = path.join(lookupAbsPath, studentGitRepoDirName + '.json')
  // shell.touch(studentLookupAbsPath) // cria o arquivo de lookup para o aluno atual (se não existir)

  // const lastCommitId = shell.exec(`git --git-dir "${'.'}" rev-list -1 --until="2019-03-27" --abbrev-commit master`, {silent:true})
  const commitLimitDate = '2019-03-27' // resposta da pergunta
  const lastCommitId = shell.exec(`git rev-list -1 --until="${commitLimitDate}" --abbrev-commit remotes/origin/master`, {silent:true}).stdout.trim()

  const currLookup = _.loadJSON(studentLookupAbsPath)
  if (currLookup.id === lastCommitId) continue

  console.log('passou')
  // _.writeJSON(studentLookupAbsPath, { id: lastCommitId, })

  /*
  const [...workingdirFiles] = shell.ls('*')
  console.log(workingdirFiles)
  */
}
