// Ensure we're in the project directory, so relative paths work as expected
process.chdir(__dirname)

const fs = require('fs')

const MD_TABLE = fs.readFileSync('metodologia.md').toString()
const planilhaJSON = markdownTableToJSON(MD_TABLE)

const formatFor = (src, fnCasting = String) => (target, prop, idx) =>
  Object.assign(target, { [prop]: fnCasting(src[idx]) })

const lookupsForLabels = planilhaJSON['DESCRIÇÃO'].reduce(formatFor(planilhaJSON['CATEGORIA']), {})

// ref: https://www.npmjs.com/package/inquirer#prompt
const workingdirQuestions = [
  {
    type: 'list',
    name: 'cell:nota',
    message: 'Avaliação',
    choices: planilhaJSON['DESCRIÇÃO'],
    filter: choice => lookupsForLabels[choice],
  },
  {
    type: 'input',
    name: 'note:faltou',
    message: 'O que faltou? (separar por `;`)',
    when: answers => answers['cell:nota'] === 'quase',
    filter: answser => answser.split(';').map(a => a.trim()),
  }
]

const lookupAttachExtra = (answers) => {
  const mapper = planilhaJSON['CATEGORIA'].reduce(formatFor(planilhaJSON['NOTA'], Number), {})
  return {
    'nota': mapper[answers['cell:nota']]
  }
}

function markdownTableToJSON(spreadSheetStr) {
  const [header,,...rows] = spreadSheetStr
    .split('\n')
    .filter(l => l.trim())
    .map(l => l.split('|'))

  return header
    .reduce((sheet, header, idx) => {
      return Object.assign(sheet, {
        [header.trim()]: rows.map(row => row[idx].trim())
      })
    }, {})
}


module.exports = {
  myQuestionsToEachWorkingdir: workingdirQuestions,
  myLookupAttachExtra: lookupAttachExtra,
}
