const workingdirQuestions = require('./duis.questions')

// perguntas cuja respostas definirão mais variáveis na config abaixo
// Se `name` estiver com todas as letras em maiúsculas, a resposta será tratada como variável a ser usada nos templates
const startQuestions = [
  {
    type: 'input',
    name: 'TURMA',
    message: 'Turma (parent dir. onde os repos estão)',
  },
  {
    type: 'input',
    name: 'NICK_ALUNO',
    message: 'Nick do aluno (git repo) que será inspecionado',
    default: '*'
  },
  {
    type: 'input',
    name: 'commitLimitDate',
    default: new Date().toISOString().substr(0, 10),
    message: 'Data máxima dos commits [AAAA-DD-MM]',
    validate: value => !!value.trim() ? (/^\d{4}-\d{2}-\d{2}$/).test(value) : 'Formato inválido'
  },
]

// configuração default
module.exports = {

  // template do diretório que registrará as correções realizadas
  lookupDirPathMask: './{TURMA}/.duis.lookup/',

  // template do diretório parent ao que será passado como arg do Duis
  workingdirParentDirPathMask: './{TURMA}/{NICK_ALUNO}/',

  // a partir do dir. resolvido acima, é preciso voltar quantos níveis para ir ao que tem o `.git` (do aluno)
  levelsToParentDir: 1,

  // navegador que abrirá na pasta do aluno (ou o server, se iniciado)
  browser: {
    name: 'chrome',
    opts: '--incognito'
  },

  // `true` se o navegador deve ser aberto automaticamente a cada "working dir"
  autoOpenBrowser: true,

  // `true` se deseja perguntar antes de executar algum comando definido pelo usuário
  safeMode: true,

  /*************************** OPCIONAIS ***************************/

  // porta em que o servidor PHP tentará escutar
  serverPort: 8080,

  test: {
    // como devem terminar os arquivos de testes, i.e, a extensão deles
    fileExtName: '.test.js',
    // template do diretório em que estarão descritos os testes para cada "trabalho" (working dir)
    dirPathMask: './{TURMA}/__tests__', // os arquivos devem estar no formato: `<ENTRY_DIR>.<fileExtName>`
    // comando que será executado sobre o arquivo de "teste" do trabalho corrente
    commandToRun: 'testcafe chrome:headless --sf --color -u'
  },

  // questões a serem respondidas imediatamente após o setup das config
  startQuestions,

  // questões a serem respondidas após realizar os testes, i.e., após abrir o navegador no "working dir" corrente
  workingdirQuestions,

  // comandos a serem executados na linha de comandos ao entrar "diretório parent" (diretório resolvido de `workingdirParentDirPathMask`)
  _commandsForEachParentDir: {
    // antes de abrir o navegador na pasta do aluno (assim que entrar no working dir)
    onEnter: [
      'git checkout master',
      'git pull origin master',
      // 'git fetch origin master',
      // 'git reset --hard origin/master',
    ],
    // após parar o servidor (antes de seguir para o próximo working dir)
    onBeforeLeave: [
    ],
  },

}
