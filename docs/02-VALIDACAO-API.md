# Etapa 2 — Validação da API oficial

## Objetivo

Verificar respostas reais da API v2 da Câmara dos Deputados, inspecionar
campos e paginação e registrar status HTTP, duração, identificadores
oficiais e limitações observadas. Esta validação não implementa o
adaptador do backend.

## Pré-requisitos e execução

PowerShell no Windows e acesso à internet. Na raiz do projeto:

```powershell
.\scripts\validar-api-camara.ps1
```

Se a política de execução bloquear o arquivo, execute-o apenas neste
processo do PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validar-api-camara.ps1
```

O script seleciona os IDs a partir das próprias respostas da API e salva
um JSON em `logs/validacao-api-camara-<data-hora>.json`. Para escolher
outro diretório:

```powershell
.\scripts\validar-api-camara.ps1 -OutputDirectory .\logs\outra-execucao
```

## Passos

1. Execute o script na raiz do workspace.
2. Confira a tabela de status no terminal e confirme que foi informado o
   caminho do JSON gerado.
3. Abra o JSON e confira, para cada endpoint, `httpStatus`,
   `responseFormat`, `usefulFields`, `pagination`, `sampleOfficialId` e
   `error`.
4. Registre como limitação qualquer recurso que retorne lista vazia e
   repita a consulta com outra amostra oficial antes de concluir que não
   há registros disponíveis.

O log guarda método, URL, parâmetros, horário, status HTTP, duração,
formato e campos da resposta, contagem, link de próxima página, ID oficial
de amostra e uma decisão inicial de normalização. Não guarda os valores
pessoais do payload.

Resultado esperado: uma tabela com status e duração por endpoint, seguida
do caminho do arquivo JSON. Confira o campo `result` de cada endpoint no
log; uma falha HTTP/JSON faz o script terminar com código diferente de
zero.

## Erros comuns e interpretação

- **A política bloqueou a execução:** use o comando `powershell
  -ExecutionPolicy Bypass -File ...` acima; ele não altera a política
  persistente do computador.
- **Falha de rede ou status diferente de 2xx:** confira a conexão e o
  serviço oficial, depois execute novamente. A falha fica no campo `error`
  do endpoint no JSON e o script indica falha.
- **HTTP 200 com `dataCount` igual a zero:** a consulta respondeu, mas
  não encontrou registros para aquele identificador/filtro. Isso não
  deve ser convertido em zero monetário nem generalizado para todos os
  registros da Câmara.

## Ambiente verificado

Verificado em 28/10/2026:

| Ferramenta | Resultado |
|---|---|
| Node.js | Disponível, `v24.21.0` |
| npm | Disponível, `11.19.0` |
| Git | Disponível, `2.55.0.windows.5` |
| VS Code (`code`) | Disponível, `1.143.1` |
| ADB | Não encontrado no PATH; SDK/emulador não verificados |

A verificação do ADB depende da instalação/configuração do Android Studio,
conforme o guia. Portanto, essa parte da preparação do ambiente permanece
pendente; não impediu a validação HTTP da API.

## Resultado da execução

Data/hora local: 28/10/2026. As oito requisições abaixo retornaram HTTP
200. O log completo desta execução está em
[validacao-api-camara-20261028-174243.json](../logs/validacao-api-camara-20261028-174243.json).

| Endpoint testado | ID oficial selecionado pela API | Registros | Campos observados / resultado |
|---|---:|---:|---|
| `GET /deputados?ordem=ASC&ordenarPor=nome&itens=10` | `204379` | 10 | `id`, `uri`, `nome`, `siglaPartido`, `uriPartido`, `siglaUf`, `idLegislatura`, `urlFoto`, `email`; há link para a próxima página |
| `GET /deputados/204379` | `204379` | 1 | `id`, `uri`, `nomeCivil`, `ultimoStatus`, `sexo`, `urlWebsite`, `redeSocial`, datas, naturalidade e escolaridade; a resposta também expõe `cpf`, cujo valor não foi copiado para o log |
| `GET /deputados/204379/despesas?ano=2025&itens=10` | `204379` | 0 | HTTP 200, sem registros para este deputado e filtro; não foi possível observar campos de despesa nesta amostra |
| `GET /proposicoes?ano=2020&siglaTipo=PL&itens=10` | `285815` | 10 | `id`, `uri`, `siglaTipo`, `codTipo`, `numero`, `ano`, `ementa`, `dataApresentacao`; há link para a próxima página |
| `GET /proposicoes/285815` | `285815` | 1 | Campos de identificação, ementa, status, autoria por URI, texto e justificativa |
| `GET /proposicoes/285815/tramitacoes` | — | 81 | Campos de data/hora, sequência, órgão, relatoria, regime, descrição da tramitação/situação, despacho e URL |
| `GET /proposicoes/285815/votacoes` | `285815-115` | 4 | Campos de ID/URI, data, órgão, evento, proposição relacionada, descrição e aprovação |
| `GET /votacoes/285815-115/votos` | `285815-115` | 0 | HTTP 200, sem votos individuais retornados para a votação usada nesta amostra |

Uma resposta HTTP 200 com `dados` vazio significa que o endpoint respondeu,
mas não comprova que haja registros para qualquer deputado, período ou
votação. As respostas vazias não foram completadas com dados presumidos.
Os campos dos detalhes incluem informações potencialmente pessoais;
somente nomes de campos foram registrados, nunca os respectivos valores.

### Revalidação em 28/10/2026

O script foi executado novamente em 28/10/2026 às 18:31. As oito rotas
prioritárias retornaram HTTP 200; o log é
[validacao-api-camara-20261028-183136.json](../logs/validacao-api-camara-20261028-183136.json).
Os resultados permaneceram: lista de deputados com 10 registros,
proposição com 10, tramitações com 81 e quatro votações; despesas do
deputado da amostra e votos individuais retornaram zero registros.

Foram feitas consultas adicionais, usando IDs vindos da lista/rotas
oficiais: despesas para os deputados `220714`, `221328`, `204560` e
`204528`, nos anos consultados entre 2024 e 2026, e votos individuais para
`285815-115`, `285815-100`, `285815-82` e `285815-31`. Todas essas
respostas retornaram listas vazias. Essa amostragem não demonstra que o
recurso seja universalmente vazio; não se definiram campos nem se
fabricaram registros para despesas ou votos.

## Decisões e limitações

- Manter o ID e a URI oficial, a URL consultada e o horário da consulta
  junto aos dados normalizados.
- Usar os nomes e valores efetivamente fornecidos pela fonte; não
  reinterpretar campos nem transformar ausência em zero.
- Quando a fonte não fornecer um valor, a interface deve indicar
  **“Não informado pela fonte consultada”**. Para listas vazias, distinguir
  “nenhum registro retornado para estes filtros” de erro HTTP.
- Seguir os links de paginação da própria API, sem presumir que a primeira
  página contenha todos os resultados.
- Continuar a busca de amostras não vazias para despesas e votos antes
  de concluir quais campos ou registros estão disponíveis para esses
  recursos.
- Consultar novamente a documentação oficial antes de implementar o
  adaptador, pois campos e resultados podem mudar.

## Checklist

- [x] Lista de deputados consultada e paginação observada.
- [x] ID do deputado obtido da resposta da lista e usado em detalhes e
  despesas.
- [x] Lista e detalhes de proposições, tramitações e votações consultados.
- [x] Endpoint de votos individuais consultado usando ID retornado pela
  API.
- [x] Status, campos, contagens e limitações registrados no JSON.
- [x] Repetir despesas e votos com outras amostras oficiais; as respostas
  testadas também vieram vazias.
- [ ] Observar payloads não vazios de despesas e votos individuais.

**Situação:** validação HTTP concluída para os endpoints prioritários
nesta execução, com limitações documentadas para despesas e votos
individuais. A integração de deputados começou na Etapa 7; não mapear
despesas/votos individuais até observar payloads não vazios.
