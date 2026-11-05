# GUIA MESTRE --- VOZ PÚBLICA

## Versão 3 (V3)

**Projeto:** Voz Pública\
**Tipo:** Aplicativo mobile de transparência política\
**Status:** Em desenvolvimento\
**Documento:** Guia Mestre de arquitetura, escopo e evolução\
**Versão:** 3.0\
**Data:** 04/11/2026

------------------------------------------------------------------------

## 1. Visão geral

O **Voz Pública** é uma plataforma de transparência política que permite
ao cidadão consultar informações sobre representantes públicos,
acompanhar sua atuação e acessar dados provenientes de fontes oficiais.

O projeto começou com foco nos deputados federais e evoluiu para uma
arquitetura **multi-cargo**, preparada para integrar diferentes
representantes e fontes públicas.

A V3 dá continuidade à estrutura técnica existente e organiza as
próximas evoluções sem descartar funcionalidades já implementadas.

### 1.1 Objetivos

-   Facilitar o acesso do cidadão a informações políticas e públicas.
-   Reunir dados oficiais de diferentes órgãos em uma experiência
    unificada.
-   Permitir o acompanhamento da atuação parlamentar e de outros
    representantes.
-   Apresentar a origem, o identificador e a data de consulta dos dados.
-   Separar informações oficiais, conteúdo editorial e informações
    calculadas pelo sistema.
-   Promover transparência sem preencher lacunas com dados fictícios.

### 1.2 Princípios do projeto

1.  **Transparência:** toda informação deve ter origem identificável.
2.  **Rastreabilidade:** preservar fonte oficial, identificador original
    e data da consulta.
3.  **Integridade:** não inventar, presumir ou completar dados ausentes.
4.  **Separação de responsabilidades:** distinguir dados oficiais,
    editoriais e calculados.
5.  **Segurança:** proteger operações administrativas e credenciais.
6.  **Evolução incremental:** preservar o que funciona e alterar a
    arquitetura somente com justificativa técnica.
7.  **Documentação:** registrar decisões, implementações, testes e
    limitações por etapa.

------------------------------------------------------------------------

## 2. Escopo funcional

### 2.1 Representantes públicos

O sistema deve permitir consultar representantes públicos de diferentes
cargos. A base atualmente sincronizada contempla:

-   Deputados federais da Câmara dos Deputados.
-   Senadores do Senado Federal.

A expansão para outros cargos depende da identificação, validação e
integração de fontes oficiais adequadas.

### 2.2 Consulta e pesquisa

A tela **Agentes** permite pesquisar e filtrar registros sincronizados
por:

-   Cargo.
-   Partido.
-   Unidade federativa (UF).
-   Município, quando disponível na fonte.

### 2.3 Perfis dos representantes

Os perfis podem apresentar informações oficiais e ações documentadas,
sempre preservando a proveniência dos dados. Informações indisponíveis
devem ser apresentadas como ausentes, sem criação de valores fictícios.

### 2.4 Favoritos

O aplicativo possui favoritos armazenados localmente no dispositivo.

### 2.5 Proposições, tramitações e votações

O projeto contempla pesquisa de proposições, tramitações e votações da
Câmara, incluindo consulta de votos individuais quando os dados
estiverem disponíveis na fonte integrada.

O suporte equivalente para o Senado ainda depende de validação e
implementação das respectivas fontes.

### 2.6 Despesas

O aplicativo contempla consultas de despesas. Na página inicial, a
integração com a Controladoria-Geral da União (CGU) permite:

-   Pesquisar órgãos pelo catálogo oficial SIAFI.
-   Consultar despesas anuais do Executivo Federal.

A chave `CGU_API_KEY` deve permanecer exclusivamente no ambiente do
backend.

### 2.7 Compromissos e ações

A tela **Compromissos** consulta registros disponíveis na API. Os perfis
também consultam ações documentadas.

**Estado conhecido:** a base ainda não possui conteúdo editorial
cadastrado. A API de compromissos e ações está em modo somente leitura
até que autenticação e autorização editoriais sejam implementadas.

O cadastro editorial futuro deverá permitir relacionar compromissos,
ações, representantes e evidências, mantendo clara a distinção entre
conteúdo editorial e dados oficiais.

------------------------------------------------------------------------

## 3. Arquitetura tecnológica atual

