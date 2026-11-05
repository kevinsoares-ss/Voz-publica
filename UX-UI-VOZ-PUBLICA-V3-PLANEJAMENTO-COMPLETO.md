# Voz Pública V3 --- Planejamento Completo de UX/UI

## Direção visual: Premium institucional

**Tipo de documento:** especificação de UX/UI e layout\
**Projeto:** Voz Pública V3\
**Plataforma:** React Native + Expo + TypeScript\
**Escopo:** aplicativo mobile, com adaptação para Web\
**Status:** proposta visual para validação antes da implementação

------------------------------------------------------------------------

# 1. Objetivo do design

Criar uma experiência mobile de transparência política com aparência de
produto digital profissional: confiável, clara, moderna, acessível e
fácil de navegar.

A interface deve ajudar o cidadão a responder rapidamente:

-   Quem é o representante?
-   Qual cargo ocupa e por qual localidade foi eleito?
-   O que está fazendo?
-   Quais proposições apresentou ou apoiou?
-   Como votou?
-   Quais despesas estão registradas?
-   Quais compromissos e ações estão documentados?
-   De onde veio a informação e quando foi consultada?

O design não deve induzir opinião política, favorecer partidos ou
transformar indicadores incompletos em avaliações definitivas.

## 1.1 Princípios de experiência

1.  **Confiança antes de decoração:** hierarquia clara, fontes visíveis
    e linguagem neutra.
2.  **Informação escaneável:** títulos objetivos, filtros simples, cards
    compactos e números contextualizados.
3.  **Transparência de origem:** fonte e data de atualização acessíveis
    em todos os dados oficiais.
4.  **Estados honestos:** diferenciar zero, ausência de dados,
    indisponibilidade e erro.
5.  **Neutralidade política:** não utilizar cores partidárias como
    identidade de representantes.
6.  **Acessibilidade:** contraste adequado, áreas de toque confortáveis,
    textos legíveis e suporte a ampliação.
7.  **Consistência:** os mesmos padrões de navegação e componentes em
    todas as áreas.
8.  **Mobile first:** priorizar uso com uma mão, telas pequenas e
    conexões móveis.

------------------------------------------------------------------------

# 2. Direção visual premium institucional

## 2.1 Conceito

Uma identidade visual inspirada em plataformas de dados públicos,
jornalismo de qualidade e serviços financeiros digitais. O resultado
deve ser sóbrio e contemporâneo, sem parecer um portal governamental
antigo nem um painel corporativo excessivamente complexo.

## 2.2 Paleta proposta

  -----------------------------------------------------------------------
  Token                   Cor                     Aplicação
  ----------------------- ----------------------- -----------------------
  `navy-950`              `#101C2C`               Cabeçalhos especiais,
                                                  navegação escura e
                                                  fundos de destaque

  `navy-900`              `#17263A`               Texto forte em temas
                                                  escuros

  `blue-700`              `#2457A7`               Cor primária, ações e
                                                  links

  `blue-600`              `#326BC2`               Botões primários e
                                                  elementos ativos

  `blue-100`              `#EAF1FB`               Fundos informativos

  `teal-700`              `#167C78`               Indicadores positivos
                                                  não partidários

  `teal-100`              `#E5F4F1`               Fundos de confirmação

  `gold-600`              `#A87524`               Destaques editoriais e
                                                  atenção moderada

  `gold-100`              `#F8F0DF`               Fundos de aviso não
                                                  crítico

  `gray-950`              `#17202B`               Texto principal

  `gray-700`              `#4B5868`               Texto secundário

  `gray-500`              `#758294`               Metadados

  `gray-300`              `#D8DEE7`               Bordas

  `gray-100`              `#F3F5F8`               Fundo geral

  `white`                 `#FFFFFF`               Cards e superfícies
  -----------------------------------------------------------------------

**Regra:** azul é a cor institucional da interface, não uma associação
partidária. Verde/teal representa estados positivos de interface, não
aprovação política. Dourado é usado com moderação para atenção e
contexto editorial.

## 2.3 Tema escuro

Prever tema escuro com tokens próprios, sem simplesmente inverter as
cores:

