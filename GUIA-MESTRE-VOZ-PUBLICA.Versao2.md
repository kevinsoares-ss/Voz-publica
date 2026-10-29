# Voz Pública --- Guia Mestre de Desenvolvimento

**Versão:** 2.0 (Expandida --- Multi-Cargo e Plataforma de Transparência Política)  
**Projeto:** Aplicativo mobile de transparência política cidadã  
**Público inicial / Abrangência:** Agentes públicos de todas as esferas e poderes (Presidente, Governadores, Prefeitos, Senadores, Deputados Federais, Deputados Estaduais e Vereadores)  
**Plataformas de teste:** Android Emulator e celular com Expo Go  
**Tecnologias planejadas:** React Native, Expo, TypeScript, Node.js, PostgreSQL e Prisma  

> Este documento é o mapa geral do projeto e também registra o estado atual da implementação. Uma etapa marcada como concluída foi validada no escopo descrito; itens parciais e pendentes não devem ser apresentados como funcionalidades prontas. Não use dados fictícios como se fossem fatos reais.

### Estado da implementação — atualizado em 28/10/2026

O repositório contém uma fatia funcional da V2 para consulta de agentes da
Câmara e do Senado, além de uma consulta limitada do Portal da Transparência
da CGU. O sistema ainda **não cobre todos os cargos e fontes do Brasil** e
não está publicado em produção.

- **Dados sincronizados no PostgreSQL local:** 513 deputados retornados pela
  paginação atual da Câmara (6 páginas) e 81 senadores da lista atual do
  Senado. Total local: 594 registros. Não inclui candidaturas, cargos
  estaduais/municipais nem todo o histórico político.
- **Câmara:** listagem e perfis, proposições, tramitações/votações e consulta
  de despesas oficiais estão disponíveis nos fluxos existentes do app.
- **Senado:** perfil e lista atual de senadores estão integrados; consultas
  de proposições, votações e despesas ainda não.
- **CGU:** pesquisa do catálogo oficial de órgãos SIAFI e consulta de
  despesas anuais por órgão do Executivo Federal estão disponíveis sob
  demanda. Foi validada uma consulta real de 2025 para um órgão retornado
  pelo catálogo. Isso não representa cobertura de todas as despesas,
  contratos, cartões ou viagens, nem gastos pessoais de parlamentares.
- **Compromissos e ações:** modelos, rotas somente de leitura e telas estão
  ligados. Não há registros editoriais reais carregados nem fluxo seguro
  de criação/revisão; o app informa quando a base está vazia.
- **Validação técnica registrada:** 14 testes de API/banco/integrações
  passaram; typecheck dos workspaces, build da API e export Web do Expo
  passaram. O PostgreSQL e o Expo Web locais foram usados para validação.
- **Não concluído:** TSE, recursos legislativos do Senado, fontes estaduais
  e municipais, autenticação editorial, testes em dispositivo físico,
  acessibilidade completa, implantação e monitoramento de produção.

**Segurança da CGU:** `CGU_API_KEY` fica apenas no `apps/api/.env`, ignorado
pelo Git, e é enviado pelo backend no cabeçalho oficial. A chave que foi
compartilhada na conversa deve ser revogada e substituída por uma nova; não
a copie para este guia, para exemplos, URLs, logs ou para o app mobile.

---

## 1. Objetivo do produto

O **Voz Pública** será um aplicativo que organiza e unifica informações públicas sobre todos os representantes políticos e gestores públicos do Brasil (esferas Federal, Estadual e Municipal). Ele permite acompanhar propostas, votações, despesas, histórico de governo, melhorias/entregas, alertas de gestão e compromissos documentados. Cada informação relevante deverá indicar sua fonte oficial, data e contexto.

### 1.1 Problema que resolve

Informações políticas, orçamentárias e legislativas ficam distribuídas em dezenas de portais e formatos diferentes (Câmara, Senado, CGU, Portais estaduais/municipais, Diários Oficiais, TSE e Tribunais de Contas). O usuário precisa abrir várias páginas para entender quem é um representante, o que propôs, como votou, como aplicou os recursos públicos e quais evidências existem sobre determinado compromisso ou gestão.

### 1.2 Princípios obrigatórios