A arquitetura descrita neste documento é a referência informada para a
V3. Alterações devem ser registradas em decisões técnicas.

  Camada                 Tecnologia
  ---------------------- ------------------------------------
  Aplicativo mobile      React Native
  Plataforma mobile      Expo
  Linguagem mobile       TypeScript
  Servidor               Node.js
  Linguagem backend      TypeScript
  API                    REST
  Banco de dados ativo   PostgreSQL 18 ou versão compatível
  ORM                    Prisma
  Aplicativo Web         Expo Router / exportação Web
  Hospedagem             Vercel
  Banco em nuvem         Neon, acessado por `DATABASE_URL`

### 3.1 Estrutura do repositório

``` text
voz-publica/
├── apps/
│   ├── mobile/                 # Aplicativo React Native com Expo e TypeScript
│   └── api/                    # API Node.js com TypeScript
├── docs/                       # Documentação e decisões por etapa
├── scripts/                    # Ferramentas locais de validação
├── logs/                        # Evidências JSON de consultas oficiais
├── api/                         # Entrada catch-all da Vercel, conforme configuração
├── package.json                 # Workspaces e scripts da raiz
└── README.md                    # Instruções de instalação e execução
```

A estrutura real do repositório deve prevalecer caso existam diferenças
em relação a este esquema resumido.

### 3.2 Banco de dados

O banco ativo da V3 é **PostgreSQL**.

O projeto preserva artefatos históricos do período em SQLite:

-   `apps/api/prisma/dev.db`
-   `apps/api/prisma/sqlite-migrations/`

Esses arquivos são históricos e não representam o banco ativo da V3. Os
dados oficiais de demonstração podem ser carregados novamente por meio
dos comandos de sincronização documentados no README.

### 3.3 Segurança de configuração

-   Não compartilhar nem versionar arquivos `.env`.
-   Não publicar credenciais ou chaves privadas.
-   Não utilizar a conta administrativa do PostgreSQL pela aplicação.
-   Manter `CGU_API_KEY` somente no backend.
-   Configurar `DATABASE_URL` com credenciais próprias da aplicação.
-   Configurar `SHADOW_DATABASE_URL` para um banco de desenvolvimento
    separado quando gerar migrations localmente.
-   Não inserir segredos no aplicativo mobile, no repositório ou em
    `vercel.json`.

------------------------------------------------------------------------

## 4. Fontes oficiais e proveniência

### 4.1 Fontes atualmente integradas ou contempladas

  -----------------------------------------------------------------------
  Fonte                               Uso conhecido
  ----------------------------------- -----------------------------------
  Câmara dos Deputados                Deputados, proposições, tramitações
                                      e votações

  Senado Federal                      Sincronização de senadores; demais
                                      integrações em evolução

  CGU / catálogo SIAFI                Consulta de órgãos e despesas
                                      anuais do Executivo Federal
  -----------------------------------------------------------------------

### 4.2 Regras obrigatórias de proveniência

Sempre que possível, cada dado exibido deve manter:

-   Fonte oficial de origem.
-   Identificador original fornecido pela fonte.
-   Data e hora da consulta ou sincronização.
-   Contexto necessário para interpretar o dado.
-   Estado de disponibilidade ou eventual falha da consulta.

Não se deve:

-   Criar números, despesas, votos ou compromissos fictícios.
-   Tratar ausência de informação como valor zero.
-   Apresentar conteúdo editorial como se fosse declaração oficial.
-   Ocultar limitações conhecidas da integração.

### 4.3 Sincronização

A sincronização deve ser idempotente sempre que tecnicamente possível,
evitando duplicidade quando o mesmo registro for importado mais de uma
vez.

A evolução do mecanismo deverá contemplar:

-   Registro de execução e resultado.
-   Data da última sincronização bem-sucedida.
-   Tratamento de erros e indisponibilidade das fontes.
-   Paginação e limites de segurança.
-   Estratégia de atualização de registros existentes.
-   Observabilidade e possibilidade de reprocessamento controlado.

------------------------------------------------------------------------

## 5. Estado conhecido da implementação

As informações abaixo refletem o estado descrito no README fornecido
para a V3. Devem ser revalidadas no repositório antes de cada release.

### 5.1 Funcionalidades descritas como implementadas

-   Aplicativo Expo com TypeScript.
-   API Node.js com TypeScript.
-   Banco PostgreSQL com Prisma.
-   Sincronização de representantes da Câmara e do Senado.
-   Busca e filtros na tela Agentes.
-   Perfis com proveniência.
-   Favoritos locais.
-   Pesquisa de proposições, tramitações e votações da Câmara.
-   Consultas de despesas e votos individuais, conforme disponibilidade
    das fontes.
