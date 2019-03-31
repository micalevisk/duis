// run with `testcafe chrome:headless --sf --live PHP1.test.js`
// ref: https://devexpress.github.io/testcafe/documentation/test-api/a-z.html

import { Selector } from 'testcafe'

//#region Page model
const page = {
  nameInput: Selector('input[type=text][name=nome]'),
  emailInput: Selector('input[type=email]'),
  textArea: Selector('textarea[name=mensagem]'),
  resetButton: Selector('input[type=reset]'),
  submitButton: Selector('input[type=submit]'),
  results: Selector('body'),
}
//#endregion


fixture `Exercício PHP1`
  .meta({ author: '@micalevisk', creationDate: '01/04/2019' })
  .page `http://localhost:8080` // assumindo que o servidor estará escutando nesse endereço


test(`Servidor funcionando`, t => t.wait(1000));

test('Preenchendo `Dados Básicos`', async t => {
  const nome = '&*66Micael Levii'
  const email = 'micael@pw.com'

  // o campo `nome` deve ser obrigatório
  await t
    .expect( await page.nameInput().getAttribute('required') ).notEql(undefined)

  await t
    .typeText(page.nameInput, nome, { replace: true })
    .expect(page.nameInput.value).eql(nome)
    .typeText(page.emailInput, email, { replace: true })
    .expect(page.emailInput.value).eql(email)
})

test('Ações dos botões no formulário', async t => {
  // botão para apagar tudo
  await t
    .click(page.resetButton)
    .expect(page.textArea.value).eql('Este é o valor padrão!')

  // submetendo
  await t
    .typeText(page.nameInput, 'Micael', { replace: true })
    // .wait(500)
    .click(page.submitButton)
    .expect(page.results.innerText).contains('nome: Micael')
})
