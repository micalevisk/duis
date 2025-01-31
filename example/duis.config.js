/**************************************************************************************************
██████╗ ███████╗███████╗ ██████╗██████╗ ██╗██████╗ ████████╗██╗ ██████╗ ███╗   ██╗
██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
██║  ██║█████╗  ███████╗██║     ██████╔╝██║██████╔╝   ██║   ██║██║   ██║██╔██╗ ██║
██║  ██║██╔══╝  ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   ██║██║   ██║██║╚██╗██║
██████╔╝███████╗███████║╚██████╗██║  ██║██║██║        ██║   ██║╚██████╔╝██║ ╚████║
╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝

workingdir = diretório que será alvo da correção
  - será aberto pelo browser e servido como document root pelo servidor PHP
  - junção do `workingdirParentDirPath` e caminho pro diretório do trabalho a ser corrigido

parent dir = diretório pai do `workingdir`
  - será usado como ponto de referência para encontrar todos os `workingdir`
  - deve estar 1 nível atrás do `workingdir`
  - seu caminho estará descrito na variável `workingdirParentDirPath`

root dir = diretório que contém o `.git`
  - será usado para realizar comandos Git
  - estará no mesmo nível que os demais diretórios git (dos outros alunos), portanto deve ser único
  - o nome desse dir. será usado como nome do arquivo de lookup
  - a variável `levelsToRootDir` indica seu caminho em relação ao `workingdir`

Com execeção dos campos: `session.file`, `startQuestions` e `workingdirQuestions`,
todas as strings podem ser escritas em forma de "template" em que os placeholders são palavras entre colchetes.
**************************************************************************************************/

//  ██████╗ ██████╗ ███╗   ██╗███████╗██╗ ██████╗ ███████╗
// ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██╔════╝ ██╔════╝
// ██║     ██║   ██║██╔██╗ ██║█████╗  ██║██║  ███╗███████╗
// ██║     ██║   ██║██║╚██╗██║██╔══╝  ██║██║   ██║╚════██║
// ╚██████╗╚██████╔╝██║ ╚████║██║     ██║╚██████╔╝███████║
//  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝

const { myQuestionsToEachWorkingdir, myLookupAttachExtra } = require('./duis.questions')

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

  // template do diretório parent ao que será passado como arg do Duis
  workingdirParentDirPath: './[TURMA]/[NICK_ALUNO]/',

  // template do diretório que registrará as correções realizadas
  lookupDirPath: './[TURMA]/.duis.lookup/', // arquivos ocultos serão ignorados na busca dos "parent dir"

  // a partir do diretório "workingdir", é preciso voltar quantos níveis para ir ao que tem o `.git` (do aluno)?
  levelsToRootDir: 1, // 0 se não for existir um diretório de trabalho específico, i.e., usado em `duis .`

  /*************************** OPCIONAIS ***************************/

  // glob pattern para os arquivos que serão ignorados nas buscas do duis-exec
  excludePatterns: [
    './[TURMA]/**/__*__', // excluindo qualquer arquivo que inicie e termine com `__`
  ],

  // nome padrão para o identificador no lookup
  entryDirName: '', // se for um valor falsy, o padrão será inferido a partir dos argumentos do duis-exec

  // configuração da sessão que será usada no duis-exec
  session: {
    // `true` se deseja iniciar uma nova sessão
    new: false,
    // caminho para o arquivo de sessão
    file: './.duis.session' // se for um valor falsy, a sessão não será salva
  },

  // navegador que abrirá na pasta do aluno (ou o server, se iniciado) no duis-exec
  browser: {
    name: 'chrome',
    opts: '--incognito', // as opções que o navegador suporta, separadas por espaço
    autoOpen: false // se o navegador deve ser aberto automaticamente a cada "workingdir"
  },

  // configuração do servidor para o duis-exec
  server: {
    // caminho para o arquivo binário (executável)
    bin: 'php', // atualmente, suporta apenas o CLI do PHP
    port: 8080 // porta em que o servidor tentará escutar
  },

  //
  test: {
    // como devem terminar os arquivos de testes, i.e, a extensão deles
    fileExtName: '.test.js',
    // template do diretório em que estarão descritos os testes para cada "trabalho" (workingdir)
    dirPath: './[TURMA]/__tests__', // os arquivos devem estar no formato: `<ENTRY_DIR>.<fileExtName>`
    // comando que será executado sobre o arquivo de "teste" do trabalho corrente
    command: 'testcafe chrome:headless --color -u'
  },

  // questões a serem respondidas imediatamente após o setup das config
  startQuestions: myStartQuestions,

  // questões a serem respondidas após realizar os testes, i.e., após abrir o navegador no "workingdir" corrente
  workingdirQuestions: myQuestionsToEachWorkingdir,

  // função pura que receberá as repostas dadas a `workingdirQuestions` retornará um objeto que será o valor da propriedade `extra` do objeto a ser gravado no lookup file, para o workingdir corrente
  lookupAttachExtra: myLookupAttachExtra,

  // comandos a serem executados na linha de comandos em alguns estágios do duis-exec
  hooks: {
    // antes de procurar pelos diretórios
    beforeStart: [
      ['git', 'pull', '--recurse-submodules'],
      ['./foo.sh', '.', { TURMA: '[TURMA]' }],
      // |          |   ^ se o último elemento for um `Object`, será usado como env. variables
      // |          +------- command arguments
      // +----- command
    ],

    // antes de abrir o navegador na pasta do aluno -- assim que entrar no "workingdir"
    onEnterWD: [],

    // após parar o servidor -- antes de seguir para o próximo "workingdir"
    beforeLeaveWD: [],

    // após ter percorrido todos os "workingdir" encontrados
    onFinish: []
  },

  // `true` para sempre confirmar a execução de comandos definidos pelo usuário
  safe: true,

}