1. **Rastreabilidade:** cada informação importada guarda a fonte oficial e, quando possível, o identificador original.
2. **Atualidade explícita:** mostrar a data do fato e a data em que o Voz Pública consultou/sincronizou a informação.
3. **Separação entre fato e interpretação:** uma proposta apresentada ou um anúncio de obra não significa automaticamente que uma promessa foi cumprida ou um benefício foi consolidado.
4. **Incerteza honesta:** quando não há evidência suficiente, mostrar "Sem informação suficiente" ou "A verificar".
5. **Neutralidade e Isenção:** apresentar fatos, fontes e evidências de forma consistente, sem cores partidárias como identidade principal e sem criar rankings opinativos sem metodologia pública.
6. **Privacidade:** não pedir dados pessoais desnecessários; favoritos podem começar armazenados localmente.
7. **Integridade:** nunca preencher falhas da API com dados inventados apresentados como reais.

---

## 2. Escopo funcional

### 2.1 MVP --- Primeira versão demonstrável

- Listar e pesquisar deputados federais e representantes públicos por nome.
- Seleção e filtro por Estado (UF) e Cidade/Município.
- Destaque de representantes e atalhos rápidos para despesas, votações e compromissos.
- Filtrar por partido, cargo e esfera quando os dados da API permitirem.
- Abrir perfil completo do representante/gestor.
- Exibir informações de mandato e histórico de governo disponíveis na fonte.
- Listar proposições e projetos de lei relacionados, com paginação.
- Abrir detalhes de uma proposição com histórico de tramitação e votações nominais.
- Consultar despesas públicas agrupadas por categoria, com filtros de período (mês/ano), fornecedores e documentos.
- Exibir ações de governo: melhorias/entregas efetuadas e alertas/pontos de atenção identificados por órgãos oficiais.
- Mostrar origem, data de consulta e link direto para a fonte oficial.
- Favoritar e acompanhar representantes localmente.
- Exibir compromissos documentados, prazo, origem da declaração e suas evidências de execução.
- Mostrar histórico de alterações de status de um compromisso.
- Tratar estados de carregamento (*skeleton screens*), erro, ausência de resultados (*empty states*) e ausência de informação.
- Abrir o link oficial da fonte no navegador do dispositivo.

### 2.2 Visão Expandida e Evolutiva (Pós-MVP)

- Cobertura completa de Governadores, Prefeitos, Senadores, Deputados Estaduais e Vereadores.
- Integração profunda com sistemas legislativos estaduais e câmaras municipais.
- Rede social, comentários e mensagens entre usuários.
- Classificação automática e auxílio de triagem de promessas por Inteligência Artificial (ex: IA para análise de Diários Oficiais).
- Alertas push complexos para novas votações ou atualização de processos.
- Sistema público de edição colaborativa com moderação.
- Ranking geral de transparência baseado em metodologia pública e auditável.

---

## 3. Aplicações e ferramentas necessárias

Instale uma ferramenta por vez, usando os sites oficiais.

### 3.1 Ferramentas principais

1. **Node.js LTS:** executa JavaScript/TypeScript no computador e ferramentas do projeto.
2. **Visual Studio Code:** editor de código principal.
3. **Git:** controle de versão e histórico das mudanças.
4. **GitHub:** hospedagem do repositório e colaboração.
5. **Expo Go:** aplicativo no celular para executar o projeto Expo durante o desenvolvimento.
6. **Android Studio:** fornece o emulador Android e ferramentas do SDK.
7. **PostgreSQL:** banco de dados relacional.
8. **Prisma:** ORM para modelar e acessar o PostgreSQL pelo backend.
9. **Cliente HTTP (Postman, Bruno ou Insomnia):** facilita testar a API própria e integrações.
10. **Navegador atualizado:** para consultar a documentação oficial e testar endpoints GET.

**Links oficiais:**
- Node.js: https://nodejs.org/
- VS Code: https://visualstudio.microsoft.com/
- Git: https://git-scm.com/
- GitHub: https://github.com/
- Expo: https://expo.dev/
- Expo Go: https://expo.dev/go
- Android Studio: https://developer.android.com/studio
- PostgreSQL: https://www.postgresql.org/
- Prisma: https://www.prisma.io/
- API da Câmara: https://dadosabertos.camara.leg.br/swagger/api.html
- API do Senado: https://legis.senado.leg.br/dadosabertos/docs/
- Portal da Transparência CGU: https://api.portaldatransparencia.gov.br/
- Dados Abertos TSE: https://dadosabertos.tse.jus.br/

### 3.2 Verificar o ambiente no Windows

Abra o PowerShell e execute:

```powershell
node -v
npm -v
git --version
```

Para verificar o Android Debug Bridge (ADB):

```powershell
adb --version
adb devices
```

---

