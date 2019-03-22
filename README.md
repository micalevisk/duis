## Etapas
1. ler o arquivo de setup `duis.json` (se existir, senão, _exit_ com erro)
2. resolver o `structure.path` salvando as variáveis; tratando como **template literals** do ES8
3. ao entrar no diretório do primeiro nível não-wildcard, executar `git fetch --all` e `git reset --hard origin/master` para garantir a última versão foi recuperada
4. abrir o navegador chromium sem _headless_
5. iniciar um servidor local capaz de processar PHP
6. "entrando" em cada caminho "resolvido", fazer:
    1. se o correspondente existe no diretório de _lookup_ e o `<HEAD_COMMIT_ID>` for igual a `git rev-parse --short HEAD`, então já foi corrigido; pular
    2. senão:
        1. abrir uma nova página -- no navegador aberto em `(3)`
        2. realizar a sequência de perguntas definidas no arquivo de setup (em `questions`)
        3. ao ser respondida corretamente, adicionar, no arquivo de _lookup_ correspondente, a query e atualizar o `<HEAD_COMMIT_ID>`

# Formato do arquivo de configuração

```bash

```

# Formato do arquivo gerado

```json
{
  "last": "<HEAD_COMMIT_ID>",
  "releases": [
    "<TRABNAME_CORRIGIDO>": [
      "resposta da pergunta 1",
      "resposta da pergunta 2",
      "...",
    ]
  ]
}
```
