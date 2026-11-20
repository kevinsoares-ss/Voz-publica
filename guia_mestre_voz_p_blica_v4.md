# GUIA MESTRE --- VOZ PÚBLICA

## Versão 4 (V4)

**Projeto:** Voz Pública\
**Tipo:** Aplicativo mobile e Web de transparência política\
**Status:** Em evolução (Foco em UI/UX e Consolidação Visual)\
**Documento:** Guia Mestre de arquitetura, escopo, experiência e evolução\
**Versão:** 4.0\
**Data:** 20/11/2026

------------------------------------------------------------------------

## 1. Visão geral

O **Voz Pública** é uma plataforma de transparência política que permite
ao cidadão consultar informações sobre representantes públicos,
acompanhar sua atuação e acessar dados provenientes de fontes oficiais.

Após estabelecer a base multi-cargo e as integrações oficiais na V3, a
**Versão 4 (V4)** tem como foco principal elevar a **qualidade visual (UI)**
e a **fluidez de uso (UX)** sem inflar a complexidade estrutural. O
objetivo é transformar os dados oficiais já sincronizados em uma
experiência intuitiva, moderna, acolhedora e de leitura rápida ("glanceable")
logo na abertura do aplicativo.

### 1.1 Objetivos da V4

-   Facilitar o acesso imediato do cidadão aos principais indicadores de
    despesas governamentais logo na tela inicial.
-   Elevar o acabamento visual com hierarquia tipográfica, superfícies em
    camadas e navegação limpa.
-   Reduzir o esforço de navegação e o número de toques para acessar
    informações críticas.
-   Preservar a integridade, proveniência e transparência de todos os dados
    exibidos.
-   Manter a continuidade das etapas técnicas do projeto sem descartar
    funcionalidades existentes.

### 1.2 Princípios do projeto (Mantidos e Reforçados)

1.  **Transparência:** toda informação deve ter origem identificável.
2.  **Rastreabilidade:** preservar fonte oficial, identificador original
    e data da consulta.
3.  **Integridade:** não inventar, presumir ou completar dados ausentes.
4.  **Separação de responsabilidades:** distinguir dados oficiais,
    editoriais e calculados.
5.  **Clareza Visual:** dados complexos devem ser apresentados de forma
    compreensível, sem poluição visual.
6.  **Segurança:** proteger operações administrativas e credenciais.
7.  **Evolução incremental:** preservar o que funciona e aprimorar a
    interface com foco na experiência real do cidadão.

------------------------------------------------------------------------

## 2. Evolução de Experiência (UI/UX) e Escopo Funcional

### 2.1 Dashboard de Entrada (Tela Inicial / Painel)

A tela inicial deixa de ser apenas um ponto de passagem e passa a atuar como
um **Painel Executivo de Transparência**, oferecendo resumo imediato:

-   **Cards de Destaque Financeiro (KPIs):** Exibição visual das maiores
    despesas anuais do Executivo Federal e órgãos do catálogo SIAFI
    (via integração CGU já existente).
-   **Leitura Rápida (Glanceability):** Destaque para valores totais,
    órgãos com maior volume de repasse e indicadores contextuais claros.
-   **Acesso Direto (One-Tap):** Tocar em um card de resumo na tela inicial
    direciona o cidadão diretamente para o detalhamento ou listagem filtrada
    daquele órgão ou categoria.
-   **Indicador de Atualização:** Exibição discreta da data/hora da última
    sincronização e fonte oficial utilizada.

### 2.2 Refinamento Visual e Identidade de Interface (UI)

Para conferir ao aplicativo aparência de produto maduro e confiável:

-   **Sistema de Superfícies (Cards):** Uso consistente de cartões com
    bordas sutis, espaçamento respirável e elevação leve para separar blocos
    de informação.
-   **Hierarquia Tipográfica:** Contraste claro entre títulos, rótulos
    institucionais e valores numéricos/monetários (alinhamento tabular para
    facilitar comparação de cifras).
