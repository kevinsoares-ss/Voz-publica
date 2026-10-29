# Etapa 3 — UX/UI

## Objetivo

Definir a experiência inicial do Voz Pública: navegação, fluxos, wireframes
de baixa fidelidade, componentes e direção visual do MVP. Este documento
orienta etapas futuras; não cria telas funcionais nem presume dados que a
API oficial não forneceu.

## Escopo e princípios

Público inicial: pessoas que querem consultar informações documentadas
sobre deputados federais do Brasil.

- Priorizar consulta e leitura, não opinião ou classificação de
  representantes.
- Mostrar fonte e data da consulta junto aos dados relevantes.
- Distinguir carregamento, sucesso, lista vazia, erro e informação
  indisponível.
- Não apresentar ausência de resposta como valor zero ou como fato.
- Separar dados oficiais de compromissos registrados e avaliados
  editorialmente.
- Nunca indicar que uma proposição, votação ou notícia comprova por si só
  o cumprimento de um compromisso.
- Manter favoritos localmente no aparelho no MVP, sem exigir conta.
- Projetar primeiro para celular, com conteúdo legível em telas menores.

## Navegação principal

Barra inferior persistente com quatro destinos:

1. **Início:** apresentação do serviço e atalhos para consulta.
2. **Deputados:** pesquisa, filtros e lista paginada.
3. **Compromissos:** registros documentados, com método e estado de
   verificação visíveis.
4. **Favoritos:** deputados salvos localmente.

O perfil do deputado abre a partir de Deputados ou Favoritos. Detalhes de
proposição, votação e despesa são páginas empilhadas sobre a origem, com
ação clara para voltar. A barra inferior permanece nas quatro áreas
principais e pode ser ocultada nas páginas de detalhe para liberar espaço.

## Fluxos principais

### Consultar um deputado

Início ou Deputados → pesquisar e/ou aplicar filtros de partido e UF →
percorrer lista paginada → abrir perfil → consultar seções e fontes →
abrir detalhe de proposição, votação ou despesa quando houver informação.

Ao alterar a busca ou os filtros, atualizar a lista e reiniciar a
paginação. Uma lista sem resultados mostra um estado vazio específico da
consulta, sem ser confundida com indisponibilidade da API.

### Salvar e revisitar um favorito

Lista ou perfil → tocar em Favoritar → confirmação visual do estado →
Favoritos → abrir perfil. A ação de favoritar não requer login. Se o
registro deixar de estar disponível na fonte, manter apenas o
identificador salvo e explicar que os dados atuais não puderam ser
carregados.

### Consultar uma proposição

Perfil do deputado ou área de consulta → lista paginada de proposições →
detalhe com identificação oficial, ementa, autor e situação quando
disponíveis → consultar tramitações em ordem temporal → abrir votações
relacionadas → consultar votos individuais quando retornados pela fonte →
abrir link oficial.

As relações entre deputado e proposição devem refletir o que a API
confirmar; a interface não deve presumir autoria ou coautoria.

### Consultar despesas

Perfil do deputado → seção Despesas → escolher filtros de período
disponíveis → revisar registros e valores conforme retornados → abrir
fonte oficial. Não exibir totais agregados até haver regra documentada
para campos, período e tratamento de registros.

### Entender um compromisso

Compromissos → abrir registro → ler texto, origem/contexto, critérios de
avaliação, estado atual, justificativa e histórico → abrir cada evidência
e sua fonte. Sem evidência suficiente, mostrar isso explicitamente; não
calcular estado automaticamente a partir de palavras em notícias.

## Wireframes de baixa fidelidade

Os blocos abaixo descrevem hierarquia e comportamento, não dimensões ou
arte final.

### Início

```text
┌─────────────────────────────────────┐
│ Voz Pública                         │
│ Informação pública, com fonte.      │
├─────────────────────────────────────┤
│ [ Buscar deputado              🔍 ] │
│                                     │
│ [ Consultar deputados ]             │
│ [ Ver compromissos ]                │
│                                     │
│ Sobre os dados                      │
│ Fonte oficial • data da consulta    │
├─────────────────────────────────────┤
│ Início  Deputados  Compromissos  ♥  │
└─────────────────────────────────────┘
```

O resumo da tela não inventa métricas nem estatísticas. A área “Sobre os
dados” explica que a informação depende das fontes públicas consultadas.

### Deputados

```text
┌─────────────────────────────────────┐
│ Deputados                           │
│ [ Nome do deputado             🔍 ] │
│ [ Partido ▾ ] [ UF ▾ ] [ Limpar ]  │
│ Consulta atualizada em: data/hora   │
├─────────────────────────────────────┤
│ [foto] Nome informado pela fonte    │
│        Partido • UF                 │
│        [♡ Favoritar]                │
├─────────────────────────────────────┤
│ [foto] Nome informado pela fonte    │
│        Partido • UF                 │
│        [♡ Favoritar]                │
├─────────────────────────────────────┤
│ [ Carregar mais ]                   │
├─────────────────────────────────────┤
│ Início  Deputados  Compromissos  ♥  │
└─────────────────────────────────────┘
```

