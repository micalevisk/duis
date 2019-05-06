const boxen = require('boxen');
const chalk = require('chalk')

const foo = {
  "HTML": {
    "_id": "bf01835",
    "extra": {
      "nota": 10
    },
    "prompts": [
      {
        "q": "cell:nota",
        "a": "exato"
      }
    ]
  },
  "PHP1": {
    "_id": "12d896c",
    "prompts": [
      {
        "q": "cell:nota",
        "a": "quase"
      },
      {
        "q": "note:faltou",
        "a": [
          "asd asd",
          "dasd a",
          "fad"
        ]
      }
    ]
  }
}

const ff = Object.keys(foo)
  .map(k => chalk`{bold ${chalk.hex('#DEADED')(k)}:${foo[k]['_id']}}`)
  .join('\n')


console.log(

  boxen(chalk.white(`Em uso\n${ff}`), {
    // padding: 1,
    margin: 1,
    borderColor: '#b5e853',
  })

);

process.exit()

console.log('\n\n' + boxen(chalk.blue.bold('unicorn'), {
  padding: 1,
  margin: 1,
  borderColor: 'yellow'
}) + '\n');

console.log('\n\n' + boxen(chalk.blue.bold('unicorn'), {
  padding: 1,
  margin: 1,
  borderColor: 'yellow',
  borderStyle: 'double'
}) + '\n');

console.log('\n\n' + boxen(chalk.blue.bold('unicorn'), {
  padding: 1,
  margin: 1,
  borderColor: '#eebbaa',
  borderStyle: 'double'
}) + '\n');

console.log('\n\n' + boxen(chalk.blue.bold('unicorn'), {
  padding: 1,
  margin: 1,
  borderColor: '#ffc0cb',
  backgroundColor: '#00ffff',
  borderStyle: 'double'
}) + '\n');

console.log('\n\n' + boxen(chalk.blue.bold('unicorn'), {
  padding: 1,
  margin: 1,
  borderColor: 'yellow',
  backgroundColor: 'magenta',
  borderStyle: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|'
  }
}) + '\n');




console.log('\n\n' + boxen(`${chalk.white('I ❤')} ${chalk.hex('#b6a7d9').bold('Unicorns')}`, {
  padding: 1,
  float: 'center',
  borderStyle: 'round',
  borderColor: 'blue',
}))