## 4. Organização das etapas de desenvolvimento

| Etapa | Entrega | Estado em 28/10/2026 | O que falta para concluir |
| :--- | :--- | :--- | :--- |
| **0** | Preparação do ambiente | Parcial | Node/npm, Git, PostgreSQL e Expo foram usados localmente; registrar verificações do Android SDK/ADB e do dispositivo. |
| **1** | Requisitos e arquitetura | Concluída como documentação | Rever a arquitetura quando as integrações estaduais/municipais forem definidas. |
| **2** | Validação das APIs oficiais | Parcial | Câmara, lista do Senado e dois recursos CGU validados; validar recursos legislativos do Senado e arquivos TSE. |
| **3** | UX/UI e Design System | Parcial | Tokens e telas implementados; faltam wireframes completos, verificação de acessibilidade e Dark Mode. |
| **4** | Repositório e estrutura | Concluída para desenvolvimento local | Estrutura real usa `apps/mobile` e `apps/api`; hospedagem/CI ainda pendentes. |
| **5** | Banco de dados polimórfico | Concluída para o schema atual | PostgreSQL, Prisma e migrations testados; modelos de candidatura TSE e recursos de outras fontes ainda podem exigir evolução. |
| **6** | Backend básico integrador | Parcial | Rotas, Zod, erros, PostgreSQL e health check funcionam; Swagger e documentação OpenAPI própria não foram implementados. |
| **7** | Adaptadores de Integração | Parcial | Câmara, lista do Senado e CGU (catálogo SIAFI/despesas anuais por órgão) implementados; TSE e recursos adicionais do Senado/CGU pendentes. Cache persistente e sincronização agendada também pendentes. |
| **8** | Aplicativo mobile base | Parcial | Expo Router, navegação, filtros e estados essenciais funcionam; faltam validação em Android/iOS físico, Dark Mode e refinamento de acessibilidade. |
| **9** | Módulos de Atuação & Gastos | Parcial | Fluxos de proposições/votos/despesas da Câmara e despesas anuais CGU por órgão; faltam normalização/categorização completa, documentos e Senado. |
| **10** | Ações de Governo & Compromissos | Parcial | Consultas somente leitura, proveniência e telas prontas; não há conteúdo editorial cadastrado nem autenticação/revisão para escrita. |
| **11** | Seleção Local, Filtros e Favoritos | Parcial | Filtros de cargo, partido, UF, município e favoritos locais; falta seleção local completa integrada a dados municipais verificados. |
| **12** | Qualidade, Acessibilidade e Segurança | Parcial | 14 testes, typecheck, build e export Web aprovados; faltam revisão de acessibilidade, testes em dispositivos, revisão de produção e rotação da chave CGU compartilhada. |
| **13** | Publicação de demonstração | Pendente | Definir hospedagem, PostgreSQL remoto, segredos, CORS, backups, logs, monitoramento e processo de deploy. |
| **14** | Apresentação acadêmica | Parcial | Fontes e limitações documentadas; falta roteiro final e ambiente de demonstração publicado. |

---

## 5. Estrutura de repositório recomendada

Adotamos uma estrutura limpa e modularizada com suporte a **Expo Router** e arquitetura **Feature-Based**:

