# Etapa 5 — Banco de dados

> **Estado atual na Versão 2:** o provider e a API Prisma usam PostgreSQL.
> A primeira versão SQLite foi preservada, sem remoção, em
> `apps/api/prisma/dev.db` e `apps/api/prisma/sqlite-migrations/`. O banco
> PostgreSQL local novo recebeu uma migration V2 e registros oficiais
> recarregados da Câmara e do Senado. As seções abaixo registram o histórico
> da primeira decisão SQLite; consulte “Migração V2 para PostgreSQL” para
> os comandos atuais.

## Objetivo

Definir o schema Prisma, gerar/aplicar migrations e testar consultas. A
primeira versão usou SQLite para desenvolvimento; a Versão 2 migrou o
runtime para PostgreSQL conforme o novo Guia Mestre.

## Pré-requisitos

- Node.js e npm instalados; dependências instaladas com `npm install` na
  raiz.
- `DATABASE_URL` configurada localmente, fora do controle de versão.

O banco SQLite antigo permanece como arquivo de arquivo local excluído do
Git. A API ativa requer um PostgreSQL acessível via `DATABASE_URL`.

## Modelo criado

O schema está em [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma);
a migration SQLite inicial em
[`apps/api/prisma/sqlite-migrations/20261028181500_init/migration.sql`](../apps/api/prisma/sqlite-migrations/20261028181500_init/migration.sql).

| Entidade | Decisão principal |
|---|---|
| `Source` | Registra tipo, nome, URL original, data de publicação quando conhecida, horário de consulta e metadados. |
| `Representative` | ID interno UUID e ID oficial textual; unicidade por namespace/fonte e ID externo. Partido, UF e foto são opcionais. |
| `Mandate` | Histórico ligado ao representante e à fonte; datas/status podem ser nulos se não forem informados. |
| `Proposal` | ID externo preservado como texto; campos de tipo, número, ano, ementa, status e data são opcionais até confirmação da fonte. |
| `RepresentativeProposal` | Relação N:N com fonte própria; o papel é texto opcional e não presume autoria/coautoria sem resposta oficial. |
| `Voting` e `ProposalVoting` | Evento oficial de votação separado da relação com proposições, cuja fonte é registrada; datas, descrição e resultado são opcionais. |
| `Expense` | Valor decimal guardado como texto para evitar coerção NUMERIC e arredondamento binário; identificador, período, categoria e fornecedor podem faltar. |
| `Commitment` | Status enum alinhado ao guia; origem, método de avaliação e revisor registrados. |
| `Evidence` | Evidências vinculadas a compromisso e fonte, preservadas com data do fato/consulta. |
| `CommitmentHistory` e `CommitmentHistoryEvidence` | Histórico append-only de mudanças e relação das evidências consideradas. |

Favoritos não estão no banco: o guia recomenda armazenamento local no
aparelho no MVP. Campos observados que podem conter dados pessoais, como
CPF no detalhe do deputado, foram deliberadamente excluídos. Não foi
possível confirmar campos de despesas ou votos individuais nesta amostra
da API; o schema não afirma que esses registros existam. Uma entidade
para voto individual fica pendente de validação de payload com registros.

IDs e valores opcionais não são completados com valores inventados. SQLite
armazena datas em representação textual gerida pelo Prisma; ao mapear
datas civis, manter explícita a distinção entre data sem horário e
instante com fuso. Categorias de despesa e status de mandato permanecem
texto aberto. SQLite não aplica enums no banco; entradas recebidas pelo
backend deverão ser validadas antes de persistir.

O campo `Expense.value` é texto decimal e não deve ser convertido para
`Number` para cálculos. A integração futura deve validar e preservar a
representação decimal recebida da fonte (ou usar aritmética decimal exata);
os payloads de despesas testados até agora não continham registros, então
nenhuma forma de valor da Câmara foi presumida.

## Configuração local SQLite (histórico)

O `.env` histórico usava `DATABASE_URL="file:./prisma/dev.db"`, relativo
ao workspace da API. O arquivo `.env` está ignorado pelo Git. Não copie o
`.env.example` atual para tentar reabrir o banco SQLite: ele agora configura
o provider PostgreSQL da V2.

## Comandos da primeira versão SQLite (histórico)

Os comandos nesta seção descrevem a criação original do banco SQLite; não
os execute na configuração V2 atual. As migrations foram arquivadas em
`apps/api/prisma/sqlite-migrations/`. A instalação corrente usa as
instruções da seção “Migração V2 para PostgreSQL”.

Na raiz do monorepo:

```powershell
npm run db:format --workspace @voz-publica/api
npm run db:validate --workspace @voz-publica/api
npm run db:generate --workspace @voz-publica/api
npm run db:migrate --workspace @voz-publica/api
```

`db:migrate` usa `prisma migrate dev` e aplica a migration ao arquivo
SQLite local. `db:migrate:deploy` aplica migrations revisadas para o
arquivo configurado.

```powershell
npm run db:migrate:deploy --workspace @voz-publica/api
```

