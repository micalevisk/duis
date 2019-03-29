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
    type: 'confirm',
    name: 'gitpullForEachRepo',
    default: true,
    message: 'Fazer `git pull origin master` a cada repo',
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

  // template do diretório em que estarão descritos os testes para cada "trabalho"
  testsDirPathMask: './{TURMA}/__tests__', // os arquivos devem estar no formato: `<TRAB>.test.js`

  // porta em que o servidor PHP tentará escutar; `null` caso não queira servir os repos
  serverPort: 8080,

  // navegador que abrirá a pasta do aluno (ou o server, se criado)
  browser: {
    name: 'chrome',
    opts: '--incognito'
  },

  /********************* opcionais *********************/

  // questões a serem respondidas imediatamente após o setup das config
  startQuestions,

  // executar `git pull origin master` ao entrar no repo (do aluno)
  gitpullForEachRepo: false,

  // comandos da linha de comandos a serem executados ao entrar no repo (do aluno)
  commandsForEachRepo: {
    // antes de abrir o navegador na pasta do aluno
    before: [
      'git fetch origin master',
      'git reset --hard origin/master'
    ],
    // após fechar o navegador
    after: [
    ]
  },

}
