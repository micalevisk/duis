/**
 * `warn-while-type` type prompt
 */

const chalk = require('chalk');
const Input = require('inquirer/lib/prompts/input');

class WarnWhileType extends Input {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    if (typeof this.opt.warnif !== 'function') {
      this.throwParamError('warnif');
    }

    if (typeof this.opt.warning !== 'string') {
      this.throwParamError('warning');
    }
  }

  render(error) {
    let bottomContent = '';
    let isFinal = this.status === 'answered';
    let appendContent = isFinal ? this.answer : this.rl.line;
    let message = this.getQuestion();
    const { transformer, warnif, warning } = this.opt;

    if (transformer) {
      appendContent = transformer(appendContent, this.answers, { isFinal });
    }

    if (isFinal) {
      appendContent = chalk.cyan(appendContent);
    } else {
      const shouldWarn = warnif(appendContent);
      if (shouldWarn) {
        const warningColor = this.opt.warningColor || 'dim';
        const inputColor = this.opt.inputColor || 'red';

        bottomContent = chalk.yellow('!') + ' ' + chalk[warningColor](warning);
        appendContent = chalk[inputColor](appendContent);
      }
    }

    message += appendContent;

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }
}


module.exports = WarnWhileType;