-   Fluxos com estados vazios honestos.
-   Tela Compromissos conectada à API em modo de leitura.
-   Consulta da CGU para órgãos e despesas anuais do Executivo Federal.
-   Configuração de publicação conjunta do Web e da API na Vercel.

### 5.2 Quantidade de registros informada

Na sincronização descrita no README:

  Fonte                                 Registros
  ---------------------- ------------------------
  Câmara dos Deputados              513 deputados
  Senado Federal                     81 senadores
  **Total informado**      **594 representantes**

Esses números representam o resultado informado daquela sincronização,
não uma garantia de que a quantidade permanecerá constante.

### 5.3 Limitações conhecidas

-   Não há conteúdo editorial cadastrado na base.
-   Cadastro e edição editorial permanecem bloqueados até a
    implementação de autenticação e autorização.
-   Despesas e votações específicas do Senado ainda dependem de
    validação e integração.
-   A expansão para outros cargos depende da validação das fontes
    oficiais correspondentes.
-   A atualização periódica e a consistência das integrações precisam
    ser validadas e evoluídas.

------------------------------------------------------------------------

## 6. Requisitos de ambiente

### 6.1 Requisitos informados

-   Node.js LTS e npm.
-   PostgreSQL 18 ou versão compatível.
-   Expo Go para testes em dispositivo físico.
-   Android Studio e ADB para emulador Android.
-   Acesso à internet para consultar fontes oficiais.
-   API local acessível pelo celular ou emulador durante o
    desenvolvimento.

### 6.2 Instalação inicial

Executar na raiz do repositório:

``` powershell
npm install

Copy-Item .\apps\api\.env.example .\apps\api\.env
Copy-Item .\apps\mobile\.env.example .\apps\mobile\.env
```

Configurar os arquivos `.env` localmente antes de iniciar os serviços.

### 6.3 Variáveis de ambiente

Na API:

-   `DATABASE_URL`: conexão com o PostgreSQL utilizado pela aplicação.
-   `SHADOW_DATABASE_URL`: banco separado para operações de geração de
    migrations, quando necessário.
-   `CGU_API_KEY`: chave privada da integração CGU.

No aplicativo mobile:

-   `EXPO_PUBLIC_API_URL`: endereço da API acessível pelo ambiente de
    execução.

Exemplos de endereço da API local:

  Ambiente                    URL
  --------------------------- --------------------------------------
  Web no mesmo computador     `http://127.0.0.1:3000`
  Emulador Android padrão     `http://10.0.2.2:3000`
  Expo Go em celular físico   `http://IP-LOCAL-DO-COMPUTADOR:3000`

No celular físico, computador e aparelho devem estar na mesma rede. O
endereço de exemplo `192.168.1.20` deve ser substituído pelo IP local
real do computador.

------------------------------------------------------------------------

## 7. Execução local

### 7.1 Aplicar migrations e iniciar API

Depois de configurar o PostgreSQL e as variáveis:

``` powershell
npm run db:migrate:deploy --workspace @voz-publica/api
npm run dev:api
```

### 7.2 Sincronizar representantes

Em outro terminal:

``` powershell
npm run camara:sync:representatives --workspace @voz-publica/api -- --max-pages=1
npm run senado:sync:representatives --workspace @voz-publica/api
```

Para percorrer todas as páginas retornadas pela Câmara, respeitando o
limite de segurança informado:

``` powershell
npm run camara:sync:representatives --workspace @voz-publica/api -- --max-pages=52
```

### 7.3 Iniciar o aplicativo

Em outro terminal:

``` powershell
npm run dev:mobile
```

Pressionar `w` para abrir a versão Web ou escanear o QR code com o Expo
Go.

### 7.4 Testes e verificações

Na raiz do repositório:

``` powershell
npm run typecheck
npm run db:test --workspace @voz-publica/api
npm run build --workspace @voz-publica/api

Set-Location apps/mobile
npx expo export --platform web
```

### 7.5 Validação da API da Câmara

Na raiz do repositório:

``` powershell
.\scripts\validar-api-camara.ps1
```

Os resultados e evidências devem ser analisados e, quando aplicável,
registrados em `logs/`.

------------------------------------------------------------------------

