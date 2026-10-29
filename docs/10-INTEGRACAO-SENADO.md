# Integração com o Senado Federal — Versão 2

## Fonte e formato observados

A lista atual de senadores é publicada pela API oficial de Dados Abertos do
Senado em:

`https://legis.senado.leg.br/dadosabertos/senador/lista/atual`

A consulta de 28/10/2026 respondeu HTTP 200 sem autenticação e em XML. O
cliente usa timeout, valida o XML e valida o formato esperado antes de
normalizar. Os campos usados são:

| Campo oficial | Campo armazenado |
|---|---|
| `CodigoParlamentar` | `externalId` no namespace `senado` |
| `NomeParlamentar` | `name` |
| `NomeCompletoParlamentar` | `civilName`, quando presente |
| `SiglaPartidoParlamentar` | `party`, quando presente |
| `UfParlamentar` | `state`, quando presente |
| `UrlFotoParlamentar` | `photoUrl`, quando presente |
| `UrlPaginaParlamentar` | `sourceUrl`, quando presente |

O nome parlamentar é mantido conforme a fonte; nome civil, partido, UF,
foto e link individual permanecem opcionais se ausentes. O modelo classifica
os registros observados como senadores federais do Poder Legislativo.
Nenhum campo de cidade é presumido.

## Sincronização

Na raiz do monorepo, com a API e o banco local configurados:

```powershell
npm run senado:sync:representatives --workspace @voz-publica/api
```

O comando consulta a lista atual completa, registra URL, horário e
quantidade na entidade `Source` e faz upsert pela combinação de namespace
`senado` e ID parlamentar oficial. A importação não cria lista sintética e
não remove registros antigos que deixem de aparecer.

Resultado observado nesta execução: 81 senadores atualizados/inseridos.
Esse número corresponde à resposta consultada e pode mudar com licenças,
suplências e atualizações oficiais.

Os registros são expostos por `GET /api/politicians`; use
`?role=SENATOR` para filtrá-los. A chave pública é `senado:<CodigoParlamentar>`,
por exemplo `senado:5672`. O perfil retorna o link oficial individual e
indica que proposições, votações nominais e despesas do Senado ainda não
estão integradas ao aplicativo.

## Segurança e limitações

- A integração usa HTTPS, timeout e validação de payload XML com Zod.
- Erros de rede, timeout, HTTP e formato inválido são explícitos; não há
  fallback de sucesso nem dados fictícios.
- A lista atual não contém município nem um histórico completo de mandatos;
  esses dados não são inventados.
- A especificação oficial também descreve recursos de proposições e
  votações, mas seus payloads e critérios de associação precisam ser
  validados antes de integrar esses módulos.

## Testes

Os testes automatizados verificam mapeamento do XML, payload inválido,
erro HTTP e comportamento do sincronizador com fixture identificada como
teste. A sincronização real e a rota de perfil foram verificadas
separadamente contra a lista oficial.
