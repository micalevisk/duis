# Como usar
```
$ duis <PATH/TO/CONFIG-FILE> <PATH/TO/TRAB-FILE>
                                     |
                                     |
              relativo ao diretórío do "aluno" (AKA working dir; onde está o `.git`)
```

## Etapas

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

```js
```

</details>
<br>

Iniciar processo com **`$ duis . TRAB1`**

1. Carregar as configurações expostas no arquivo `duis.config.js` do diretório corrente (se não existir: _exit 1_)
2. Fazer as perguntas definidas em `CONFIG#startQuestions`, para adicionar mais valores ao estado inicial
3. Criar o diretório definido em `CONFIG#lookupDirPathMask`, se ele já não existir
4. Para cada diretório resolvido com a junção de `CONFIG#workingdirParentDirPathMask` (renderizado) e `TRAB1`, fazer:
    1. Definir o diretório resolvido como _working dir_ corrente (eg. `./Turma1/nick-aluno-a/TRAB1`) ~ caminho absoluto
    2. Executar os comandos definidos em `CONFIG#commandsForEachParentDir.onEnter`
    3. Se o id do último commit no _working dir_ for igual ao recuperado do arquivo de lookup corrente (eg. `./Turma1/.duis.lookup/nick-aluno-a.json`), significa que esse diretório já foi visto, então deve-se seguir para a próxima iteração
    4. Se `CONFIG#serverPort` estiver definido, então, fazer:
        1. Criar um servidor PHP no _working dir_
        2. Abrir o navegador definido em `CONFIG#browser` na raiz do server (se `CONFIG#autoOpenBrowser` for `true`)
    5. Senão, abrir o navegador em _working dir_ (se `CONFIG#autoOpenBrowser` for `true`)
    6. Se existir o arquivo de teste associado ao "trabalho" corrente, fazer:
        1. Perguntar se deseja executar o comando definido em `CONFIG#test.commandToRun` (eg. `testcafe -sf chrome:headless ./Turma1/__tests__/TRAB1.test.js`)
        2. Executar o comando para (teoricamente) executar os testes
    7. Fazer as perguntas definidas no `CONFIG#workingdirQuestions` (perguntando antes de executar cada, se `CONFIG#safeMode` for `true`)
    8. Esperar a resposta da pergunta "Finalizar avaliação deste aluno (`<studentGitRepoDirName>`)?"
        1. Atualizar o arquivo de lookup correspondente
        2. Parar o servidor
        3. Executar os comandos definidos em `CONFIG#commandsForEachParentDir.onBeforeLeave`

## Formato do arquivo de "lookup" gerado pra cada _working dir_
> o nome do arquivo deve ser o mesmo do diretório git em que o `working dir` está

```json
{
  "id": "<HEAD_COMMIT_ID>", // apenas os 8 primeiros caracteres
  "releases": {
    "<TRABNAME_CORRIGIDO>": [
      {
        "q": "<QUESTION_NAME>",
        "a": "<ANSWER>"
      },
      // ...
    ]
  }
}
```