## 8. Publicação na Vercel

### 8.1 Configuração

-   Criar um projeto Vercel conectado ao repositório.
-   Manter o **Root Directory** na raiz do repositório.
-   Utilizar a função catch-all `api/[...path].ts` para encaminhar
    `/api/*` ao handler `apps/api/api/index.ts`.
-   Compilar a API e exportar o aplicativo Expo Router para Web em
    `apps/mobile/dist`.
-   Publicar `apps/mobile/dist` como diretório Web, conforme a
    configuração do projeto.

### 8.2 Variáveis de ambiente

Configurar no painel da Vercel:

-   `DATABASE_URL`: PostgreSQL acessível pela nuvem.
-   `CGU_API_KEY`: chave privada da CGU.

Essas variáveis devem estar disponíveis nos ambientes em que a API será
executada. O `DATABASE_URL` também precisa estar disponível durante o
build, pois a configuração do Prisma o valida ao gerar o client.

### 8.3 Validação após deploy

Verificar:

``` text
https://<dominio>/
https://<dominio>/api/health
```

A primeira URL deve abrir o aplicativo Web. A segunda deve permitir
validar a API e a conexão com o banco, conforme a implementação do
endpoint de health.

No Web publicado, o aplicativo utiliza por padrão a mesma origem para
chamadas `/api/*`. `EXPO_PUBLIC_API_URL` pode sobrescrever esse endereço
quando necessário.

------------------------------------------------------------------------

## 9. Roadmap de evolução da V3

O roadmap abaixo organiza os pontos de evolução identificados. A ordem é
uma recomendação de planejamento e deve ser confirmada após auditoria do
código, do banco e dos documentos existentes.

### Etapa A --- Autenticação e autorização editorial

**Objetivo:** permitir que usuários autorizados administrem conteúdo
editorial com segurança.

Escopo a especificar:

-   Modelo de usuários administrativos.
-   Autenticação e encerramento de sessão.
-   Hash seguro de senhas, caso autenticação por senha seja adotada.
-   Estratégia de tokens ou sessões.
-   Perfis e permissões.
-   Proteção de rotas e serviços.
-   Validação de autorização no backend.
-   Proteção contra acesso não autorizado.
-   Auditoria de ações administrativas.
-   Testes de autenticação, autorização e segurança.

**Regra essencial:** esconder botões no aplicativo não é suficiente.
Toda permissão deve ser validada no backend.

**Critério de conclusão:** somente usuários autenticados e autorizados
conseguem executar operações editoriais permitidas; usuários sem
permissão recebem respostas apropriadas e não alteram os dados.

### Etapa B --- Conteúdo editorial de compromissos e ações

**Objetivo:** disponibilizar cadastro controlado e rastreável de
compromissos e ações documentadas.

Escopo a especificar:

-   Cadastro, edição e consulta de compromissos.
-   Cadastro, edição e consulta de ações.
-   Associação com representantes.
-   Registro de evidências e documentos.
-   Fonte e referência de cada evidência.
-   Situação e histórico do compromisso.
-   Data de criação e atualização.
-   Autor responsável pelo registro.
-   Revisão, publicação e eventual arquivamento.
-   Histórico de alterações.

**Cuidados editoriais:**

-   Definir critérios objetivos para estados como pendente, em
    andamento, cumprido e não cumprido.
-   Não classificar automaticamente um compromisso como cumprido sem
    evidência suficiente.
-   Identificar claramente conteúdo editorial e informação oficial.
-   Exibir fontes e evidências ao cidadão.
-   Prever correção de informações e registro das alterações.

### Etapa C --- Integração ampliada com o Senado

**Objetivo:** ampliar a cobertura dos dados dos senadores.

Escopo a validar por fonte oficial:

-   Despesas parlamentares.
-   Votações individuais.
-   Proposições legislativas.
-   Tramitações.
-   Histórico de atuação.
-   Identificadores e relacionamentos entre registros.
-   Proveniência e data de atualização.

Cada integração deve passar por validação técnica antes de ser
considerada concluída.

### Etapa D --- Expansão para outros cargos

**Objetivo:** evoluir a plataforma para outros níveis de representação
política.

Cargos candidatos:

-   Governadores.
-   Deputados estaduais.
-   Prefeitos.
-   Vereadores.
-   Outros cargos que tenham fontes oficiais adequadas.

Antes de implementar cada cargo, documentar:

1.  Fonte oficial responsável.
2.  Disponibilidade e condições de acesso à API ou aos dados.
3.  Identificador oficial do representante.
4.  Campos disponíveis e limitações.
5.  Frequência de atualização.
6.  Regras específicas do cargo.
7.  Modelo de integração e testes.

Não presumir que todos os cargos possuem dados padronizados ou uma API
pública equivalente.

### Etapa E --- Confiabilidade, consistência e atualização

**Objetivo:** tornar as integrações observáveis, recuperáveis e
confiáveis.

Escopo:

-   Rotinas de sincronização programadas.
-   Registro de início, fim e resultado de cada execução.
-   Monitoramento de falhas.
-   Retentativas controladas.
-   Proteção contra duplicidade.
-   Estratégia de atualização e desativação de registros.
-   Paginação e limites de consumo.
-   Alertas para falhas relevantes.
-   Indicadores de última atualização.
-   Testes de integridade e reconciliação com fontes.
-   Procedimentos de reprocessamento.

------------------------------------------------------------------------

## 10. Requisitos transversais

### 10.1 Segurança

-   Validar entradas no backend.
-   Aplicar autenticação e autorização nas operações protegidas.
-   Armazenar segredos somente em variáveis de ambiente seguras.
-   Evitar exposição de dados administrativos.
-   Registrar operações sensíveis.
-   Aplicar limites e proteção contra abuso nas rotas públicas, quando
    necessário.

### 10.2 Desempenho

-   Evitar consultas desnecessárias às fontes externas.
-   Utilizar paginação nas listagens.
-   Avaliar cache para dados consultados com frequência.
-   Criar índices conforme padrões reais de consulta.
-   Evitar carregar grandes volumes de dados no aplicativo de uma só
    vez.

### 10.3 Acessibilidade e experiência

-   Interface compreensível para cidadãos com diferentes níveis de
    familiaridade tecnológica.
-   Estados de carregamento, erro, vazio e indisponibilidade.
-   Linguagem clara e neutra.
-   Identificação visível da fonte e da data dos dados.
-   Não confundir ausência de informação com ausência de atividade
    política.

### 10.4 Testabilidade

-   Testes unitários para regras de negócio.
-   Testes de integração para banco e fontes externas.
-   Testes de API para autorização e validação.
-   Testes de interface para fluxos principais.
-   Verificações de tipos, build e exportação Web.

------------------------------------------------------------------------

## 11. Organização da documentação

A documentação deve permanecer em `docs/`, organizada por etapas e
decisões.

Arquivos conhecidos no README:

``` text
docs/
├── 02-VALIDACAO-API.md
├── 03-UX-UI.md
├── 04-AMBIENTE-ESTRUTURA.md
├── 05-BANCO-DADOS.md
├── 06-BACKEND.md
├── 07-INTEGRACAO-CAMARA.md
├── 08-APLICATIVO-MOBILE.md
├── 09-VERSAO-2-MULTI-CARGO.md
└── 10-INTEGRACAO-SENADO.md
```

O nome e o conteúdo dos arquivos devem ser conferidos no repositório. A
numeração seguinte sugerida para a nova documentação é:

``` text
docs/
└── 11-AUTENTICACAO-AUTORIZACAO.md
```

Após essa etapa, criar documentos específicos para conteúdo editorial,
ampliação do Senado, novos cargos e confiabilidade das sincronizações,
respeitando a sequência real de desenvolvimento.

Este Guia Mestre é a referência consolidada da V3. Os documentos
detalhados de cada etapa continuam sendo a fonte para procedimentos,
decisões e especificações específicas.

------------------------------------------------------------------------

## 12. Fluxo recomendado para cada nova etapa

Cada etapa de desenvolvimento deve seguir este ciclo:

1.  **Diagnóstico:** verificar o estado atual do código, banco e
    documentação.
2.  **Planejamento:** definir objetivo, escopo e dependências.
3.  **Requisitos:** registrar requisitos funcionais e não funcionais.
4.  **Regras de negócio:** documentar comportamentos e restrições.
5.  **Modelagem:** atualizar diagramas, entidades e relacionamentos,
    quando necessário.
6.  **Implementação:** desenvolver em partes pequenas e verificáveis.
7.  **Testes:** validar casos esperados, erros e permissões.
8.  **Documentação:** registrar como executar, validar e manter a
    funcionalidade.