-   Fundo principal: `#0D1420`.
-   Superfície/card: `#172233`.
-   Superfície elevada: `#1E2D41`.
-   Texto principal: `#F4F7FB`.
-   Texto secundário: `#AAB7C7`.
-   Borda: `#2B3B50`.
-   Azul de ação: `#79A9F2`.

O tema escuro deve ser validado para contraste e legibilidade de
gráficos.

## 2.4 Tipografia

Sugestão: **Inter** ou **Manrope**. Utilizar uma única família principal
para reduzir ruído visual.

  Estilo                Tamanho sugerido   Peso
  ------------------- ------------------ ------
  Display de resumo            30--34 px    700
  Título de tela               24--28 px    700
  Título de seção              18--20 px    650
  Título de card               15--16 px    600
  Corpo                        14--16 px    400
  Legenda/metadado             12--13 px    400
  Botão                        14--16 px    600

Evitar textos longos em caixa alta. Utilizar números tabulares em
valores financeiros e contadores.

## 2.5 Espaçamento, cantos e elevação

-   Unidade-base: 4 px.
-   Espaçamentos comuns: 8, 12, 16, 20, 24 e 32 px.
-   Margem horizontal mobile: 20 px (adaptável a 16 px em telas
    estreitas).
-   Cards: raio de 16 px.
-   Campos: raio de 12 px.
-   Botões principais: raio de 12 px.
-   Chips: formato arredondado.
-   Bordas leves; sombras discretas somente quando ajudarem a separar
    camadas.

## 2.6 Iconografia

Usar uma biblioteca consistente, como Lucide, com ícones lineares.
Ícones sempre acompanhados por rótulos quando a ação não for
universalmente reconhecida. Não usar emojis como ícones funcionais.

------------------------------------------------------------------------

# 3. Arquitetura de navegação

## 3.1 Navegação principal

Proposta de barra inferior com cinco destinos:

1.  **Início** --- visão geral e atalhos.
2.  **Agentes** --- representantes e filtros.
3.  **Atuação** --- proposições, votações e atividade legislativa.
4.  **Despesas** --- gastos e consultas financeiras.
5.  **Mais** --- compromissos, órgãos, fontes, configurações e ajuda.

A barra inferior deve permanecer visível nas áreas principais e indicar
o destino ativo com ícone, rótulo e realce discreto.

**Decisão de UX:** compromissos não deve ocupar uma aba principal
separada enquanto a navegação tiver cinco destinos. Pode aparecer em
Início e em Mais. Se testes de uso mostrarem que é uma área central e
recorrente, reavaliar a navegação.

## 3.2 Hierarquia de rotas sugerida

``` text
App
├── Onboarding (opcional, primeira utilização)
├── Início
│   ├── Busca global
│   ├── Detalhe de órgão
│   └── Detalhe de despesa
├── Agentes
│   ├── Filtros
│   ├── Perfil do representante
│   │   ├── Visão geral
│   │   ├── Proposições
│   │   ├── Votações
│   │   ├── Despesas
│   │   ├── Compromissos
│   │   └── Ações documentadas
│   └── Favoritos
├── Atuação
│   ├── Proposições
│   ├── Detalhe da proposição
│   ├── Tramitação
│   ├── Votações
│   └── Detalhe do voto
├── Despesas
│   ├── Filtros e período
│   ├── Resultado por órgão
│   └── Detalhe da despesa
└── Mais
    ├── Compromissos
    │   └── Detalhe do compromisso
    ├── Ações documentadas
    │   └── Detalhe da ação/evidência
    ├── Órgãos públicos
    │   └── Detalhe do órgão
    ├── Fontes e metodologia
    ├── Favoritos
    ├── Configurações
    ├── Sobre o Voz Pública
    └── Ajuda e acessibilidade
```

Rotas administrativas editoriais devem ficar separadas do aplicativo
público e não devem ser expostas como ações para qualquer cidadão.

------------------------------------------------------------------------

# 4. Layout detalhado das telas

## 4.1 Abertura e primeiro acesso

### Tela 01 --- Splash screen

**Objetivo:** apresentar a marca enquanto o aplicativo inicializa.