Partido, UF e foto só aparecem quando fornecidos. O carregamento
progressivo oferece um controle explícito e também pode aceitar rolagem
até o fim, sem buscar a lista inteira de uma vez.

### Perfil do deputado

```text
┌─────────────────────────────────────┐
│ ‹ Deputados                         │
│ [foto] Nome informado pela fonte    │
│        Partido • UF                 │
│        [♡ Favoritar]                │
│ Fonte oficial • consultado em ...   │
├─────────────────────────────────────┤
│ Visão geral | Proposições | Votos   │
│ Despesas | Compromissos             │
├─────────────────────────────────────┤
│ Informações do mandato              │
│ Campo: valor ou “Não informado...”  │
│                                     │
│ Atualização dos dados               │
│ [ Abrir fonte oficial ]             │
└─────────────────────────────────────┘
```

As seções podem ser abas ou blocos empilhados; preferir blocos roláveis
com navegação local clara para não sobrecarregar telas pequenas.

### Detalhe de proposição

```text
┌─────────────────────────────────────┐
│ ‹ Voltar                            │
│ PL número/ano                       │
│ Ementa oficial                      │
│ Situação: valor ou não informado    │
│ Autor: valor ou não informado       │
│ Identificador oficial               │
│ [ Abrir fonte oficial ]             │
├─────────────────────────────────────┤
│ Tramitações                         │
│ data • órgão • descrição            │
│ data • órgão • descrição            │
├─────────────────────────────────────┤
│ Votações                            │
│ descrição • data • resultado        │
└─────────────────────────────────────┘
```

Seções sem registros devem dizer “Nenhum registro retornado pela fonte
para esta consulta”, com data da consulta, e não desaparecer sem
explicação.

### Despesas

```text
┌─────────────────────────────────────┐
│ ‹ Perfil do deputado                │
│ Despesas                            │
│ [ Ano ▾ ] [ Mês ▾ ] [ Tipo ▾ ]     │
│ Fonte • consultado em ...           │
├─────────────────────────────────────┤
│ Tipo conforme a fonte               │
│ Fornecedor conforme a fonte         │
│ Período • valor conforme a fonte    │
│ [ Abrir registro oficial ]          │
└─────────────────────────────────────┘
```

Filtros que não forem confirmados como compatíveis com o endpoint não
devem ser exibidos. Valores usam o significado e a precisão recebidos;
nenhuma soma é implícita.

### Compromissos e detalhe

```text
┌─────────────────────────────────────┐
│ Compromissos                        │
│ [ Buscar compromisso           🔍 ] │
│ Estado: A verificar ▾               │
├─────────────────────────────────────┤
│ Título do compromisso               │
│ Estado + indicação de revisão       │
│ Fonte • registrado em ...           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ‹ Compromissos                      │
│ Texto e contexto                    │
│ Estado: Sem informação suficiente   │
│ Critérios e justificativa           │
│ Histórico de alterações             │
│ Evidências                          │
│ [Fonte] título • data do fato       │
│ Consultado em ...                   │
└─────────────────────────────────────┘
```

Filtros podem usar os estados documentados no guia: `A_VERIFICAR`,
`EM_ANDAMENTO`, `CUMPRIDO`, `PARCIALMENTE_CUMPRIDO`, `NAO_CUMPRIDO` e
`SEM_INFORMACAO_SUFICIENTE`. Cada mudança de estado deve apontar para
justificativa e evidências; a lista não sugere ranking.

### Favoritos

```text
┌─────────────────────────────────────┐
│ Favoritos                           │
│ Deputados salvos neste aparelho     │
├─────────────────────────────────────┤
│ Nome informado pela fonte           │
│ Partido • UF • [Remover]            │
└─────────────────────────────────────┘
```

Estado vazio: explicar como adicionar um favorito a partir da lista ou do
perfil. Estado de erro ao carregar o perfil não remove o favorito local.

## Estados compartilhados de interface

Aplicar aos componentes que consultam dados:

- **Carregando:** indicador visível e contexto textual (“Carregando
  deputados...”), sem bloquear navegação não relacionada.
- **Sucesso:** conteúdo, fonte e data da consulta.
- **Vazio:** mensagem correspondente ao recurso/filtro consultado; oferecer
  limpar filtros quando aplicável.
- **Erro de conexão:** explicar que não foi possível conectar e oferecer
  “Tentar novamente”.
- **Erro da fonte/servidor:** informar indisponibilidade da consulta sem
  mascarar como lista vazia; preservar a possibilidade de tentar de novo.
- **Conteúdo parcial:** mostrar seções disponíveis e indicar quais não
  puderam ser carregadas.
- **Informação ausente:** “Não informado pela fonte consultada”.
- **Atualização:** indicar recarregamento sem apagar imediatamente o
  conteúdo válido já exibido.

## Inventário inicial de componentes

