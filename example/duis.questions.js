// ref: https://www.npmjs.com/package/inquirer#prompt
const inquirer = require('inquirer')

const lookupsForLabels = {
  'Quase como o esperado': 'quase',
  'Exato': 'exato',
  'Exato com "extra"': 'exato_extra',
  'Incorreto': 'incorreto',
  'Plágio': 'plagio',
  'Suspeito de plágio': 'suspeito',
}

module.exports = [
  {
    type: 'list',
    name: 'cell:nota',
    message: 'Avaliação',
    choices: [
      new inquirer.Separator('-- visual e código como o esperado --'),
      'Quase como o esperado',
      'Exato',
      'Exato com "extra"',
      'Plágio',
      'Suspeito de plágio',
      new inquirer.Separator(),
      'Incorreto',
    ],
    default: 'Exato',
    filter: function(choice) {
      return lookupsForLabels[choice]
    }
  },
  {
    type: 'input',
    name: 'note:faltou',
    message: 'O que faltou? (separar por `;`)',
    when: answsers => answsers['cell:nota'] === 'quase',
    filter: answser => answser.split(';').map(a => a.trim()),
  }
]