O Prisma CLI exige `DATABASE_URL` por causa da configuração. Confirme o
caminho do arquivo antes de aplicar migrations; não apague o banco para
resolver divergências sem verificar se contém informação.

## Resultado verificado em 28/10/2026

- Prisma ORM e adaptador SQLite `7.10.1` instalados no workspace da API.
- `prisma format`, `prisma validate` e `prisma generate` passaram.
- A migration SQLite inicial foi gerada a partir do schema vazio e
  aplicada com `prisma migrate dev` ao arquivo local de desenvolvimento.
- Foi criado `src/database.ts`, com Prisma Client configurado pelo
  adaptador `better-sqlite3`; a configuração falha explicitamente se
  `DATABASE_URL` estiver ausente.
- `npm run db:test --workspace @voz-publica/api` passou: gravou e leu
  valor decimal como texto sem alteração, confirmou unicidade e restrição
  de chave estrangeira. O teste usa registros identificados como fixtures
  em `example.invalid` e os remove ao terminar; não são dados políticos.
- `npm run typecheck` passou nos dois workspaces e o build da API passou.
- A instalação do adaptador reportou zero vulnerabilidades no audit do npm.
- Não foi executado teste com payload não vazio de despesas nem votos
  individuais; esses mapeamentos continuam pendentes de validação com
  dados reais da API.

## Migração V2 para PostgreSQL

Em 28/10/2026, foi criado o banco local `voz_publica_v2` e a conta de
aplicação de privilégio restrito `voz_publica_v2_app`. A senha aleatória
de aplicação fica somente em `apps/api/.env`, que é ignorado pelo Git; a
senha administrativa fornecida para configurar o serviço não é usada pela
API. O `.env.example` contém apenas um placeholder.

O provider Prisma ativo agora é PostgreSQL, com adapter `@prisma/adapter-pg`.
A migration PostgreSQL inicial está em
[`apps/api/prisma/migrations/20261028234000_v2_postgresql_init/migration.sql`](../apps/api/prisma/migrations/20261028234000_v2_postgresql_init/migration.sql)
e foi aplicada por `npm run db:migrate:deploy --workspace @voz-publica/api`.
As três migrations SQLite anteriores e o banco `dev.db` foram preservados,
sem reset ou exclusão.

Como o banco SQLite só continha registros oficiais sincronizáveis (sem
ações, despesas ou compromissos editoriais), as fontes oficiais foram
consultadas novamente e 513 deputados e 81 senadores foram sincronizados
no PostgreSQL, com URLs e horários de consulta atualizados. Não foi
descartada informação editorial local.

Para configurar uma instalação local:

1. Copie `.env.example` para `apps/api/.env` apenas se ainda não existir.
2. Preencha `DATABASE_URL` com a conexão PostgreSQL local.
3. Configure `SHADOW_DATABASE_URL` para um banco PostgreSQL de
   desenvolvimento separado se for gerar migrations com `db:migrate`.
4. Execute `npm run db:migrate:deploy --workspace @voz-publica/api`.
5. Sincronize dados reais pelos comandos limitados da Câmara e lista atual
   do Senado descritos no README.

O comando `db:migrate` (`prisma migrate dev`) foi testado com banco shadow
separado; `db:migrate:deploy` aplica migrations revisadas sem precisar
criar um banco shadow.

**Situação atual:** API Prisma conectada ao PostgreSQL local; migration V2
aplicada; registros oficiais recarregados; arquivo e migrations SQLite
legados preservados. A migração de dados eleitorais, despesas, ações e
compromissos continua condicionada à validação de payloads e fontes.

## Erros comuns

- **`DATABASE_URL` ausente:** configure `apps/api/.env` a partir do
  exemplo e execute os scripts na raiz com `--workspace`.
- **Arquivo/servidor de banco incorreto:** a API V2 precisa de um
  PostgreSQL acessível em `DATABASE_URL`; não é mais suficiente apontar para
  o arquivo SQLite legado.
- **Migration falha por divergência:** pare antes de apagar/alterar dados,
  inspecione o estado do banco e a SQL gerada; não use `migrate reset` em
  banco que contenha informação.
- **Campo ausente na API:** mantenha coluna opcional e apresente
  “Não informado pela fonte consultada”; não invente uma substituição.

## Checklist histórica da primeira versão SQLite

- [x] Modelo conceitual convertido em schema Prisma.
- [x] Relações, unicidade e índices iniciais definidos.
- [x] Valor monetário armazenado como texto decimal, sem ponto flutuante.
- [x] Histórico e evidências preservados por relações próprias.
- [x] Migration SQLite aplicada ao arquivo local.
- [x] Testar leitura/criação, unicidade e chave estrangeira no SQLite.
- [x] Cliente Prisma configurado com adaptador SQLite.
- [ ] Testar valores e filtros a partir de payloads reais de despesas.
- [ ] Revisar modelo de votos individuais após obter payload não vazio.

**Situação histórica da primeira etapa:** schema SQLite e operações básicas
foram verificados. A situação ativa da V2 está registrada na seção
“Migração V2 para PostgreSQL”.
