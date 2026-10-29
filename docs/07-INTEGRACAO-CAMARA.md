# Etapa 7 — Integração com a Câmara

## Escopo implementado

Primeiro fluxo vertical da integração: consultar e validar a listagem
oficial de deputados, seguir a URL de paginação fornecida pela Câmara e
sincronizar uma quantidade limitada de páginas para o banco PostgreSQL. A API
própria continua lendo os dados persistidos e apresentando a fonte e a
data da consulta.

Não são importados e não foram modelados nesta etapa despesas, tramitações,
votações ou votos individuais. Os testes recentes de despesas e votos
individuais retornaram listas vazias; seus campos e formatos não devem
ser presumidos. A cobertura dos demais endpoints fica pendente de amostras
oficiais não vazias e validação de payload.

## Cliente e sincronização

O cliente está em `apps/api/src/integrations/camara/`. Ele:

- usa a base HTTPS oficial `https://dadosabertos.camara.leg.br/api/v2/`;
- solicita JSON e limita cada chamada a 10 segundos;
- valida o envelope e os campos de identidade/nome/fonte dos deputados
com Zod, preservando outros campos da resposta sem expô-los ou armazená-los;
- converte o identificador oficial numérico para texto sem perda;
- segue o link `rel=next` devolvido pela fonte, após validar que o link
permanece no mesmo domínio e base da API;
- rejeita parâmetros de página/tamanho fora dos limites, tamanho máximo
de 100 itens, e sincronização máxima de 52 páginas por execução;
- diferencia timeout, indisponibilidade de rede, erro HTTP, payload
inválido e paginação inválida. Erros não incluem corpo bruto da resposta.

A sincronização registra uma entidade `Source` por página consultada,
com URL exata, horário e metadados de página/contagem. Representantes são
inseridos/atualizados pela chave namespace + ID oficial. Campos ausentes
da resposta permanecem nulos. Registros que deixem de aparecer em futuras
consultas não são apagados automaticamente; isso evita exclusões sem
política de retenção definida.

## Executar uma sincronização controlada

Configure o banco local como na Etapa 5 e escolha explicitamente o limite:

```powershell
npm run camara:sync:representatives --workspace @voz-publica/api -- --max-pages=1
```

Uma página pode conter até 100 registros. Cada execução exige
`--max-pages` entre 1 e 52; o padrão não importa toda a base
automaticamente. Para continuar a importação, solicite páginas adicionais
em uma execução posterior. A saída informa páginas, registros e se a API
indicou mais resultados. Falhas interrompem a execução com código
diferente de zero.

Após sincronizar, o fluxo vertical pode ser verificado pela API própria:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
Invoke-RestMethod 'http://127.0.0.1:3000/api/representatives?page=1&limit=10'
```

O endpoint de perfil é
`GET /api/representatives/{id-oficial}`. Nenhuma rota HTTP pública de
sincronização foi criada; a importação é um comando operacional local.

## Evidência e resultados

Em 28/10/2026, foi repetido o script oficial de validação; o log
completo está em
[`logs/validacao-api-camara-20261028-183136.json`](../logs/validacao-api-camara-20261028-183136.json).
As oito requisições prioritárias retornaram HTTP 200. A lista trouxe 10
deputados, a lista de proposições trouxe 10, tramitações retornaram 81,
e a consulta de votações da proposição retornou quatro registros.
Despesas do deputado de amostra e votos individuais do voto selecionado
retornaram listas vazias.

Além da validação de amostra, foram consultadas despesas de outros IDs
obtidos da lista oficial (`220714`, `221328`, `204560` e `204528`) em
períodos consultados entre 2024 e 2026; as respostas também vieram vazias.
Votos individuais foram consultados para IDs retornados pela API
(`285815-115`, `285815-100`, `285815-82` e `285815-31`) e também vieram
vazios. Isso documenta apenas as amostras e períodos testados, não prova
que esses recursos não tenham registros em outros filtros ou eventos.

A sincronização real e limitada de uma página, com `itens=100`, leu 100
registros da lista oficial e gravou-os inicialmente no SQLite. Na migração
V2, a mesma amostra foi carregada novamente no PostgreSQL; o arquivo SQLite
legado foi preservado. Em seguida, as chamadas HTTP de saúde, listagem
paginada e detalhe retornaram sucesso; o perfil inclui a URL oficial e a
data da consulta. O banco continuou íntegro e os testes automatizados da
integração cobrem:
paginação oficial, limite máximo, URL de paginação fora da origem, timeout,
erro HTTP, resposta malformada e respeito ao limite de páginas.

## Limitações e próximos passos

- A sincronização de representantes suporta até 52 páginas, uma página
por vez e no máximo 100 itens por página; escolha um limite de páginas
compatível com a duração da tarefa.
- Não há retry automático; timeout e erro HTTP são retornados como erro,
sem resposta de sucesso substituta.
- Dados armazenados são uma cópia consultada; o registro guarda origem e
horário, mas ainda não existe agendamento automático de atualização.
- A amostra oficial validada não permite mapear despesas ou votos
individuais para o banco sem inventar campos. Não converter lista vazia
em valores financeiros ou votos.
- Adaptadores de proposições, tramitações, despesas e votos e seus
contratos normalizados serão implementados após validar payloads reais.

## Checklist

- [x] Cliente HTTP oficial com timeout e erros explícitos.
- [x] Validação de formato da listagem de deputados.
- [x] Paginação usando o link oficial, com validação da origem.
- [x] Importação idempotente por namespace e ID oficial.
- [x] Fonte, URL consultada e horário persistidos.
- [x] Limite explícito por execução; sem importação ilimitada implícita.
- [x] Sync real limitado e conferência por endpoints HTTP próprios.
- [x] Testes de falhas externas e paginação.
- [ ] Validar despesas e votos individuais com payloads não vazios.
- [ ] Implementar/validar adaptadores dos outros recursos.
- [ ] Definir política e agenda de atualização de dados.

**Situação:** integração de deputados funcional e verificada. A Etapa 7
está parcialmente concluída; os recursos sem amostras de resposta não
vazia permanecem pendentes.