**Layout:** - Fundo navy profundo. - Símbolo/monograma do Voz Pública
centralizado. - Nome "Voz Pública". - Frase curta: "Transparência para
acompanhar. Informação para participar." - Indicador de carregamento
discreto na base.

**Comportamento:** avançar automaticamente para Início ou para uma
apresentação curta, se for a primeira utilização. Não manter splash
artificialmente.

### Tela 02 --- Apresentação / onboarding (opcional)

Três páginas curtas: 1. "Acompanhe seus representantes" --- pesquisa por
cargo, partido e localidade. 2. "Consulte informações oficiais" ---
proposições, votações e despesas com fonte identificada. 3. "Entenda a
origem dos dados" --- proveniência, data de consulta e limitações.

**Layout:** ilustração editorial simples, título, texto curto, indicador
de páginas, botão "Continuar" e ação "Pular". Última página com
"Começar".

Não solicitar cadastro para consultar informações públicas.

------------------------------------------------------------------------

## 4.2 Início

### Tela 03 --- Página inicial / dashboard

**Objetivo:** orientar o cidadão e oferecer acesso rápido às principais
consultas.

**Ordem visual:** 1. Cabeçalho com marca, saudação neutra e botão de
busca. 2. Campo de busca destacado: "Busque um representante, órgão ou
proposição". 3. Card de destaque "Explore os representantes", com CTA
"Ver agentes". 4. Atalhos em grade: Agentes, Atuação, Despesas e
Compromissos. 5. Seção "Acompanhe a atuação" com proposições/votações
recentes, apenas se houver dados reais. 6. Seção "Transparência do
Executivo" com entrada para consulta de órgãos e despesas da CGU. 7.
Bloco "Sobre os dados" com última atualização e link para
fontes/metodologia.

**Cuidados:** não mostrar números agregados sem definir período, fonte e
critério. Não criar rankings de "melhores" ou "piores" representantes.

### Tela 04 --- Busca global

**Layout:** - Campo de busca no topo com botão limpar. - Abas ou filtros
por tipo: Todos, Representantes, Proposições, Órgãos. - Resultados em
listas agrupadas. - Cada resultado informa nome, tipo, cargo/órgão e
contexto. - Estado inicial com exemplos de pesquisa, sem dados
inventados. - Estado vazio com sugestão para alterar termos ou filtros.

**Interação:** debounce, cancelamento de consultas antigas e preservação
do termo ao abrir/voltar de um resultado.

------------------------------------------------------------------------

## 4.3 Agentes

### Tela 05 --- Lista de representantes

**Objetivo:** encontrar representantes públicos.

**Layout:** - Título "Agentes públicos". - Texto de apoio explicando o
escopo disponível. - Busca por nome. - Chips de filtros ativos: cargo,
partido, UF e município. - Botão "Filtros" abre painel/modal. - Contador
de resultados, quando fornecido pela API. - Cards de representante.

**Card do representante:** - Foto oficial, se disponível; caso
contrário, avatar neutro. - Nome completo. - Cargo. - Partido e UF,
quando disponíveis. - Ação de favoritar. - Indicador discreto para abrir
perfil.

Não usar a cor do partido como cor de fundo do card.

### Tela 06 --- Filtros de agentes

**Layout:** tela modal ou bottom sheet com: - Cargo. - Partido. - UF. -
Município, quando aplicável. - Botão "Limpar". - Botão primário "Aplicar
filtros". - Quantidade de filtros ativos.

Os filtros devem refletir apenas campos existentes e válidos na fonte.
Município indisponível não deve ser inferido.

### Tela 07 --- Perfil do representante

**Objetivo:** reunir informações verificáveis em uma página organizada.

**Cabeçalho:** - Foto oficial ou avatar neutro. - Nome completo. - Cargo
e legislatura/mandato, quando disponíveis. - Partido e UF, quando
disponíveis. - Botão favoritar e compartilhar.

**Resumo:** informações essenciais em cards compactos, sem nota ou
pontuação subjetiva.

**Abas internas sugeridas:** - Visão geral. - Proposições. - Votações. -
Despesas. - Compromissos. - Ações.

