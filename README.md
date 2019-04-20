# Duis

Feito em cima do [Shelljs](https://www.npmjs.com/package/shelljs) e [inquirer](https://www.npmjs.com/package/inquirer)

/* TODO: finalizar descrição */

<!--
COMING SOON:
$ duis [OPTIONS] <PATH/TO/TRAB-FILE> [PATH/TO/CONFIG-FILE]

OPTIONS:
Todas que estão disponíveis no arquivo `.config`. Assim, o arquivo de configuração não é obrigatório. As opções da linha de comandos irão sobreescrever as definidas no arquivo de configuração.

- nomes continua em **camelCase** mas são precedidos por 2 hífens; opções booleanas são usadas como "flags"
  - > `safeMode: true` vira `--safeMode`

- caso o valor seja um objeto, usar o ponto-final como separador
  - > `browser: { name: 'chrome' }` vira `--browser.name='chrome'`
  - > `commandsForEachRootDir: { onEnter: ['foo'], onBeforeLeave: ['bar'] }` vira `--commandsForEachRootDir.onEnter=['foo'] --commandsForEachRootDir.onBeforeLeave=['bar']`

-->

# Como usar
```
$ duis [PATH/TO/CONFIG-FILE] <PATH/TO/TRAB-FILE>
                                  |
                                  |
    relativo ao diretórío do "aluno" (AKA working dir; onde está o `.git`)
```

## Demo

<details>
  <summary>Exemplo de árvore do diretório a ser trabalhado</summary>

```bash
.
├── duis.questions.js
├── duis.config.js
├── Turma1
│   ├── __tests__
│   │   └── TRAB1.test.js
│   ├── nick-aluno-a # git repo
│   │   ├── TRAB1
│   │   │   └── index.html ## or `index.php`
│   │   ├── TRAB2
│   │   └── # ...
│   ├── nick-aluno-b
│   │   └── # ...
│   └── #...
└── Turma2
    └── #...
```
</details>

<details>
  <summary>Exemplo do arquivo de configuração</summary>
</details>
<br>

Iniciar processo com **`$ duis . TRAB1`**
1. Carregar as configurações expostas no arquivo `duis.config.js` do diretório corrente (se não existir: _exit 1_)
2. Fazer as perguntas definidas em `CONFIG#startQuestions`, para adicionar mais valores ao estado inicial
3. Criar o diretório definido em `CONFIG#lookupDirPathMask`, se ele já não existir
4. Para cada diretório resolvido da junção de `CONFIG#workingdirParentDirPathMask` (renderizado) e `<PATH/TO/TRAB-FILE>` (eg. `TRAB1`), tratá-lo como _working dir_ e fazer:
    1. Entrar no diretório "root" do _working dir_ corrente (eg. `./Turma1/nick-aluno-a`)
    2. Executar os comandos definidos em `CONFIG#commandsForEachRootDir.onEnter` (perguntando antes de executar cada, se `CONFIG#safeMode` for `true`)
    3. Entrar no diretório _working dir_ corrente (eg. `./Turma1/nick-aluno-a/TRAB1`)
    4. Recuperar o id do último commit no diretório _working dir_, e fazer:
        1. Se o _working dir_ tiver uma entrada para `<PATH/TO/TRAB-FILE>` no arquivo de lookup corrente (eg. `./Turma1/.duis.lookup/nick-aluno-a.json`) **e** o id deste for igual a este commit, então esse "trabalho" não foi atualizado; pular essa iteração
        2. Senão, continuar o processo
    5. Se `CONFIG#serverPort` estiver definido, então:
        1. Criar um servidor PHP no _working dir_
        2. Abrir o navegador definido em `CONFIG#browser` na raiz do server local
    6. Senão, abrir o navegador em _working dir_
    7. Se existir o arquivo de teste associado ao "trabalho" corrente, então:
        1. Perguntar se deseja executar o comando definido em `CONFIG#test.commandToRun` (eg. `testcafe -sf chrome:headless ./Turma1/__tests__/TRAB1.test.js`)
        2. Executar o comando para (teoricamente) executar os testes

    8. Fazer as perguntas definidas no `CONFIG#workingdirQuestions`

    9. Esperar a resposta da pergunta "Finalizar avaliação de `<rootName>`?"
        1. Atualizar o arquivo de lookup correspondente
        2. Parar o servidor (se iniciado)
        3. Executar os comandos definidos em `CONFIG#commandsForEachRootDir.onBeforeLeave` (perguntando antes de executar cada, se `CONFIG#safeMode` for `true`)

    10. Fechar o navegador, se aberto em `[6]`

## Formato do arquivo de "lookup" gerado pra cada _working dir_
> o nome do arquivo deve ser o mesmo do diretório git em que o `working dir` está

```json
{
  "<TRABNAME_CORRIGIDO>": {
    "_id": "<TRABNAME_CORRIGIDO_COMMIT_ID>", // commit que gerou os `prompts` abaixo
    "prompts": [ // perguntas e respostas das questões definidas em `CONFIG#workingdirQuestions`
      {
        "q": "<QUESTION_NAME>",
        "a": "<ANSWER>"
      },
      // ...
    ]
  }
  // ...
}
```
