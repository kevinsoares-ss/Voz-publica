# Etapa 6 — Backend básico

## Escopo

Implementa a API própria com Node.js e TypeScript, validação de parâmetros,
erros JSON consistentes e documentação. As rotas de representantes leem
registros persistidos no PostgreSQL. Rotas para proposições, tramitações,
votações, despesas e votos consultam a API oficial em tempo real, sem
completar respostas vazias com dados presumidos.

## Executar localmente

Na raiz do monorepo, configure `apps/api/.env` a partir do exemplo, caso
ainda não exista, e inicie o servidor:

```powershell
Copy-Item .\apps\api\.env.example .\apps\api\.env
npm run dev:api
```

O padrão local é `http://127.0.0.1:3000`. As variáveis opcionais
`HOST` e `PORT` podem configurar o endereço de escuta. O Prisma usa
`DATABASE_URL` para acessar o PostgreSQL local da V2.

## Rotas implementadas

### `GET /api/health`

Executa uma consulta simples ao banco e informa a disponibilidade:

```json
{
  "status": "ok",
  "database": "ok",
  "checkedAt": "2026-10-28T21:00:00.000Z"
}
```

Retorna `503 SERVICE_UNAVAILABLE` se o banco não estiver acessível. A
resposta não inclui detalhes internos da falha.

### `GET /api/representatives`

Lista representantes da namespace `camara` já armazenados no banco.
Filtros são opcionais:

| Parâmetro | Regra | Padrão |
|---|---|---:|
| `page` | Inteiro de 1 a 1.000.000 | `1` |
| `limit` | Inteiro de 1 a 100 | `20` |
| `q` | Busca parcial por nome, de 1 a 100 caracteres | — |
| `party` | Correspondência exata, de 1 a 30 caracteres | — |
| `state` | UF de dois caracteres; normalizada para maiúsculas | — |

Ordenação estável por nome e ID oficial. Exemplo:
`/api/representatives?q=Maria&state=DF&page=1&limit=20`.

Resposta de sucesso:

O JSON abaixo documenta o formato da resposta; os valores são
ilustrativos e não representam um registro real.