**Visão geral:** - Dados cadastrais disponíveis. - Resumo de atividade
somente quando houver critério claro. - Atividades recentes com data e
tipo. - Bloco "Fonte dos dados".

**Importante:** não apresentar um indicador de desempenho político sem
metodologia pública, explicável e validada.

### Tela 08 --- Favoritos

**Layout:** - Título "Seus favoritos". - Filtros por cargo, se úteis. -
Lista de representantes salvos localmente. - Ação de remover favorito. -
Estado vazio: explicação curta e botão "Explorar agentes".

Os favoritos permanecem locais conforme o comportamento atual do
projeto.

------------------------------------------------------------------------

## 4.4 Atuação legislativa

### Tela 09 --- Central de atuação

**Layout:** - Título "Atuação". - Campo de busca de proposições. -
Segmentos: Proposições e Votações. - Filtros por casa legislativa, tipo,
período e situação, conforme suporte da API. - Lista de registros com
identificação, ementa/título, data e situação.

Não mostrar filtros que ainda não estejam conectados a uma fonte
validada.

### Tela 10 --- Lista de proposições

**Card:** - Identificador oficial (ex.: tipo e número/ano). - Ementa
resumida. - Autor ou autores, quando disponíveis. - Data de
apresentação. - Situação atual, se fornecida. - Casa legislativa e
fonte.

### Tela 11 --- Detalhe da proposição

**Hierarquia:** 1. Identificador oficial e título/ementa. 2. Situação
atual. 3. Autorias e relatorias, se disponíveis. 4. Datas relevantes. 5.
Resumo descritivo somente se vier de fonte identificada ou for
claramente marcado como resumo editorial. 6. Linha do tempo de
tramitação. 7. Documentos e links oficiais. 8. Bloco de proveniência.

### Tela 12 --- Tramitação

**Layout:** linha do tempo vertical. - Data. - Órgão/comissão. - Evento
ou despacho. - Situação registrada. - Link para documento oficial,
quando existir.

Ordenação cronológica explícita. Se houver lacunas, indicar que a fonte
não retornou todos os eventos.

### Tela 13 --- Lista de votações

**Layout:** - Busca e filtros. - Cards com pauta, data, casa legislativa
e resultado geral, quando disponível. - Indicação clara da origem dos
dados. - Acesso ao detalhe.

### Tela 14 --- Detalhe da votação e voto individual

**Layout:** - Título da matéria/pauta. - Data e órgão. - Resultado
geral, somente se disponível. - Resumo dos votos nominais. - Lista
pesquisável por representante. - Valor do voto conforme nomenclatura
oficial da fonte. - Link para registro oficial e data de consulta.

Não converter abstenção, ausência ou obstrução em "sim" ou "não".

------------------------------------------------------------------------

## 4.5 Despesas e transparência financeira

### Tela 15 --- Central de despesas

**Objetivo:** oferecer consultas financeiras com contexto suficiente
para interpretação.

**Layout:** - Título "Despesas públicas". - Seletor de escopo: Executivo
Federal / despesas parlamentares, conforme integração disponível. -
Campo para pesquisar órgão ou representante. - Filtros de ano e
categoria, quando suportados. - Resumo do período consultado. - Lista de
resultados.

Cada valor deve mostrar moeda, período e fonte. Não misturar despesas de
escopos diferentes em um total único.

### Tela 16 --- Busca de órgãos

**Layout:** - Campo "Buscar órgão". - Resultados do catálogo oficial
SIAFI. - Nome e identificador do órgão. - Botão de seleção. - Informação
sobre a fonte do catálogo.

### Tela 17 --- Detalhe do órgão e despesas anuais

**Layout:** - Nome do órgão e código oficial. - Seletor de ano. - Total
anual, apenas quando calculado a partir de registros completos e
identificados. - Gráfico de evolução mensal, se a API oferecer
granularidade suficiente. - Lista/tabela de despesas ou categorias. -
Metodologia do cálculo e proveniência.

### Tela 18 --- Detalhe de despesa