9.  **Revisão:** verificar regressões e compatibilidade com o restante
    do sistema.
10. **Conclusão:** registrar o que foi implementado, o que ficou
    pendente e as limitações conhecidas.

Nenhuma etapa deve ser marcada como concluída apenas porque o código foi
escrito. É necessário validar o funcionamento.

------------------------------------------------------------------------

## 13. Decisões que não devem ser alteradas sem justificativa

-   PostgreSQL é o banco ativo da V3.
-   SQLite permanece apenas como legado histórico, conforme descrito.
-   O aplicativo mobile utiliza React Native, Expo e TypeScript.
-   O backend utiliza Node.js e TypeScript.
-   A API é responsável por proteger credenciais e regras sensíveis.
-   A chave da CGU nunca deve ser inserida no aplicativo mobile.
-   Dados oficiais devem preservar fonte, identificador original e data
    de consulta.
-   Dados ausentes não devem ser substituídos por valores fictícios.
-   Conteúdo editorial deve ser identificado separadamente dos dados
    oficiais.
-   A evolução deve preservar funcionalidades existentes sempre que
    possível.

------------------------------------------------------------------------

## 14. Checklist de acompanhamento

Use este checklist para registrar o progresso real. Marque um item
somente depois de validar sua conclusão.

### Base existente

-   [ ] Revisar o README e os documentos atuais.
-   [ ] Confirmar a estrutura real dos workspaces.
-   [ ] Confirmar as migrations e o schema PostgreSQL.
-   [ ] Executar typecheck, testes e build.
-   [ ] Validar sincronização da Câmara.
-   [ ] Validar sincronização do Senado.
-   [ ] Validar integração da CGU.
-   [ ] Validar aplicativo no Expo Go e no emulador.
-   [ ] Validar deploy e endpoint de health.

### Próximas evoluções

-   [ ] Especificar autenticação editorial.
-   [ ] Especificar perfis e permissões.
-   [ ] Implementar autenticação no backend.
-   [ ] Proteger rotas e operações editoriais.
-   [ ] Criar auditoria de alterações.
-   [ ] Implementar cadastro de compromissos.
-   [ ] Implementar cadastro de ações e evidências.
-   [ ] Validar integração de despesas do Senado.
-   [ ] Validar integração de votações do Senado.
-   [ ] Definir fontes para novos cargos.
-   [ ] Implementar sincronização periódica.
-   [ ] Implementar monitoramento e recuperação de falhas.

------------------------------------------------------------------------

## 15. Orientação para continuidade com assistência técnica

Ao continuar o desenvolvimento com um assistente, utilizar este
documento e os arquivos reais do repositório como contexto.

Instruções de trabalho:

-   Não presumir que funcionalidades descritas como planejadas já estão
    implementadas.
-   Antes de modificar código, inspecionar os arquivos e padrões
    existentes.
-   Não substituir arquivos inteiros sem necessidade.
-   Fornecer caminhos exatos dos arquivos que serão criados ou
    alterados.
-   Explicar as alterações em linguagem clara e passo a passo.
-   Quando solicitado código, entregar os arquivos completos necessários
    e indicar onde salvá-los.
-   Incluir comandos PowerShell compatíveis com Windows.
-   Executar ou orientar os testes pertinentes.
-   Atualizar a documentação da etapa.
-   Sinalizar riscos, limitações e decisões que dependam de confirmação.
-   Nunca inventar respostas de APIs, dados políticos, credenciais ou
    resultados de testes.

### Contexto resumido do projeto

O Voz Pública V3 é uma plataforma mobile e Web de transparência
política, construída com React Native, Expo, TypeScript, Node.js,
PostgreSQL e Prisma. O projeto já contempla dados de deputados federais
e senadores, integrações com Câmara, Senado e CGU em diferentes níveis
de maturidade, busca de representantes, perfis, favoritos, consultas
legislativas e despesas. A próxima evolução prioritária é estruturar
autenticação e autorização editorial para então habilitar o cadastro
rastreável de compromissos e ações. Em paralelo, devem avançar as
integrações do Senado, a expansão multi-cargo e a confiabilidade das
sincronizações.

------------------------------------------------------------------------

**Fim do Guia Mestre --- Voz Pública V3**

*Este documento consolida as informações fornecidas sobre o projeto.
Antes de cada implementação ou publicação, conferir o estado real do
repositório, os arquivos de documentação e os resultados dos testes.*