```text
voz-publica/
├── mobile/
│   ├── src/
│   │   ├── app/                    # Rotas e layouts do Expo Router
│   │   │   ├── (tabs)/             # Navegação principal por abas
│   │   │   ├── representante/     # Tela de Perfil e abas de detalhamento
│   │   │   └── compromisso/       # Detalhes de compromisso e evidências
│   │   ├── components/             # Componentes reutilizáveis
│   │   │   ├── ui/                 # Botões, inputs, modais, chips, badges
│   │   │   ├── cards/              # Cards de político, gastos, proposição e ação
│   │   │   └── charts/             # Gráficos de evolução orçamentária
│   │   ├── features/               # Módulos organizados por domínio
│   │   │   ├── home/               # Destaques, seletores de cidade/UF, indicadores
│   │   │   ├── representantes/     # Lista, perfil, filtro por cargo/esfera
│   │   │   ├── despesas/           # Gastos categorizados, fornecedores
│   │   │   ├── votacoes/           # Propostas, tramitações e votos
│   │   │   ├── acoes/              # Entregas (melhorias) e Alertas (inconsistências)
│   │   │   ├── compromissos/       # Promessas, evidências e verificações
│   │   │   └── favoritos/          # Persistência de acompanhamento local
│   │   ├── services/               # Cliente HTTP e repositories
│   │   │   ├── api/
│   │   │   └── repositories/
│   │   ├── database/               # Armazenamento local (MMKV / AsyncStore)
│   │   ├── hooks/                  # Hooks personalizados
│   │   ├── navigation/             # Tipagem de navegação
│   │   ├── theme/                  # Design Tokens, cores, tipografia, dark mode
│   │   ├── types/                  # Definições de tipos TypeScript
│   │   └── utils/                  # Formatadores de moeda, datas e validadores
│   └── assets/                     # Imagens, fontes e ícones
├── backend/
│   ├── src/
│   │   ├── modules/                # Módulos do backend Node.js
│   │   │   ├── representatives/    # Rotas e serviços unificados de políticos
│   │   │   ├── expenses/           # Gestão de gastos unificada
│   │   │   ├── proposals/          # Proposições e matérias legislativas
│   │   │   ├── government-actions/ # Entregas/Melhorias e Alertas de gestão
│   │   │   ├── commitments/        # Compromissos e evidências
│   │   │   └── sources/            # Fontes de dados e rastreabilidade
│   │   ├── integrations/           # Adaptadores para APIs externas (Adapter Pattern)
│   │   │   ├── camara/             # API Câmara dos Deputados
│   │   │   ├── senado/             # API Senado Federal
│   │   │   ├── cgu/                # Portal da Transparência (Executivo Federal)
│   │   │   ├── tse/                # Dados Abertos TSE
│   │   │   └── tce/                # Tribunais de Contas (Estaduais/Municipais)
│   │   ├── database/               # Instância do Prisma Client e repositórios
│   │   ├── middlewares/            # Tratamento de erro, logs, rate-limit
│   │   └── shared/                 # Utilitários, esquemas Zod e constantes
│   ├── prisma/
│   │   ├── schema.prisma           # Modelagem relacional polimórfica
│   │   └── migrations/             # Histórico de alterações do banco
│   └── tests/                      # Testes de integração e unidade
├── docs/
│   ├── 00-VISAO-GERAL.md
│   ├── 01-REQUISITOS-ARQUITETURA.md
│   ├── 02-VALIDACAO-API.md
│   ├── 03-UX-UI-DESIGN-SYSTEM.md
│   ├── 04-BANCO-DADOS.md
│   └── DECISOES-TECNICAS.md
├── .gitignore
├── README.md
└── package.json
```

**Estrutura realmente implementada neste repositório:** monorepo npm com
`apps/mobile` (Expo Router) e `apps/api` (Node.js/TypeScript), além de
`docs/`, `scripts/` e migrations Prisma PostgreSQL. O desenho acima é uma
estrutura recomendada de evolução e não deve ser interpretado como uma
descrição literal das pastas existentes.

---

## 6. Identidade Visual e Design System

A interface deve transmitir **confiança, neutralidade, clareza e tecnologia**, evitando o uso de cores associadas a partidos políticos específicos como identidade principal.

### 6.1 Paleta de Cores e Tokens de Design (Marca: Voz Pública)

| Token | Cor (HEX) | Utilização no Aplicativo |
| :--- | :--- | :--- |
| **primary** | `#101C2C` (Navy) | Cabeçalhos, navegação principal e textos de maior peso |
| **secondary** | `#4DD6B0` (Mint) | Ações principais, destaques e confirmações |
| **accent** | `#4285F4` (Blue) | Links, dados informativos e interações secundárias |
| **background**| `#F4F7FA` (Canvas) | Fundo das telas no Modo Claro |
| **surface** | `#FFFFFF` (White) | Cards, formulários e modais |
| **text** | `#172334` | Texto principal de leitura |
| **muted** | `#64748B` | Textos secundários, legendas e datas |
| **border** | `#DCE4EC` | Linhas divisórias, contornos de cards e inputs |

### 6.2 Modos de Exibição & Regras
- **Dark Mode:** Mapeamento equivalente de tokens com fundos escuros profundos (ex: `#0F172A`), mantendo o contraste dentro dos padrões de acessibilidade WCAG.
- **Acessibilidade:** Não depender unicamente da cor para sinalizar aprovação, pendência ou reprovação. Utilizar ícones e rótulos textuais explícitos.
- **Estados Visuais Obrigatórios:**
  1. Carregando (*skeleton screens* animadas).
  2. Sucesso com dados retornados.
  3. Sucesso sem dados (*empty state* amigável).
  4. Erro de conexão ou indisponibilidade do portal oficial.

---