**Layout:** - Valor em destaque. - Descrição. - Órgão/representante
relacionado. - Data e período. - Categoria e identificadores oficiais. -
Documento ou fonte consultável. - Data de atualização. - Aviso de
contexto, quando os dados não permitirem concluir a finalidade ou
irregularidade do gasto.

Não usar vermelho para sugerir irregularidade sem evidência e critério
oficial.

------------------------------------------------------------------------

## 4.6 Compromissos e ações documentadas

### Tela 19 --- Central de compromissos

**Estado atual:** a tela consulta registros, mas a base ainda não possui
conteúdo editorial cadastrado.

**Layout futuro:** - Título "Compromissos". - Explicação de que os
registros são conteúdo editorial documentado. - Filtros por
representante, cargo, localidade e situação. - Cards com título,
representante relacionado, data de registro e estado editorial. -
Etiqueta "Registro editorial". - Link para metodologia e evidências.

**Estado vazio atual:** "Ainda não há compromissos documentados nesta
base." Incluir explicação sobre o estado da funcionalidade, sem insinuar
que não existem compromissos na realidade.

### Tela 20 --- Detalhe do compromisso

**Layout futuro:** - Título e descrição. - Representante relacionado. -
Contexto e data do registro. - Estado e histórico de alterações. -
Evidências vinculadas. - Fontes e documentos. - Identificação de quem
registrou/revisou, conforme política de transparência e privacidade. -
Aviso claro de que a classificação é editorial e segue metodologia
publicada.

### Tela 21 --- Ações documentadas

**Layout futuro:** - Lista de ações vinculadas a representantes. - Tipo
de ação, data e descrição. - Etiqueta de conteúdo editorial. -
Evidências e fonte. - Filtros por período e representante.

### Tela 22 --- Detalhe da ação/evidência

**Layout:** - Descrição da ação. - Data e representante relacionado. -
Evidências/documentos. - Fonte original e link. - Data de consulta. -
Histórico de revisão, quando aplicável.

------------------------------------------------------------------------

## 4.7 Órgãos, fontes e metodologia

### Tela 23 --- Diretório de órgãos

-   Busca por nome ou código.
-   Lista de órgãos retornados pela fonte.
-   Identificador oficial.
-   Tipo/categoria quando disponível.
-   Acesso ao detalhe.

### Tela 24 --- Fontes e metodologia

**Objetivo:** explicar como o Voz Pública obtém e apresenta os dados.

**Seções:** - Fontes oficiais integradas. - O que cada fonte fornece. -
Data da última consulta. - Frequência de atualização, se definida. -
Limitações conhecidas. - Regras de tratamento de ausência e
inconsistência. - Diferença entre dado oficial, conteúdo editorial e
dado calculado. - Como reportar erro.

Esta tela é central para a credibilidade do produto.

### Tela 25 --- Detalhe da fonte

-   Nome do órgão/fonte.
-   Descrição da integração.
-   Dados cobertos.
-   Link oficial.
-   Última consulta/sincronização conhecida.
-   Limitações e status da integração.

Não declarar uma frequência de atualização que não esteja efetivamente
configurada.

------------------------------------------------------------------------

## 4.8 Configurações e suporte

### Tela 26 --- Menu Mais

Organizar em grupos: - Explorar: Compromissos, Ações documentadas,
Órgãos. - Transparência: Fontes e metodologia. - Aplicativo: Favoritos,
Aparência, Acessibilidade. - Informações: Sobre, Ajuda e contato.

### Tela 27 --- Configurações

-   Tema: claro, escuro ou sistema.
-   Preferências de acessibilidade.
-   Preferências locais e privacidade.
-   Limpar dados locais, com confirmação.
-   Versão do aplicativo.

Não apresentar configurações de conta enquanto não houver conta pública
implementada.

### Tela 28 --- Acessibilidade

-   Ajuste de tamanho de texto, quando suportado.
-   Preferência de movimento reduzido, quando suportada.
-   Orientações de contraste.
-   Descrição de recursos assistivos.

Garantir também suporte a leitores de tela no desenvolvimento, não
apenas uma tela de configuração.

### Tela 29 --- Ajuda e reporte

