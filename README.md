## Etapas

<details>
<summary>Exemplo de árvore do diretório a ser trabalhado</summary>

```bash
.
├── duis.questions.js
├── duis.config.js
├── Turma1
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

Iniciar processo com **`$ duis TRAB1`**

1. Ler o arquivo de setup `duis.config.js` (se não existir: _exit 1_) para definir o estado inicial. Além do `duis.questions.js`
2. Fazer as perguntas definidas em `CONFIG#startQuestions`, se existir alguma, para adicionar mais valores ao estado inicial
3. Criar o diretório definido em `CONFIG#lookupDirPath`, se ele já não existir
4. Para cada diretório resolvido com a junção de `CONFIG#inspectDirMask` (renderizado) e `TRAB1`, fazer:
    1. Definir o diretório resolvido como _working dir_ corrente (eg. `./Turma1/nick-aluno-a/TRAB1`) ~ caminho absoluto
    2. Se o id do último commit no _working dir_ for igual ao recuperado do arquivo de lookup corrente (eg. `./Turma1/.duis.lookup/nick-aluno-a.json`), significa que esse diretório já foi visto, então deve-se seguir para a próxima iteração
    3. Se `CONFIG#serverPort` for diferente de `null`, então, fazer:
        1. Criar um servidor PHP no _working dir_
        2. Abrir o navegador definido em `CONFIG#browser` na raiz do server
    4. Senão, abrir o navegador em _working dir_
    5. Fazer as perguntas definidas no `duis.questions.js`
    6. Ao fechar o navegador (e, consequentemente, parar o server), registrar/append respostas no arquivo de lookup correspondente ao _working dir_ atual

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
