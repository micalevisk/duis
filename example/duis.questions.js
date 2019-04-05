// ref: https://www.npmjs.com/package/inquirer#prompt

/*
Convenções para este arquivo:
`name` = nome da célula
*/

const lookupsForLabels = {
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
]