-   Perguntas frequentes.
-   Como interpretar dados e estados.
-   Como consultar fontes.
-   Como reportar erro ou dado desatualizado.
-   Canal de contato configurado pelo projeto.

### Tela 30 --- Sobre o Voz Pública

-   Missão do projeto.
-   Escopo e limitações.
-   Versão do aplicativo.
-   Fontes institucionais.
-   Política de privacidade e termos, quando publicados.

------------------------------------------------------------------------

# 5. Área administrativa editorial --- separada do app público

A administração editorial deve ser uma área protegida, preferencialmente
Web, com autenticação e autorização validadas no backend. Não confundir
com as telas públicas do aplicativo.

## Tela A01 --- Login administrativo

-   Marca discreta.
-   Campo de e-mail/identificador.
-   Campo de senha.
-   Exibir/ocultar senha.
-   Mensagens de erro genéricas que não revelem se uma conta existe.
-   Recuperação de acesso somente se o fluxo seguro estiver
    implementado.

## Tela A02 --- Dashboard editorial

-   Resumo de registros por estado editorial.
-   Atividades recentes.
-   Atalhos para compromissos e ações.
-   Avisos de revisão pendente.
-   Indicadores com definições claras.

## Tela A03 --- Gestão de compromissos

-   Tabela/lista com busca e filtros.
-   Estado editorial.
-   Representante relacionado.
-   Data de criação e atualização.
-   Ações permitidas conforme permissão: visualizar, editar, revisar,
    arquivar.

## Tela A04 --- Criar/editar compromisso

Campos previstos: - Título. - Descrição. - Representante relacionado. -
Contexto e data. - Situação editorial. - Evidências e documentos. -
Fonte e referência. - Observações internas, se necessárias e
protegidas. - Autor e revisor gerenciados pelo backend.

## Tela A05 --- Gestão de ações

-   Lista de ações documentadas.
-   Busca e filtros.
-   Representante.
-   Data.
-   Estado de revisão.
-   Evidências vinculadas.

## Tela A06 --- Criar/editar ação

-   Descrição da ação.
-   Representante relacionado.
-   Data do evento.
-   Fonte original.
-   Documento/evidência.
-   Observações editoriais.
-   Estado de revisão.

## Tela A07 --- Gestão de usuários e permissões

Somente para perfis autorizados: - Usuários administrativos. -
Papel/perfil. - Permissões. - Estado ativo/inativo. - Data de criação e
último acesso, se coletados. - Ações administrativas auditadas.

## Tela A08 --- Histórico de auditoria

-   Quem executou a ação.
-   O que foi alterado.
-   Quando ocorreu.
-   Registro afetado.
-   Valores anteriores e posteriores, conforme política de retenção.
-   Filtros e exportação controlada, se necessária.

**Segurança:** o layout não substitui controles de backend. Não permitir
que a interface decida sozinha quem pode executar uma operação.

------------------------------------------------------------------------

# 6. Componentes reutilizáveis

Criar uma biblioteca de componentes para manter consistência.

  Componente               Uso
  ------------------------ ---------------------------------
  `AppHeader`              Cabeçalho e título da área
  `BottomTabBar`           Navegação principal
  `SearchBar`              Pesquisa
  `FilterChip`             Filtro ativo
  `FilterSheet`            Seleção de filtros
  `RepresentativeCard`     Card de agente
  `RepresentativeHeader`   Cabeçalho de perfil
  `MetricCard`             Indicador com rótulo e contexto
  `PropositionCard`        Proposição legislativa
  `VoteCard`               Votação
  `ExpenseCard`            Despesa
  `CommitmentCard`         Compromisso editorial
  `ActionCard`             Ação documentada
  `SourceBadge`            Identificação da origem
  `LastUpdated`            Data da consulta
  `EmptyState`             Ausência de registros
  `ErrorState`             Falha de consulta
  `LoadingSkeleton`        Carregamento
  `ConfirmationDialog`     Confirmação de ação
  `SectionHeader`          Título e ação de seção
  `StatusLabel`            Estado claramente definido
  `OfficialLink`           Acesso à fonte oficial

## 6.1 Anatomia de um card