## 7. Detalhamento das Telas do Aplicativo

### 7.1 Tela 1 — Início (Hub de Transparência Cidadã)
- **Seleção Local:** Filtro por Estado (UF) e Cidade para carregar automaticamente gestores e representantes locais.
- **Busca Global:** Campo de pesquisa por nome de qualquer político do país.
- **Destaques:** Cards de representantes acompanhados e figuras de destaque nas três esferas.
- **Indicadores de Atividade Pública:** Resumo visual de verbas utilizadas, projetos tramitando no mês e ações recentes.
- **Atalhos Rápidos:** Botões diretos para Despesas, Votações, Ações de Governo e Compromissos.

### 7.2 Tela 2 — Perfil do Representante / Gestor
- **Cabeçalho:** Foto, nome político, nome civil, cargo atual, partido, UF/Município e indicador de mandato.
- **Ação:** Botão "Acompanhar" (salva nos Favoritos locais).
- **Biografia & Trajetória:** Dados do TSE (bens declarados, histórico de candidaturas e mandatos anteriores).
- **Navegação por Abas:**
  1. **Visão Geral:** Resumo do mandato, indicadores chave e últimas atualizações.
  2. **Atuação:** Projetos de lei, tramitações e votações nominais (Legislativo) OU Ações de Governo (Executivo).
  3. **Despesas:** Cota parlamentar, verbas de gabinete, contratos públicos e cartão corporativo.
  4. **Histórico:** Linha do tempo de mandatos, trocas de partido e processos/acórdãos oficiais.

### 7.3 Tela 3 — Para Onde Vai o Dinheiro? (Despesas & Orçamento)
- **Resumo Financeiro:** Total gasto no período com filtros por mês, ano e categoria de despesa.
- **Gráficos de Evolução:** Gráficos de barras/linhas mostrando a variação dos gastos ao longo do tempo.
- **Detalhamento Factual:** Lista de fornecedores (nome/CNPJ), notas fiscais, recibos e documentos oficiais anexados.
- **Contexto e Isenção:** Valores sempre acompanhados do período de apuração e notas explicativas sobre a cota oficial, sem presumir irregularidade apenas pelo montante exibido.
- **Link Oficial:** Acesso direto à página de prestação de contas do órgão de origem.

### 7.4 Tela 4 — O Que Ele Fez? (Atuação & Projetos)
- **Propostas Apresentadas:** Lista paginada de Projetos de Lei, PECs, Medidas Provisórias ou Decretos.
- **Status em Tempo Real:** Situação atual de cada proposta (Em tramitação, Aprovada, Arquivada, Sancionada).
- **Histórico de Tramitação:** Linha do tempo mostrando por quais comissões a matéria passou.
- **Votações Nominais:** Como o representante votou em matérias de grande relevância (Sim, Não, Abstenção, Ausente).
- **Documentos na Íntegra:** Link para download do texto original da proposta no portal do órgão.

### 7.5 Tela 5 — Compromissos, Resultados e Impacto de Governo
- **Painel de Compromissos:** Promessas de campanha ou declarações públicas documentadas.
- **Origem e Prazos:** Link da fonte do compromisso (plano de governo no TSE, sabatina, discurso registrado) e data do registro.
- **Metodologia de Verificação:**
  - Status: `A_VERIFICAR`, `EM_ANDAMENTO`, `CUMPRIDO`, `PARCIALMENTE_CUMPRIDO`, `NAO_CUMPRIDO`, `SEM_INFORMACAO_SUFICIENTE`.
- **Mapeamento de Impacto (Executivo / Legislativo):**
  - **Melhorias e Entregas (Benefícios):** Obras concluídas, sanções de leis benéficas, repasses comprovados para saúde/educação.
  - **Pontos de Atenção / Inconsistências:** Apontamentos e acórdãos de Tribunais de Contas (TCU/TCE/TCM), obras atrasadas ou rejeição de contas com link direto para a fonte oficial.

---

## 8. Mapeamento de APIs Oficiais e Fontes de Dados

O aplicativo utiliza uma arquitetura baseada em **Adaptadores de Integração**, permitindo consultar múltiplos portais governamentais de forma padronizada:

| Poder / Cargo | Esfera | API / Fonte Oficial | Estado implementado e limite conhecido |
| :--- | :--- | :--- | :--- |
| **Deputados Federais** | Federal (Legislativo) | `dadosabertos.camara.leg.br/api/v2` | Integrado: lista/perfil, proposições, tramitações/votações e consulta oficial de despesas. Foram sincronizados 513 deputados em 6 páginas na consulta registrada; atualizar a sincronização periodicamente. |
| **Senadores** | Federal (Legislativo) | `legis.senado.leg.br/dadosabertos/docs/` | Integrada apenas a lista atual e perfis (81 senadores na consulta registrada). Matérias, votações e despesas ainda pendentes. |
| **Executivo Federal / órgãos** | Federal (Executivo) | Portal da Transparência CGU (`api.portaldatransparencia.gov.br`) | Integrados sob demanda o catálogo SIAFI (`orgaos-siafi`) e despesas anuais por órgão (`despesas/por-orgao`), com seleção de órgão oficial. Não representa despesas pessoais de parlamentares; cartões, viagens, contratos e demais conjuntos ainda pendentes. |
| **Governadores & Dep. Estaduais** | Estadual | Portais estaduais + assembleias | Não integrados. Validar fontes órgão por órgão/estado; não existe um adaptador nacional pronto. |
| **Prefeitos & Vereadores** | Municipal | TCEs, portais municipais e câmaras | Não integrados. Validar cobertura por município e identificar limites das fontes. |
| **Histórico Eleitoral (Todos)** | Todos os Níveis | Dados Abertos TSE (`dadosabertos.tse.jus.br`) | Catálogo de conjuntos foi consultado; arquivos ZIP/CSV ainda não foram processados nem conectados ao app. |

---

## 9. Modelo de Banco de Dados Expandido (Prisma ORM & PostgreSQL)

O schema do banco utiliza enums e relacionamentos polimórficos para suportar qualquer agente público e suas respectivas ações de governo:

> O bloco Prisma abaixo é a proposta conceitual original. O schema executável
> do repositório está em `apps/api/prisma/schema.prisma` e é a referência
> para migrations e runtime. Ele usa `Representative`, IDs externos com
> namespace da fonte, proveniência (`Source`), ações, compromissos, evidências
> e histórico. Mudanças no modelo devem ser feitas no schema executável e
> aplicadas por migrations; não presumir que este exemplo conceitual seja
> idêntico em todos os campos.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Sphere {
  FEDERAL
  STATE
  MUNICIPAL
}

enum PowerBranch {
  EXECUTIVE  // Presidente, Governadores, Prefeitos
  LEGISLATIVE  // Senadores, Deputados, Vereadores
}

enum PoliticianRole {
  PRESIDENT
  GOVERNOR
  MAYOR
  SENATOR
  FEDERAL_DEPUTY
  STATE_DEPUTY
  CITY_COUNCILLOR
}

enum ImpactType {
  POSITIVE_DELIVERY // Obras entregues, leis sancionadas, metas atingidas
  CRITICAL_ALERT    // Contas rejeitadas, investigação oficial, obra paralisada
  NEUTRAL_METRIC    // Indicadores gerais de gestão orçamentária
}

enum CommitmentStatus {
  A_VERIFICAR
  EM_ANDAMENTO
  CUMPRIDO
  PARCIALMENTE_CUMPRIDO
  NAO_CUMPRIDO
  SEM_INFORMACAO_SUFICIENTE
}

model Politician {
  id               String             @id @default(uuid())
  externalIds      Json               // Ex: { camaraId: 123, tseId: 456, senadoId: 789 }
  name             String
  civilName        String?
  role             PoliticianRole
  sphere           Sphere
  powerBranch      PowerBranch
  party            String
  state            String?            // UF (null para Presidente)
  city             String?            // Preenchido para Prefeitos e Vereadores
  photoUrl         String?
  sourceUrl        String
  lastSyncedAt     DateTime           @default(now())
  
  mandates         Mandate[]
  expenses         Expense[]
  proposals        Proposal[]
  governmentActions GovernmentAction[]
  commitments      Commitment[]
  
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}

model Mandate {
  id           String     @id @default(uuid())
  politicianId String
  politician   Politician @relation(fields: [politicianId], references: [id])
  startDate    DateTime
  endDate      DateTime?
  periodTitle  String     // Ex: "Gestão 2021-2024" ou "57ª Legislatura"
  status       String     // Ativo, Licenciado, Encerrado
}

model Proposal {
  id           String     @id @default(uuid())
  externalId   String
  politicianId String
  politician   Politician @relation(fields: [politicianId], references: [id])
  type         String     // PL, PEC, MP, REQ
  number       Int
  year         Int
  summary      String     @db.Text
  status       String
  sourceUrl    String
  presentedAt  DateTime
  updatedAt    DateTime   @updatedAt
}