-   **Selos de Proveniência e Confiança:** Badges visuais discretos para
    distinguir visualmente *Dados Oficiais* (Câmara, Senado, CGU), *Dados
    Calculados* e futuros *Conteúdos Editoriais*.
-   **Modo Escuro e Claro Otimizados:** Paleta neutra institucional de alto
    contraste, evitando cansaço visual em leituras prolongadas.

### 2.3 Fluidez de Navegação e Feedback (UX)

-   **Barra de Navegação Simplificada (Bottom Tabs):** Organização direta
    em abas essenciais:
    1.  **Início (Painel):** Resumo de despesas do governo e atalhos.
    2.  **Agentes:** Deputados federais e Senadores com filtros rápidos.
    3.  **Proposições:** Acompanhamento legislativo e votações.
    4.  **Favoritos:** Acesso rápido aos representantes acompanhados.
-   **Filtros Rápidos em Agentes:** Inclusão de tags/chips de acesso rápido
    no topo da listagem (ex.: *Favoritos*, *Por Estado/UF*, *Cargo*,
    *Partido*) para reduzir digitação.
-   **Skeleton Screens (Carregamento Inteligente):** Substituição de telas
    em branco ou spinners genéricos por esqueletos visuais durante consultas
    à API.
-   **Estados Vazios Educativos:** Quando um dado não estiver disponível na
    fonte oficial, exibir mensagem clara informando a ausência na origem e
    a data da consulta, evitando falsa impressão de erro do aplicativo.

### 2.4 Usabilidade das Consultas de Despesas da CGU

As telas **Despesas por órgão** e **Órgãos públicos** consultam o mesmo
catálogo SIAFI e a mesma fonte de despesas. A experiência deve ser coerente
entre elas e deixar claro que o catálogo lista órgãos, mas a consulta de
despesas exige selecionar um órgão e um ano.

-   **Carregamento sem falso vazio:** manter o estado de carregamento até a
    resposta do catálogo ou da consulta chegar. Não exibir “nenhum órgão” ou
    “nenhuma despesa” enquanto a requisição ainda estiver pendente.
-   **Catálogo apropriado ao período:** não apresentar órgãos explicitamente
    marcados como “em extinção” como opções atuais. Se houver necessidade de
    consulta histórica, separar esses registros e identificá-los como
    históricos.
-   **Código visível:** mostrar o código SIAFI junto ao nome do órgão antes
    da seleção. Nomes iguais não garantem que os códigos identifiquem a
    mesma unidade ou o mesmo período.
-   **Códigos alternativos:** quando a consulta do código escolhido retornar
    vazia, procurar no catálogo apenas registros com a mesma descrição
    oficial. Consultar os códigos alternativos para o mesmo ano e usar o
    primeiro que retornar dados; informar ao cidadão qual código respondeu.
    Não substituir por um órgão de nome apenas parecido.
-   **Estado vazio específico:** identificar órgão, código consultado e ano
    sem sugerir que o valor gasto foi zero. Quando aplicável, explicar que a
    CGU não publicou registros para aquele filtro e oferecer ações claras:
    alterar o ano ou selecionar outro órgão.
-   **Erros diferentes de ausência:** falha de rede, indisponibilidade da
    CGU, limite de requisições e resposta inválida devem aparecer como erro,
    com opção de tentar novamente; não devem ser apresentados como lista
    vazia.
-   **Proveniência:** mostrar fonte e horário da consulta junto aos
    resultados, inclusive quando houver troca para um código alternativo.
-   **Consistência entre telas:** manter o mesmo tratamento para órgãos
    históricos, códigos alternativos, paginação, estados de carregamento e
    mensagens vazias em **Despesas por órgão** e **Órgãos públicos**.
-   **Acessibilidade:** tornar categorias, opções de órgão, ano e ações
    utilizáveis por teclado e leitor de tela; anunciar mudanças de
    carregamento, erro e resultado sem depender apenas de cor ou ícone.