- Barra inferior e cabeçalho com voltar.
- Campo de busca e seletores de filtro.
- Cartão de deputado e cartão de compromisso.
- Cabeçalho de perfil e abas/atalhos para seções.
- Linha temporal de tramitações e item de votação.
- Linha de despesa com valor original da fonte.
- Cartão de evidência com origem, data e link.
- Selo textual de status, com ícone/cor como apoio.
- Bloco de fonte/data da consulta.
- Estados de carregamento, erro, vazio e indisponibilidade parcial.
- Botão primário, secundário, link oficial e botão de favorito.

## Direção visual proposta

### Personalidade

Clara, confiável, sóbria e acessível. Evitar linguagem visual de campanha,
partido ou placar competitivo. O nome “Voz Pública” deve aparecer junto à
origem pública das informações, sem sugerir endosso institucional.

### Paleta inicial

Proposta para prototipação; validar contraste em cada componente antes de
implementar:

| Token | Cor | Uso |
|---|---|---|
| `primary` | `#174C3C` | Ações principais e navegação ativa |
| `primary-pressed` | `#10382C` | Estado pressionado |
| `accent` | `#D6A84F` | Destaque pontual, nunca único indicador de estado |
| `background` | `#F7F8F6` | Fundo geral |
| `surface` | `#FFFFFF` | Cartões e superfícies |
| `text-primary` | `#17211D` | Texto principal |
| `text-secondary` | `#53615A` | Metadados e texto auxiliar |
| `border` | `#D8E0DB` | Divisórias e contornos |
| `error` | `#A33131` | Erros, sempre acompanhado por texto/ícone |
| `success` | `#286344` | Confirmações, sempre acompanhado por texto/ícone |

Usar fundo neutro e verde escuro como base, sem associar as cores de
status a avaliações partidárias. Status de compromisso sempre aparece
também por extenso; nunca depender somente da cor.

### Tipografia, espaçamento e interação

- Usar família sem serifa nativa do sistema, privilegiando legibilidade e
  consistência entre Android e iOS.
- Hierarquia sugerida: título de tela 24–28 pt; título de seção 18–20 pt;
  corpo 16 pt; metadados nunca menores que 12 pt.
- Grade base de espaçamento de 8 pt; margens laterais de 16 pt; cartões
  com agrupamento e respiro consistentes.
- Alvos de toque de pelo menos 44 × 44 pt, com área de toque que não
  dependa de ícone pequeno.
- Permitir aumento de fonte do sistema, quebra de linha e rolagem vertical.
- Foco, seleção e estado pressionado devem ser perceptíveis; manter rótulos
  acessíveis em ícones de busca, voltar e favorito.
- Não comunicar estado apenas por cor. Conferir contraste de texto,
  controles e foco segundo WCAG 2.1 AA antes da implementação.

## Registro de decisões

1. Navegação inicial usa os quatro destinos recomendados no guia.
2. Favoritos são locais no MVP; nenhuma conta ou dado pessoal de usuário
   foi introduzido.
3. Fonte e data de consulta fazem parte da hierarquia de conteúdo, não
   ficam escondidas em uma tela “Sobre”.
4. Ausência de registros, ausência de um campo e falha da API têm estados
   diferentes.
5. A paleta é uma proposta inicial de produto, não uma identidade visual
   aprovada pelo usuário nem associação oficial à Câmara.
6. Dados reais que o guia documenta como potencialmente pessoais, como
   CPF, não são necessários nos wireframes e não devem ser expostos por
   padrão.

## Passos para revisão e conferência

1. Revisar os fluxos e wireframes em conjunto com os requisitos do Guia
   Mestre.
2. Conferir se cada tela de consulta contempla estados de sucesso, vazio,
   erro e indisponibilidade parcial.
3. Validar se fonte, data e ausência de informação estão explícitas.
4. Revisar paleta, tipografia e componentes com protótipos visuais e
   ferramentas de contraste quando a implementação visual começar.
5. Registrar mudanças aprovadas antes de iniciar a Etapa 4.

Resultado esperado desta etapa: fluxo do MVP, wireframes textuais,
inventário de componentes e direção visual documentados. A validação
visual, contraste final e testes com usuários ainda dependem de protótipos
e não são declarados concluídos neste documento.

## Checklist

- [x] Navegação principal descrita.
- [x] Fluxos centrais do MVP documentados.
- [x] Wireframes de baixa fidelidade das áreas prioritárias registrados.
- [x] Componentes reutilizáveis identificados.
- [x] Direção visual e tokens iniciais propostos.
- [x] Estados de carregamento, sucesso, vazio, erro e conteúdo parcial
  especificados.
- [ ] Validar protótipos visuais e contraste com ferramentas.
- [ ] Revisar os fluxos com usuários e registrar feedback.

**Situação:** definição inicial da Etapa 3 documentada em 28/10/2026.
Esta entrega é uma especificação textual para revisão, não uma aprovação
final de identidade visual nem uma implementação mobile.

**Próximo passo no cronograma:** após revisar/aprovar este documento e
fechar as validações pendentes da Etapa 2, seguir para a Etapa 4 —
repositório e estrutura.