1.  Informação principal em destaque.
2.  Contexto secundário.
3.  Metadados (data, cargo, fonte).
4.  Ação principal claramente identificada.
5.  Estado visual acessível, com texto além da cor.

## 6.2 Botões

-   Primário: ação principal da tela.
-   Secundário: ação complementar.
-   Terciário/textual: ações de menor prioridade.
-   Destrutivo: somente para exclusão ou operação irreversível, com
    confirmação.

Estados obrigatórios: normal, pressionado, desabilitado e carregando.

## 6.3 Campos

Todo campo deve ter rótulo persistente, instrução quando necessária,
validação e mensagem de erro próxima ao campo. Não depender apenas de
placeholder.

------------------------------------------------------------------------

# 7. Estados de interface obrigatórios

Cada tela que consulta dados deve prever:

### Carregando

-   Skeletons com formato semelhante ao conteúdo final.
-   Evitar spinner central como única resposta em telas longas.

### Vazio

-   Explicar que nenhum registro foi retornado para aquela consulta.
-   Sugerir limpar filtros ou mudar termos, quando aplicável.

### Indisponibilidade

-   Explicar que a fonte ou serviço não está disponível no momento.
-   Oferecer tentar novamente.
-   Preservar filtros e contexto da busca.

### Erro

-   Mensagem compreensível e ação possível.
-   Detalhes técnicos somente em logs, nunca em mensagens expostas ao
    usuário.

### Dados parciais

-   Identificar quais informações estão disponíveis e quais não foram
    retornadas.
-   Não apresentar dados parciais como cobertura completa.

### Desatualizado

-   Mostrar a data da última consulta conhecida.
-   Não afirmar que o dado está atualizado se não houver verificação.

### Sem permissão

-   Nas telas administrativas, informar que o usuário não possui
    autorização para aquela operação.
-   Nunca depender apenas de ocultar controles.

------------------------------------------------------------------------

# 8. Acessibilidade e linguagem

-   Alvos de toque preferencialmente com pelo menos 44--48 dp.
-   Contraste de texto conforme WCAG 2.2 AA como referência de
    validação.
-   Não usar apenas cor para comunicar situação.
-   Suportar leitor de tela com rótulos acessíveis.
-   Respeitar escala de fonte do sistema.
-   Garantir foco e ordem de navegação coerentes na Web.
-   Evitar animações excessivas e respeitar redução de movimento.
-   Usar português brasileiro simples, direto e neutro.
-   Explicar termos técnicos como proposição, tramitação, emenda e
    execução orçamentária.

------------------------------------------------------------------------

# 9. Gráficos e visualização de dados

Gráficos só devem aparecer quando a fonte e a granularidade permitirem
interpretação correta.

Regras: - Sempre exibir título, unidade, período e fonte. - Mostrar
valores ao tocar ou selecionar pontos. - Não cortar eixos para exagerar
diferenças. - Não usar gráficos de pizza com muitas categorias. -
Oferecer alternativa textual ou tabular. - Não comparar representantes
sem critérios equivalentes e período comum. - Diferenciar ausência de
dado de valor zero.

Gráficos sugeridos: - Despesas mensais por órgão, se houver dados
mensais. - Distribuição por categoria, se categorias oficiais forem
comparáveis. - Linha do tempo de tramitação. - Contagem de registros por
tipo, com período e fonte.

------------------------------------------------------------------------

# 10. Responsividade

## Mobile

-   Uma coluna como padrão.
-   Navegação inferior nas áreas principais.
-   Filtros em bottom sheet.
-   Cards empilhados.
-   Gráficos com rolagem ou alternativa tabular.

## Tablet

-   Maior largura útil.
-   Possibilidade de duas colunas em dashboards e listagens.
-   Navegação lateral ou barra superior, após validação.

## Web

-   Conteúdo centralizado com largura máxima.
-   Navegação lateral/topo conforme densidade.
-   Tabelas com cabeçalho e rolagem horizontal controlada.
-   Estados de foco visíveis.
-   Rotas diretas e comportamento correto do botão voltar.

------------------------------------------------------------------------

# 11. Organização de implementação visual

Sugestão de organização, a adaptar à estrutura já existente em
`apps/mobile`:

