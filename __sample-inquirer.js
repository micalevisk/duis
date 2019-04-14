const inquirer = require('inquirer');


const q_input = {
  type: 'input',
  name: 'nombre',
  message: 'Nombre Completo?',
  default: 'Jose Perez'
};

const q_confirm = {
  type: 'confirm',
  name: 'casado',
  message: 'Casado?'
};

const q_list = {
  type: "list",
  name: "estudios",
  message: "Nivel academico?",
  choices: [
    "Primaria",
    "Secundaria",
    new inquirer.Separator(),
    "Bachillerato",
    "Licenciatura",
    "Doctorado"
  ]
};

const q_checkbox = {
  type: "checkbox",
  name: "servicios",
  message: "Servicios Publicos",
  choices: [
    {
      name: "Agua",
      checked: true
    },
    {
      name: "Luz"
    },
    {
      name: "Internet"
    },
  ]
};


const q_expand = {
  type: 'expand',
  name: 'overwrite',
  message: 'Conflict on `file.js`: ',
  choices: [
    {
      key: 'y',
      name: 'Overwrite',
      value: 'overwrite'
    },
    {
      key: 'a',
      name: 'Overwrite this one and all next',
      value: 'overwrite_all'
    },
    {
      key: 'd',
      name: 'Show diff',
      value: 'diff'
    },
    new inquirer.Separator(),
    {
      key: 'x',
      name: 'Abort',
      value: 'abort'
    }
  ]
};

const requireLetterAndNumber = value => (/\w/.test(value) && /\d/.test(value)) ? true : 'A senha deve ter números e letras';
const q_password = {
  type: 'password',
  name: 'password',
  message: 'Enter a masked password',
  mask: '*', // opcional
  validate: requireLetterAndNumber
};


const q_rawlist = {
  type: 'rawlist',
  name: 'size',
  message: 'What size do you need',
  choices: [ 'Standard', 'Medium', 'Small', 'Micro' ],
  filter: function (choice) {
    return choice.toLowerCase();// forma de como vai pro objeto final
  }
};

const q_editor = {
  type: 'editor',
  name: 'bio',
  message: 'Please write a short bio of at least 3 lines.',
  validate: function (text) {
    return (text.split('\n').length < 3) ?  true : 'Must be at least 3 lines.';
  }
};


/***************************************************/

const perguntas1 = [ q_input, q_confirm, q_list, q_checkbox,
    {
      when: function (response) {
        return response.casado;
      },
      type: 'input',
      name: 'hijos',
      message: 'Número de hijos?',
      default: 0
    },
];

const perguntas2 = [ q_expand, q_password ];

const perguntas3 = [ q_rawlist, q_editor ];

function print(answers) {
  console.log('\nANSWERS:');
  console.log( JSON.stringify(answers, null, '  ') );
}

/*
(async function() {
  answers = await inquirer.prompt(perguntas1)
  print(answers)
  answers = await inquirer.prompt(perguntas2)
  print(answers)
  answers = await inquirer.prompt(perguntas3)
  print(answers)
})()
*/
/*
(async function() {
  answers = await inquirer.prompt(require('./example/duis.questions.js'))
  print(answers)
})()
*/

;(async function() {

async function askUntilReturnTrue(question) {
  const { [question.name]: repeat } = await inquirer.prompt(question);
  return repeat ? repeat : askUntilReturnTrue(question)
}

function prompt(props) {
  return new Proxy({}, {
    get(_, propName) {
      return (otherProps) =>
        inquirer.prompt({
          name: 'reply',
          type: propName,
          ...props,
          ...otherProps
        })
    },
  })
}

const p = new Proxy({}, {
  get(_, propName) {

  }
})

console.log('>>>>>')
const x = await prompt({
  // name: 'proceed',
  message: 'Finalizar avaliação deste aluno?'
}).list({ choices: ['sim'] })
console.log('<<<<<', x)

/*
const proceed = await askUntilReturnTrue({
  name: 'proceed',
  type: 'list',
  message: 'Finalizar avaliação deste aluno?',
  choices: ['sim', 'não'],
  default: 'sim',
  filter: input => input === 'sim'
})

console.log('>>', proceed)
*/


})()