### 2.5 Escopo Funcional Consolidado (Herdado da V3)

-   **Representantes públicos:** Base sincronizada de Deputados Federais
    (513) e Senadores (81).
-   **Perfis:** Exibição de dados oficiais, proveniência e ações
    documentadas.
-   **Favoritos:** Armazenamento local rápido no dispositivo.
-   **Proposições e Votações:** Consulta da Câmara dos Deputados (Senado em
    evolução).
-   **Despesas:** Consulta via CGU / catálogo SIAFI.
-   **Compromissos:** Conectado à API em modo somente leitura até a
    implementação da camada editorial.

------------------------------------------------------------------------

## 3. Arquitetura Tecnológica

A base tecnológica da V3 permanece íntegra, garantindo estabilidade e
aproveitamento total do trabalho realizado:

  Camada                 Tecnologia
  ---------------------- ------------------------------------
  Aplicativo mobile      React Native
  Plataforma mobile      Expo (Expo Router)
  Linguagem mobile       TypeScript
  Estilização / UI       StyleSheet / Design Tokens padronizados
  Servidor               Node.js
  Linguagem backend      TypeScript
  API                    REST
  Banco de dados ativo   PostgreSQL 18 ou versão compatível
  ORM                    Prisma
  Aplicativo Web         Expo Router / exportação Web
  Hospedagem             Vercel
  Banco em nuvem         Neon (`DATABASE_URL`)

### 3.1 Estrutura do Repositório

``` text
voz-publica/
├── apps/
│   ├── mobile/                 # Aplicativo React Native com Expo e TypeScript
│   │   ├── src/components/ui/  # Componentes visuais reutilizáveis (Cards, Badges, Skeletons)
│   │   └── src/theme/          # Tokens de cores, tipografia e espaçamento
│   └── api/                    # API Node.js com TypeScript
├── docs/                       # Documentação e decisões por etapa
├── scripts/                    # Ferramentas locais de validação
├── logs/                       # Evidências JSON de consultas oficiais
├── api/                        # Entrada catch-all da Vercel
├── package.json                 # Workspaces e scripts da raiz
└── README.md                    # Instruções de instalação e execução
```

### 3.2 Segurança e Proveniência (Inalteradas)

-   Manter `CGU_API_KEY` exclusivamente no backend.
-   Nunca expor segredos no aplicativo mobile ou repositório.
-   Preservar fonte oficial, identificador original e timestamp em todas as
    exibições de dados.
-   Não preencher lacunas de dados com zeros fictícios ou estimativas não
    declaradas.

------------------------------------------------------------------------

## 4. Roadmap de Evolução da V4

O roadmap da V4 integra o polimento visual imediato com a continuidade
técnica planejada para a plataforma:

### Fase 1 --- Identidade Visual, Design System e Dashboard Inicial (Prioridade Imediata)

**Objetivo:** Entregar a nova experiência visual e o painel de resumo de
despesas na tela inicial sem alterar regras complexas de backend.

-   [ ] Padronizar tokens de design (cores, tipografia, bordas e sombras).
-   [ ] Criar componentes visuais base: `StatCard` (KPIs), `SourceBadge`
        (proveniência), `SkeletonLoader` e `EmptyStateCard`.
-   [ ] Reestruturar a tela inicial (**Início**) com o painel de resumo das
        principais despesas governamentais (CGU/SIAFI) e atalhos rápidos.
-   [ ] Refinar a barra de navegação inferior (*Bottom Tabs*) e os chips de
        filtro rápido na tela **Agentes**.
-   [ ] Revisar contraste e legibilidade em dispositivos móveis e Web.
-   [ ] Alinhar o fluxo de despesas da CGU nas telas **Despesas por órgão**
        e **Órgãos públicos**, incluindo catálogo, códigos alternativos e
        estados vazios.
