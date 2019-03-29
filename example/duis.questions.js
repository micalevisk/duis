// ref: https://www.npmjs.com/package/inquirer#prompt

/*
Convenções para este arquivo:
`name` = nome da célula
*/

const exercicioEntregue = anwsers => anwsers['criterio_F'] === false

const questao = (name, message) => ({ name, message, when: exercicioEntregue })


module.exports = [
  {
    type: 'confirm',
    name: 'criterio_F',
    message: 'não entregue ou totalmente fora do esperado',
    default: false,
  },
  {
    type: 'confirm',
    ...questao('criterio_A', 'visualmente de acordo com o slide do exercício'),
  },
  {
    type: 'confirm',
    ...questao('criterio_B', 'código usando o que foi solicitado'),
  },
  {
    type: 'confirm',
    ...questao('criterio_C', 'código usando algo a mais do que foi solicitado'),
    default: false,
  },
  {
    type: 'confirm',
    ...questao('criterio_D', 'plágio ou cópia'),
    default: false,
  },
  {
    type: 'confirm',
    ...questao('criterio_E', 'suspeito de plágio'),
    default: false,
  },
]
