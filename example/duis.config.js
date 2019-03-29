// perguntas cuja respostas definirão mais variáveis na config abaixo
// Se `name` estiver com todas as letras em maiúsculas, a resposta será tratada como variável a ser usada nos templates
const startQuestions = [
  {
    type: 'confirm',
    name: 'gitpullForEachRepo',
    default: true,
    message: 'Fazer `git pull origin master` a cada repo',
  },
  {
    type: 'input',
    name: 'TURMA',
    message: 'turma',
  },
]

// configuração default
module.exports = {

  // template do diretório que registrará as correções realizadas
  lookupDirPath: './{TURMA}/.duis.lookup/',

  // template do diretório parent ao que será passado como arg do Duis
  inspectDirMask: './{TURMA}/*',

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