-   [ ] Verificar que entradas “em extinção” não sejam oferecidas como
        órgãos atuais e que erros da fonte sejam distinguíveis de consultas
        sem resultados.

### Fase 2 --- Autenticação e Autorização Editorial

**Objetivo:** Permitir que usuários autorizados administrem conteúdo
editorial com segurança.

-   [ ] Implementar modelo de usuários administrativos e autenticação no
        backend.
-   [ ] Proteger rotas de escrita com validação rigorosa de permissões.
-   [ ] Registrar auditoria de alterações administrativas.

### Fase 3 --- Conteúdo Editorial de Compromissos e Ações

**Objetivo:** Habilitar o cadastro controlado e rastreável de compromissos
e ações documentadas.

-   [ ] Implementar CRUD editorial protegido para compromissos, ações e
        evidências.
-   [ ] Exibir selo visual diferenciado entre *Informação Oficial* e
        *Análise/Registro Editorial*.
-   [ ] Definir critérios objetivos de status (*Pendente*, *Em andamento*,
        *Cumprido*, *Não cumprido*).

### Fase 4 --- Integração Ampliada com o Senado e Novos Cargos

**Objetivo:** Expandir a cobertura legislativa e federativa.

-   [ ] Integrar despesas parlamentares, votações e proposições do Senado
        Federal após validação das APIs oficiais.
-   [ ] Mapear e documentar fontes oficiais para cargos estaduais e
        municipais.

### Fase 5 --- Confiabilidade, Cache e Observabilidade

**Objetivo:** Garantir performance na tela inicial e resiliência nas
sincronizações.

-   [ ] Implementar cache inteligente ou pré-agregação leve no backend para
        que o **Dashboard de Despesas** na tela inicial carregue
        instantaneamente.
-   [ ] Automatizar rotinas de sincronização com logs de execução e
        tratamento de falhas.

------------------------------------------------------------------------

## 5. Requisitos de Ambiente e Execução

Os comandos de desenvolvimento, testes e deploy permanecem compatíveis com a
estrutura consolidada:

``` powershell
# Instalação de dependências
npm install

# Iniciar API local
npm run dev:api

# Iniciar aplicativo Mobile / Web
npm run dev:mobile

# Verificação de tipos e build
npm run typecheck
npm run build --workspace @voz-publica/api
```

------------------------------------------------------------------------

## 6. Checklist de Validação da V4

-   [ ] A tela inicial apresenta resumo claro das principais despesas
        governamentais logo ao abrir o app.
-   [ ] Todos os números exibidos no painel inicial possuem indicação de
        fonte oficial e data de referência.
-   [ ] Estados de carregamento utilizam *Skeleton Screens* suaves.
-   [ ] Ausência de dados é comunicada com clareza, sem exibir valores
        fictícios.
-   [ ] O catálogo não apresenta estado vazio antes de concluir o
        carregamento.
-   [ ] Cada opção de órgão mostra seu código SIAFI e não oferece
        unidades marcadas “em extinção” como atuais.
-   [ ] Códigos alternativos só são tentados quando têm a mesma descrição
        oficial; se um responder, a interface identifica o código efetivamente
        consultado.
-   [ ] Uma consulta vazia identifica o órgão, o código e o ano, e oferece
        um próximo passo sem converter ausência em R$ 0,00.
-   [ ] As duas telas da CGU apresentam os mesmos resultados e estados para
        a mesma seleção de órgão e ano.
-   [ ] A navegação entre Início, Agentes, Proposições e Favoritos ocorre
        de forma fluida em no máximo 1 toque.
-   [ ] O layout responde bem tanto no aplicativo mobile (Android/iOS)
        quanto na exportação Web da Vercel.

------------------------------------------------------------------------

**Fim do Guia Mestre --- Voz Pública V4**

*Este documento consolida a evolução visual e funcional do projeto,
servindo como referência para o desenvolvimento contínuo.*