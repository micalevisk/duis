/**************************************************************************************************
██████╗ ███████╗███████╗ ██████╗██████╗ ██╗██████╗ ████████╗██╗ ██████╗ ███╗   ██╗
██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
██║  ██║█████╗  ███████╗██║     ██████╔╝██║██████╔╝   ██║   ██║██║   ██║██╔██╗ ██║
██║  ██║██╔══╝  ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   ██║██║   ██║██║╚██╗██║
██████╔╝███████╗███████║╚██████╗██║  ██║██║██║        ██║   ██║╚██████╔╝██║ ╚████║
╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

workingdir = diretório que será alvo da correção
  - será aberto pelo browser e servido como document root pelo servidor PHP
  - junção do `workingdirParentDirPathMask` e caminho pro diretório do trabalho a ser corrigido

parent dir = diretório pai do `workingdir`
  - será usado como ponto de referência para encontrar todos os `workingdir`
  - deve estar 1 nível atrás do `workingdir`
  - seu caminho estará descrito na variável `workingdirParentDirPathMask`

root dir = diretório que contém o `.git`
  - será usado para realizar comandos Git
  - estará no mesmo nível que os demais diretórios git (dos outros alunos), portanto deve ser único
  - o nome desse dir. será usado como nome do arquivo de lookup
  - a variável `levelsToRootDir` indica seu caminho em relação ao `workingdir`
**************************************************************************************************/

//  ██████╗ ██████╗ ███╗   ██╗███████╗██╗ ██████╗ ███████╗
// ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██╔════╝ ██╔════╝
// ██║     ██║   ██║██╔██╗ ██║█████╗  ██║██║  ███╗███████╗
// ██║     ██║   ██║██║╚██╗██║██╔══╝  ██║██║   ██║╚════██║
// ╚██████╗╚██████╔╝██║ ╚████║██║     ██║╚██████╔╝███████║
//  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝


const myQuestionsToEachWorkingdir = [
  // TODO: implemente suas perguntas aqui
  // referência: https://www.npmjs.com/package/inquirer#prompt
]

const lookupAttachExtra = (answers) => {
  // TODO: implemente o objeto que será o valor da propriedade `extra`
  return {

  }
}

// perguntas cuja respostas definirão mais variáveis na config abaixo
// Se `name` estiver com todas as letras em maiúsculo, a resposta será tratada como variável a ser usada nos templates
const myStartQuestions = [
  {
    type: 'input',
    name: 'TURMA',
    message: 'Turma (dir. pai dos repos dos alunos)',
    default: 'CB01',
    validate: answer => !answer.trim() ? 'Informe algo' : true
  },
  {
    type: 'input',
    name: 'NICK_ALUNO',
    message: 'Nick do aluno (git repo) que será inspecionado',
    default: '*'
  },
]

module.exports = {

  // template do diretório que registrará as correções realizadas
  lookupDirPathMask: './{TURMA}/.duis.lookup/',

  // template do diretório parent ao que será passado como arg do Duis
  workingdirParentDirPathMask: './{TURMA}/{NICK_ALUNO}/',

  // a partir do diretório "workingdir", é preciso voltar quantos níveis para ir ao que tem o `.git` (do aluno)?
  levelsToRootDir: 1, // 0 se não for existir um diretório de trabalho específico, i.e., usado em `duis .`

  // navegador que abrirá na pasta do aluno (ou o server, se iniciado)
  browser: {
    name: 'chrome',
    opts: '--incognito' // as opções que o navegador suporta, separadas por espaço
  },

  // `true` se o navegador deve ser aberto automaticamente a cada "workingdir"
  autoOpenBrowser: false,

  // `true` para sempre confirmar a execução de comandos definidos pelo usuário
  safeMode: true,

  /*************************** OPCIONAIS ***************************/

  // porta em que o servidor PHP tentará escutar
  serverPort: 8080,

  test: {
    // como devem terminar os arquivos de testes, i.e, a extensão deles
    fileExtName: '.test.js',
    // template do diretório em que estarão descritos os testes para cada "trabalho" (workingdir)
    dirPathMask: './{TURMA}/__tests__', // os arquivos devem estar no formato: `<ENTRY_DIR>.<fileExtName>`
    // comando que será executado sobre o arquivo de "teste" do trabalho corrente
    commandToRun: ''
  },

  // questões a serem respondidas imediatamente após o setup das config
  startQuestions: myStartQuestions,

  // questões a serem respondidas após realizar os testes, i.e., após abrir o navegador no "workingdir" corrente
  workingdirQuestions: myQuestionsToEachWorkingdir,

  // função pura que receberá as repostas dadas a `workingdirQuestions` retornará um objeto que será o valor da propriedade `extra` do objeto a ser gravado no lookup file, para o workingdir corrente
  lookupAttachExtra: myLookupAttachExtra,

  // comandos a serem executados na linha de comandos no diretório "root" (git directory)
  commandsForEachRootDir: {
    // antes de abrir o navegador na pasta do aluno (assim que entrar no workingdir)
    onEnter: [
      'git checkout master',
      'git pull origin master',
    ],
    // após parar o servidor (antes de seguir para o próximo workingdir)
    onBeforeLeave: [
    ],
  },

}