``` text
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── agentes.tsx
│   │   ├── atuacao.tsx
│   │   ├── despesas.tsx
│   │   └── mais.tsx
│   ├── agentes/
│   │   ├── filtros.tsx
│   │   ├── favoritos.tsx
│   │   └── [id]/
│   │       ├── index.tsx
│   │       ├── proposicoes.tsx
│   │       ├── votacoes.tsx
│   │       ├── despesas.tsx
│   │       ├── compromissos.tsx
│   │       └── acoes.tsx
│   ├── proposicoes/
│   │   └── [id].tsx
│   ├── votacoes/
│   │   └── [id].tsx
│   ├── orgaos/
│   │   └── [id].tsx
│   ├── compromissos/
│   │   └── [id].tsx
│   ├── fontes/
│   ├── configuracoes/
│   └── sobre.tsx
├── components/
│   ├── ui/
│   ├── navigation/
│   ├── agents/
│   ├── legislation/
│   ├── expenses/
│   ├── commitments/
│   └── data-provenance/
├── theme/
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── index.ts
└── assets/
```

**Atenção:** estrutura ilustrativa. Antes de criar ou mover arquivos,
inspecionar as rotas e convenções que já existem no projeto. Não
substituir a arquitetura atual apenas para seguir este exemplo.

------------------------------------------------------------------------

# 12. Ordem recomendada para produção dos layouts

1.  Definir e validar identidade visual e tokens.
2.  Desenhar navegação e fluxo principal.
3.  Produzir Início, Agentes e Perfil.
4.  Produzir Atuação, Proposições e Votações.
5.  Produzir Despesas e Órgãos.
6.  Produzir Compromissos e Ações.
7.  Produzir Fontes, Metodologia e Configurações.
8.  Produzir área administrativa editorial.
9.  Validar acessibilidade, estados e responsividade.
10. Testar protótipo com usuários antes de implementar toda a interface.

------------------------------------------------------------------------

# 13. Critérios de aceite do UX/UI

O planejamento visual pode ser considerado pronto para implementação
quando:

-   [ ] Todas as telas do escopo estiverem representadas em wireframes
    ou mockups.
-   [ ] A navegação entre telas estiver definida.
-   [ ] Cada tela tiver objetivo, hierarquia e ações principais.
-   [ ] Componentes reutilizáveis estiverem especificados.
-   [ ] Tema claro e escuro estiverem definidos.
-   [ ] Estados de carregamento, vazio, erro e dados parciais estiverem
    desenhados.
-   [ ] A proveniência estiver visível nos dados oficiais.
-   [ ] O conteúdo editorial estiver claramente identificado.
-   [ ] A interface não apresentar métricas sem metodologia.
-   [ ] Os layouts tiverem sido revisados em diferentes tamanhos de
    tela.
-   [ ] Os requisitos de acessibilidade tiverem sido verificados.

------------------------------------------------------------------------

# 14. Decisões que precisam de validação antes do código

Este documento propõe uma direção visual, não afirma que todos os fluxos
já existem no código. Confirmar:

1.  Se a barra inferior com cinco áreas é a navegação preferida.
2.  Se a área administrativa será Web separada ou parte de uma
    experiência administrativa própria.
3.  Se o app terá tema escuro já na primeira entrega.
4.  Quais campos e filtros cada endpoint realmente oferece.
5.  Quais telas do escopo atual já existem e quais serão novas.
6.  Quais links oficiais e políticas de privacidade estarão disponíveis.

**Não implementar telas que dependam de endpoints inexistentes sem
primeiro definir o comportamento de estado vazio e a evolução do
backend.**

------------------------------------------------------------------------

## Resultado esperado

O Voz Pública V3 deverá apresentar uma interface premium institucional,
consistente e acessível, que facilite a consulta de representantes,
atividade legislativa e despesas públicas. A confiança será reforçada
pela identificação das fontes, datas de consulta, metodologia e
separação entre dados oficiais e conteúdo editorial.

**Este documento é a especificação de UX/UI para orientar a produção dos
mockups e, após validação, a implementação visual do aplicativo.**