```json
{
  "data": [
    {
      "id": "ID oficial",
      "name": "Nome conforme armazenado",
      "party": null,
      "state": "DF",
      "photoUrl": null,
      "lastSyncedAt": "2026-10-28T21:00:00.000Z",
      "source": {
        "type": "CAMARA_API",
        "name": "Fonte registrada",
        "url": "https://dadosabertos.camara.leg.br/api/v2/...",
        "consultedAt": "2026-10-28T21:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

`data` pode ser uma lista vazia quando não houver registros para os
filtros. `null` representa campo opcional não armazenado; a API não
inventa valores nem substitui ausências por dados fictícios. A resposta
expõe a origem e a data de consulta associadas ao registro, sem retornar
campos pessoais não necessários.

### `GET /api/representatives/{id}`

Consulta pelo ID oficial, na namespace `camara`. O corpo de sucesso é
`{"data": <representante>}` no mesmo formato de item da listagem.
Identificador inválido retorna `400`; ID válido sem registro retorna
`404`.

### Cadastro multi-cargo da Versão 2

- `GET /api/politicians?page=1&limit=20&role=SENATOR&sphere=FEDERAL&state=AC`
- `GET /api/politicians/{id}`

A lista valida `search`, `role`, `sphere`, `state`, `city` e `party`. Os
cargos e esferas aceitos são os enums do modelo Prisma. Um ID da Câmara
mantém o formato oficial já usado em favoritos; outras fontes são
namespaceadas, como `senado:5672`. Os itens incluem cargo, esfera, poder,
ID externo, URL específica da fonte e horário da última consulta. A rota
não afirma que todos os cargos estejam cobertos: só retorna registros
sincronizados e verificados.

### Compromissos, evidências e ações

- `GET /api/commitments?page=1&limit=20&status=EM_ANDAMENTO`
- `GET /api/politicians/{id}/commitments`
- `GET /api/commitments/{id}/evidences`
- `GET /api/politicians/{id}/actions?page=1&limit=20`

As respostas incluem fonte, URL oficial e data de consulta; compromissos
incluem status, método de avaliação, histórico e quantidade de evidências.
Essas rotas são somente leitura. Não há cadastro ou alteração pública:
isso requer autenticação, autorização e fluxo editorial revisado, ainda
pendentes. A ausência de registros não significa ausência de ações ou
compromissos na realidade.

### Consultas oficiais em tempo real

- `GET /api/proposals?page=1&limit=20&year=2025&type=PL`
- `GET /api/proposals/{id}`
- `GET /api/proposals/{id}/progress`
- `GET /api/proposals/{id}/votes`
- `GET /api/votes/{voteId}/votes`
- `GET /api/representatives/{id}/expenses?year=2025&page=1&limit=20`

Essas rotas validam os filtros, consultam somente a base oficial fixa da
Câmara com timeout de 10 segundos e devolvem os registros recebidos com
URL da fonte e horário de consulta. Lista vazia significa apenas que não
houve registros na consulta; valores monetários e posições individuais
não são inferidos. Falhas da Câmara resultam em `502`, timeout em `504`
e limite do provedor em `503`.

### Portal da Transparência — CGU

- `GET /api/cgu/agencies?search=Ministério%20da%20Saúde&page=1`
- `GET /api/cgu/expenses?year=2025&page=1&orgao=36000`

A pesquisa de órgãos consulta o cadastro oficial SIAFI. A consulta de
despesas retorna os valores anuais publicados pelo Portal para empenhado,
liquidado e pago, sem soma ou estimativa local. A fonte e o horário da
consulta acompanham a resposta. A CGU exige pelo menos um filtro de órgão
(`orgao` ou `orgaoSuperior`) para esse recurso; a tela mobile pesquisa e
seleciona códigos do catálogo oficial em vez de presumir identificadores.

O cabeçalho `chave-api-dados` é carregado pelo backend a partir de
`CGU_API_KEY` em `apps/api/.env`. A chave não é enviada ao mobile, incluída
na URL, na proveniência, em logs ou em respostas. Sem chave o backend
retorna `503`; timeout retorna `504`; falhas da fonte retornam `502`.

## Formato de erro

Erros usam o envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more query parameters are invalid.",
    "details": [
      { "field": "limit", "message": "Number must be less than or equal to 100" }
    ]
  }
}
```

Códigos implementados: `BAD_REQUEST` (400), `VALIDATION_ERROR` (400),
`NOT_FOUND` (404), `METHOD_NOT_ALLOWED` (405), `URI_TOO_LONG` (414),
`INTERNAL_ERROR` (500) e `SERVICE_UNAVAILABLE` (503). Respostas não
incluem stack traces nem mensagens internas. Logs de erro registram
método, caminho e nome da classe de erro, sem query string ou payload.

Todas as respostas JSON incluem `Cache-Control: no-store` e
`X-Content-Type-Options: nosniff`. A API suporta somente GET nesta etapa;
nenhuma rota de escrita ou autenticação foi adicionada.

## Testes e resultado

Com `DATABASE_URL` apontando para o PostgreSQL local:

```powershell
npm run db:test --workspace @voz-publica/api
npm run typecheck
npm run build --workspace @voz-publica/api
```

Os testes de integração exercitam saúde do banco, lista com filtro e
paginação, detalhe, validação de query e ID, inexistência de registro,
método não permitido, rota inexistente e a persistência PostgreSQL. Fixtures
temporárias são identificadas como testes e removidas ao final; não são
dados de deputados.

Na verificação de dependências (`npm audit --omit=dev`), permaneceram 8
advisories na cadeia do Expo (5 baixos e 3 altos), incluindo
`deepmerge` e a versão Zod usada pelo Expo CLI. O Zod direto do backend
foi atualizado para `4.6.7`, que não aparece entre os advisories. A
correção automática sugerida exige downgrade do Expo instalado; não foi
aplicada por poder quebrar a compatibilidade do app. Revisar a cadeia do
Expo separadamente antes da publicação.

**Situação:** API básica e rota multi-cargo testadas contra PostgreSQL. A
integração da lista atual do Senado está disponível; CGU, TSE e outros
órgãos ainda não estão expostos por esta API.
