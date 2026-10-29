# Versão 2 — Evolução multi-cargo

## Escopo

A Versão 2 amplia o MVP de deputados federais para agentes públicos
federais, estaduais e municipais. O Guia Mestre V2 também estabelece
PostgreSQL como banco de produção, integrações com Câmara, Senado, CGU e
TSE e módulos de ações de governo e compromissos com evidências.

## Fundação implementada

- O modelo `Representative` agora registra cargo, esfera, poder, cidade
  e nome civil opcional, além dos IDs da fonte. Os registros existentes
  mantêm valores padrão compatíveis com deputados federais.
- `SourceType` inclui Câmara, Senado, CGU, TSE e TCE.
- Foi adicionado o modelo `GovernmentAction`, com tipo de impacto,
  categoria, data do fato, fonte e URL de evidência.
- Compromissos agora aceitam prazo opcional.
- A rota `GET /api/politicians` permite paginação e filtros validados por
  busca, cargo, esfera, UF, cidade e partido. `GET /api/politicians/:id`
  usa um ID externo com namespace, preserva os IDs da Câmara e retorna
  cargo, esfera, dados da fonte e link oficial do registro.
- O importador da Câmara marca explicitamente os registros como
  deputados federais do Legislativo.
- Foi implementado um cliente XML validado para a lista atual de senadores
  do Senado, além de um sincronizador idempotente.
- A tela Agentes consulta a API unificada e permite filtrar por cargo,
  partido, UF e município. Os perfis mostram a fonte e não oferecem links
  de despesas/atuação de outro órgão quando a integração não existe.
- A chave pública dos perfis preserva os IDs de favoritos existentes da
  Câmara e distingue namespaces de outras fontes, por exemplo
  `senado:5672`.
- As rotas de leitura `GET /api/commitments`, `GET
  /api/politicians/:id/commitments`, `GET
  /api/commitments/:id/evidences` e `GET /api/politicians/:id/actions`
  retornam proveniência, status, histórico e evidências relacionados.
- O app exibe compromissos registrados e ações documentadas com estado
  vazio honesto; não há conteúdo editorial de demonstração.
- A API só expõe leitura para esses registros. Cadastro e revisão exigem
  autenticação e autorização, ainda não implementadas.

## Validação de fontes e sincronização

Em 28/10/2026, foi consultada a lista oficial atual do Senado
(`GET /dadosabertos/senador/lista/atual`), que respondeu HTTP 200 em XML.
Foram inspecionados os campos de identificação, nome parlamentar/civil,
partido, UF, foto e página oficial. A sincronização real inseriu/atualizou
81 senadores. A sincronização limitada da Câmara foi executada até o fim
da paginação atual e retornou 513 deputados em 6 páginas. A base local
contém, portanto, 594 registros sincronizados dessas duas fontes (513
deputados e 81 senadores). Isso não é cobertura de outros cargos, esferas,
nem garantia de que os dados permanecerão atualizados sem nova sincronização.

O catálogo oficial TSE foi consultado pela API CKAN para os conjuntos
Candidatos 2024 e 2026. A resposta lista recursos ZIP/CSV; os arquivos ainda
não foram baixados nem processados, portanto dados eleitorais não estão
integrados ao app.

A especificação OpenAPI oficial da CGU foi inspecionada e confirma o
cabeçalho `chave-api-dados` como chave obrigatória. A chave fornecida foi
configurada somente em `apps/api/.env`, arquivo ignorado pelo Git e usado
somente pelo backend. A pesquisa oficial de órgãos SIAFI e a consulta de
despesas anuais por órgão foram implementadas. Em 28/10/2026, foi validada
uma resposta real para 2025 do órgão retornado pela pesquisa oficial
"Ministério da Saúde - Unidades com vínculo direto". O endpoint exige ao
menos um filtro de órgão para despesas, apesar de a especificação OpenAPI
marcá-los como opcionais; a API local valida essa exigência e a UI permite
selecionar um código retornado pela CGU, sem presumir códigos.

## Estado do PostgreSQL

O runtime Prisma usa PostgreSQL 18 local com uma conta de aplicação
separada da conta administrativa. A migration inicial PostgreSQL foi
aplicada em `voz_publica_v2`; a URL e a senha gerada da conta de aplicação
estão somente no `.env` ignorado pelo Git. O banco SQLite anterior e suas
migrations foram preservados. Um banco shadow separado é usado pelo
comando local `prisma migrate dev`.

Os registros oficiais foram sincronizados para o PostgreSQL: 513 deputados
da Câmara em 6 páginas e 81 senadores.
Os dados locais SQLite não foram apagados; não havia registros editoriais
de compromisso, ações ou despesas a migrar.

## Integrações pendentes

- Senado: a lista de senadores foi validada e integrada; proposições,
  votações, despesas e seus modelos ainda precisam de validação e integração.
- CGU: catálogo SIAFI e despesas anuais por órgão do Executivo Federal
  estão integrados em modo de consulta. Outros recursos (cartões, viagens,
  contratos e transferências) ainda não estão integrados. A chave permanece
  somente em ambiente local do backend; nunca a inclua no app, exemplos,
  URLs ou logs.
- TSE: o catálogo dos conjuntos foi validado, mas ainda é preciso baixar
  amostras e confirmar os campos dos arquivos oficiais antes de normalizar.
- TCEs e portais locais: não há um endpoint nacional único; a cobertura
  deverá ser validada por estado/município e claramente identificada.
- Ações e compromissos: as rotas públicas de leitura e as telas estão
  conectadas, mas a base ainda não tem registros editoriais. Falta definir
  autenticação, autorização e processo de revisão para cadastrar/alterar
  registros com segurança.
- Produção: ainda faltam hospedagem, segredos de produção, monitoramento,
  estratégia de atualização e validação em Android/iOS físico.

Nenhum registro de outro cargo, despesa, ação de governo ou compromisso
foi inventado para preencher essas lacunas.

## Próximas etapas

1. Implementar autenticação/autorização editorial antes de permitir criar
   ou alterar compromissos, ações, evidências e avaliações.
2. Validar recursos legislativos adicionais do Senado e integrar proposições,
   votações e despesas apenas depois de inspecionar respostas oficiais reais.
3. Processar amostras TSE com um modelo separado de candidaturas, sem
   apresentar candidaturas como mandatos ativos; avaliar outros recursos
   CGU somente após validar suas respostas oficiais.
4. Validar fontes estaduais/municipais individualmente; não há uma fonte
   nacional única para esses cargos.
5. Executar verificações de acessibilidade, testes em emulador/dispositivo
   físico e preparar implantação de produção com segredos e monitoramento.

## Validação desta entrega

- Schema Prisma validado e cliente gerado.
- A sincronização da Câmara percorreu todas as páginas retornadas pela API:
  513 deputados em 6 páginas, sem próxima página; 81 senadores da fonte real.
- 14 testes de API/banco/integrações passaram, incluindo filtros por
  cargo/esfera, detalhes por namespace, validação de XML e erros upstream.
- Typecheck dos workspaces, build da API e export Web do Expo passaram.
- Endpoints de compromissos, ações e evidências foram cobertos por teste
  de integração com fixtures temporárias e fontes identificadas.
- A CGU respondeu com sucesso à pesquisa do catálogo oficial SIAFI e a uma
  consulta real de despesas anuais por órgão para 2025. A resposta é
  consultada sob demanda, sem persistir nem publicar a chave.
- A aplicação e os testes de integração agora usam PostgreSQL; o banco
  novo retornou health `ok`, e o SQLite legado continua íntegro.