model Expense {
  id           String     @id @default(uuid())
  politicianId String
  politician   Politician @relation(fields: [politicianId], references: [id])
  amount       Decimal    @db.Decimal(12, 2)
  category     String
  supplierName String?
  supplierCnpj String?
  documentUrl  String?
  expenseDate  DateTime
  sourceName   String     // Ex: "Câmara dos Deputados", "Portal da Transparência CGU"
  createdAt    DateTime   @default(now())
}

model GovernmentAction {
  id           String     @id @default(uuid())
  politicianId String
  politician   Politician @relation(fields: [politicianId], references: [id])
  title        String
  description  String     @db.Text
  type         ImpactType
  category     String     // Saúde, Educação, Infraestrutura, Gestão
  evidenceUrl  String     // Diário Oficial, TCU, TCE
  sourceName   String     // Ex: "Tribunal de Contas da União"
  eventDate    DateTime
  createdAt    DateTime   @default(now())
}

model Commitment {
  id           String           @id @default(uuid())
  politicianId String
  politician   Politician       @relation(fields: [politicianId], references: [id])
  title        String
  description  String           @db.Text
  sourceOrigin String           // Ex: "Plano de Governo TSE 2022"
  sourceUrl    String
  status       CommitmentStatus @default(A_VERIFICAR)
  deadline     DateTime?
  evidences    Evidence[]
  history      CommitmentHistory[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}

model Evidence {
  id           String     @id @default(uuid())
  commitmentId String
  commitment   Commitment @relation(fields: [commitmentId], references: [id])
  description  String     @db.Text
  evidenceUrl  String
  sourceName   String
  factDate     DateTime?
  reviewedBy   String?
  createdAt    DateTime   @default(now())
}

model CommitmentHistory {
  id           String           @id @default(uuid())
  commitmentId String
  commitment   Commitment       @relation(fields: [commitmentId], references: [id])
  previousStatus CommitmentStatus
  newStatus    CommitmentStatus
  justification String          @db.Text
  changedAt    DateTime         @default(now())
}

model Source {
  id           String   @id @default(uuid())
  name         String
  url          String
  fetchedAt    DateTime @default(now())
  metadata     Json?
}
```

---

## 10. Backend Integrador: Módulos e Endpoints

O backend em Node.js segue o padrão **Adapter Pattern** para consultar
fontes oficiais e entregar dados validados ao app. No estado atual, as
consultas oficiais são feitas sob demanda; cache persistente em PostgreSQL
está planejado, mas ainda não implementado.

### 10.1 Endpoints do Backend

- `GET /api/health` — Verificação de integridade da API e banco de dados.
- `GET /api/politicians` — Lista paginada de políticos com filtros (`role`, `sphere`, `state`, `city`, `party`, `search`).
- `GET /api/politicians/:id` — Perfil unificado do político/gestor.
- `GET /api/proposals` e `GET /api/proposals/:id` — Pesquisa e detalhes de proposições da Câmara.
- `GET /api/proposals/:id/progress`, `GET /api/proposals/:id/votes` e `GET /api/votes/:voteId/votes` — Tramitações e votações oficiais da Câmara.
- `GET /api/representatives/:id/expenses?year=...` — Consulta oficial de despesas da Câmara.
- `GET /api/cgu/agencies?search=...&page=...` — Pesquisa de órgãos pelo cadastro SIAFI oficial da CGU.
- `GET /api/cgu/expenses?year=...&page=...&orgao=...` — Despesas anuais agregadas por órgão do Executivo Federal. Exige código de órgão retornado pela fonte.
- `GET /api/politicians/:id/actions` — Consulta de ações documentadas na base editorial; não é uma integração automática de notícias ou obras.
- `GET /api/politicians/:id/commitments` — Compromissos documentados e seu status.
- `GET /api/commitments` — Lista paginada de compromissos.
- `GET /api/commitments/:id/evidences` — Detalhamento de evidências vinculadas a um compromisso.

As rotas de compromissos e ações são somente leitura. Rotas para criar ou
revisar esses dados não devem ser disponibilizadas antes de implementar
autenticação, autorização e trilha de auditoria. As rotas CGU enviam a
chave apenas do servidor ao Portal no cabeçalho `chave-api-dados`; ela
nunca deve chegar ao app mobile, à URL ou aos logs. Para detalhes e
resultados de teste consulte `docs/06-BACKEND.md` e
`docs/09-VERSAO-2-MULTI-CARGO.md`.

### 10.2 Regras Técnicas
- Validação estrita de entrada/saída usando esquemas **Zod**.
- Respostas sanitizadas sem expor segredos de ambiente ou *stack traces*.
- Timeout, validação de payload e paginação limitada nos adaptadores implementados.
- **Cache persistente no PostgreSQL e sincronização agendada ainda não estão implementados.** Adicioná-los com política de expiração e limites claros antes de ampliar o tráfego ou lançar o serviço publicamente.

---

## 11. Segurança, Privacidade e Integridade

- Nenhuma chave secreta ou credencial de API deve ser incluída no repositório público ou no código do aplicativo mobile.
- Utilização estrita de variáveis de ambiente (`.env`) protegidas por `.gitignore`.
- Arquivo `.env.example` mantido atualizado contendo apenas chaves fictícias.
- A chave CGU informada durante o desenvolvimento foi colocada apenas no `apps/api/.env`, que está ignorado pelo Git. Como foi compartilhada na conversa, revogue-a e gere outra; nunca registre o valor deste segredo no guia ou em outros arquivos.
- A conta PostgreSQL da aplicação é separada da conta administrativa; as URLs locais e a credencial da aplicação ficam somente no `.env`.
- Dados pessoais de cidadãos/usuários não são coletados no MVP; os favoritos e preferências ficam salvos no armazenamento local do celular (ex: MMKV / AsyncStorage).
- Toda informação exibida no app deve conter obrigatoriamente um link direto para a fonte oficial governamental.

---

## 12. Ordem Prática de Execução

As etapas de preparação e fundação já foram executadas no ambiente local.
O trabalho restante recomendado, em ordem, é:

1. **Rotacionar a chave CGU** compartilhada na conversa: revogar a atual,
   gerar outra no portal oficial e substituir o valor apenas em
   `apps/api/.env`. Não colar a nova chave no chat ou no repositório.
2. **Concluir TSE:** baixar amostras dos arquivos oficiais de candidaturas,
   validar campos e licenças, criar modelo separado de candidatura e
   importar com proveniência. Não tratar candidatura como mandato ativo.
3. **Concluir Senado:** validar respostas oficiais para matérias,
   tramitação, votação nominal e despesas; então implementar os adaptadores
   e telas equivalentes aos fluxos da Câmara.
4. **Expandir CGU com escopo validado:** escolher recursos específicos
   (por exemplo, viagens ou cartões), verificar filtros/autorização e
   payload real antes de cada integração. A integração existente cobre
   apenas catálogo SIAFI e despesas anuais por órgão.
5. **Definir fontes estaduais/municipais por território:** começar com uma
   unidade federativa e municípios-piloto, documentando cobertura e lacunas
   antes de declarar cobertura ampliada.
6. **Criar fluxo editorial seguro:** autenticação, autorização por papel,
   trilha de auditoria, cadastro/revisão de compromissos, ações e evidências,
   além de testes e políticas para evitar avaliações sem suporte documental.
7. **Melhorar confiabilidade:** cache com expiração, sincronizações
   agendadas, observabilidade, rate limiting, documentação OpenAPI e
   estratégias para falhas das fontes.
8. **Qualidade e distribuição:** revisar acessibilidade e Dark Mode, testar
   Android/iOS em emulador e aparelho físico, configurar CI, hospedagem,
   PostgreSQL remoto, backups, segredos e monitoramento.
9. **Preparar demonstração:** roteiro, dados oficiais atualizados, fontes,
   limitações e passos para reproduzir o ambiente.

### Critérios da validação mais recente

- `npm run db:test --workspace @voz-publica/api`: 14 testes passaram,
  cobrindo banco, API, Câmara, Senado, CGU e registros editoriais.
- `npm run typecheck --workspaces --if-present`: API e mobile passaram.
- `npm run build --workspace @voz-publica/api`: passou.
- `npm exec --workspace @voz-publica/mobile -- expo export --platform web`:
  passou.
- `npm run db:validate --workspace @voz-publica/api`: schema Prisma válido.
- `git diff --check`: passou; `apps/api/.env` foi confirmado como ignorado.
- A CGU foi consultada com sucesso pelo backend local: pesquisa SIAFI do
  Ministério da Saúde e consulta anual de 2025 do órgão retornado pelo
  catálogo. A resposta identificou fonte e horário; a credencial não
  apareceu na URL.

Estes resultados validam o ambiente de desenvolvimento, não constituem
aprovação de produção nem substituem testes físicos e de acessibilidade.