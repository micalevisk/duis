/**
 * `validate-on-the-fly` type prompt
 */

const chalk = require('chalk');
const Base = require('inquirer/lib/prompts/base');
const observe = require('inquirer/lib/utils/events');

class ValidateWhenUserType extends Base {
  constructor(questions, rl, answers) {
    super(questions, rl, answers);

    if (typeof this.opt.validate !== 'function') {
      this.throwParamError('validate');
    }

    this.opt.validateInput = (input) => {
      const result = this.opt.validate(input);
      const isValid = (typeof result === 'boolean');
      return {
        isValid,
        output: isValid ? input : result,
      };
    };
  }

  /**
   * Start the Inquiry session
   * @param  {Function} cb Callback when prompt is done
   * @return {this}
   */
  _run(cb) {
    this.done = cb;

    // Once user confirm (enter key)
    const events = observe(this.rl);
    const submit = events.line.map(this.filterInput.bind(this));

    const validation = this.handleSubmitEvents(submit);
    validation.success.forEach(this.onEnd.bind(this));
    validation.error.forEach(this.onError.bind(this));

    events.keypress.takeUntil(validation.success).forEach(this.onKeypress.bind(this));

    // Init
    this.render();

    return this;
  }

  /**
   * Render the prompt to screen
   * @param {string} [error]
   * @return {undefined}
   */
  render(error) {
    let bottomContent = '';
    let message = this.getQuestion();

    const { transformer } = this.opt;

    if (this.status === 'answered') {
      message += chalk.cyan(this.answer);
    } else if (transformer) {
      message += transformer(this.rl.line, this.answers);
    } else {
      const { isValid, output } = this.opt.validateInput(this.rl.line);
      if (!isValid) {
        error = output;
      }
      message += this.rl.line;
    }

    if (error) {
      bottomContent = chalk.red('>> ') + error;
    }

    this.screen.render(message, bottomContent);
  }

  /**
   * When user press `enter` key
   * @param {string} input
   */
  filterInput(input) {
    if (!input) {
      return this.opt.default === null
        ? ''
        : this.opt.default;
    }
    return input;
  }

  onEnd(state) {
    this.answer = state.value;
    this.status = 'answered';

    // Re-render prompt
    this.render();

    this.screen.done();
    this.done(state.value);
  }

  onError(state) {
    this.render(state.isValid);
  }


  /**
   * When user type
   * @param {{key: { name: string }, value: string}} evt
   * @returns {undefined}
   */
  onKeypress(evt) {
    this.render();
  }
}


module.exports = ValidateWhenUserType;
