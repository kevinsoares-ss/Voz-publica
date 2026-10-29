# Voz Pública --- Guia Mestre de Desenvolvimento

**Versão:** 1.0\
**Projeto:** Aplicativo mobile de transparência política\
**Público inicial:** Deputados federais do Brasil\
**Plataformas de teste:** Android Emulator e celular com Expo Go\
**Tecnologias planejadas:** React Native, Expo, TypeScript, Node.js,
PostgreSQL e Prisma

> Este documento é o mapa geral do projeto. Ele não substitui a
> validação prática de cada etapa. Só considere uma etapa concluída
> depois de executar os testes e registrar os resultados. Não use dados
> fictícios como se fossem fatos reais.

------------------------------------------------------------------------

## 1. Objetivo do produto

O Voz Pública será um aplicativo que organiza informações públicas sobre
representantes políticos e permite acompanhar propostas, votações,
despesas e compromissos documentados. Cada informação relevante deverá
indicar sua fonte, data e contexto.

### 1.1 Problema que resolve

Informações políticas e legislativas ficam distribuídas em diferentes
portais e formatos. O usuário precisa abrir várias páginas para entender
quem é um representante, o que propôs, como votou e quais evidências
existem sobre determinado compromisso.

### 1.2 Princípios obrigatórios

1.  **Rastreabilidade:** cada informação importada guarda a fonte
    oficial e, quando possível, o identificador original.
2.  **Atualidade explícita:** mostrar a data do fato e a data em que o
    Voz Pública consultou/sincronizou a informação.
3.  **Separação entre fato e interpretação:** uma proposta apresentada
    não significa automaticamente que uma promessa foi cumprida.
4.  **Incerteza honesta:** quando não há evidência suficiente, mostrar
    "Sem informação suficiente" ou "A verificar".
5.  **Neutralidade:** apresentar fatos e fontes de forma consistente,
    sem criar rankings opinativos sem metodologia pública.
6.  **Privacidade:** não pedir dados pessoais desnecessários; favoritos
    podem começar armazenados localmente.
7.  **Integridade:** nunca preencher falhas da API com dados inventados
    apresentados como reais.

------------------------------------------------------------------------

## 2. Escopo funcional

### 2.1 MVP --- primeira versão demonstrável

-   Listar deputados federais.
-   Pesquisar por nome.
-   Filtrar por partido e UF quando os dados da API permitirem.
-   Abrir perfil do deputado.
-   Exibir informações de mandato disponíveis na fonte.
-   Listar proposições relacionadas ao deputado, com paginação.
-   Abrir detalhes de uma proposição.
-   Exibir tramitações e votações quando disponíveis.
-   Consultar despesas públicas com filtros de período.
-   Mostrar origem, data de consulta e link para a fonte oficial.
-   Favoritar representantes.
-   Exibir compromissos documentados e suas evidências.
-   Mostrar histórico de alterações de status de um compromisso.
-   Tratar estados de carregamento, erro, ausência de resultados e
    ausência de informação.
-   Abrir o link oficial da fonte no navegador.

### 2.2 Fora do MVP inicial

-   Cobertura completa de governadores e prefeitos.
-   Integração com todos os sistemas legislativos estaduais e
    municipais.
-   Rede social, comentários e mensagens entre usuários.
-   Classificação automática de promessas por IA.
-   Alertas push complexos.
-   Sistema público de edição colaborativa sem moderação.
-   Ranking geral de políticos sem metodologia validada.

Esses recursos podem ser avaliados depois que o núcleo do produto
estiver confiável.

------------------------------------------------------------------------

## 3. Aplicações e ferramentas necessárias

Instale uma ferramenta por vez, usando os sites oficiais.

### 3.1 Ferramentas principais

1.  **Node.js LTS:** executa JavaScript/TypeScript no computador e
    ferramentas do projeto. Instale a versão LTS indicada no site
    oficial.
2.  **Visual Studio Code:** editor de código.
3.  **Git:** controle de versão e histórico das mudanças.
4.  **GitHub:** hospedagem do repositório e colaboração.
5.  **Expo Go:** aplicativo no celular para executar o projeto Expo
    durante o desenvolvimento.
6.  **Android Studio:** fornece o emulador Android e ferramentas do SDK.
7.  **PostgreSQL:** banco de dados relacional.
8.  **Prisma:** ORM para modelar e acessar o PostgreSQL pelo backend.
9.  **Cliente HTTP opcional (Postman ou Bruno):** facilita testar a API
    própria. Também é possível usar PowerShell.
10. **Navegador atualizado:** para consultar a documentação oficial e
    testar endpoints GET.

Links oficiais: - Node.js: https://nodejs.org/ - VS Code:
https://code.visualstudio.com/ - Git: https://git-scm.com/ - GitHub:
https://github.com/ - Expo: https://expo.dev/ - Expo Go:
https://expo.dev/go - Android Studio:
https://developer.android.com/studio - PostgreSQL:
https://www.postgresql.org/ - Prisma: https://www.prisma.io/ - API da
Câmara: https://dadosabertos.camara.leg.br/swagger/api.html

**Importante:** não instale tudo às cegas. Primeiro confira o que já
existe no Windows. Evite instalar versões duplicadas de Node.js ou
configurar variáveis de ambiente sem necessidade.

### 3.2 Verificar o ambiente no Windows

Abra o PowerShell e execute:

``` powershell
node -v
npm -v
git --version
```

Se algum comando não for reconhecido, registre a mensagem de erro e
corrija essa ferramenta antes de continuar. Não prossiga fingindo que a
instalação funcionou.

Para verificar o Android Debug Bridge, depois de instalar o Android
Studio e configurar o SDK:

``` powershell
adb --version
adb devices
```

O emulador precisa aparecer como dispositivo ativo quando estiver
aberto. No celular, instale Expo Go e conecte o computador e o telefone
à mesma rede Wi-Fi quando usar o modo LAN. Se a rede bloquear a conexão,
o modo tunnel pode ajudar, mas costuma ser mais lento.

------------------------------------------------------------------------

## 4. Organização das etapas

  -----------------------------------------------------------------------
  Etapa                   Entrega                 Critério para concluir
  ----------------------- ----------------------- -----------------------
  0                       Preparação do ambiente  Node, Git, VS Code e
                                                  ferramentas necessárias
                                                  verificadas

  1                       Requisitos e            Escopo, regras, telas e
                          arquitetura             entidades documentados

  2                       Validação da API        Endpoints testados e
                          oficial                 respostas/limitações
                                                  registradas

  3                       UX/UI                   Fluxos, wireframes,
                                                  componentes e
                                                  identidade visual
                                                  definidos

  4                       Repositório e estrutura App e backend iniciam
                                                  com organização limpa

  5                       Banco de dados          Modelo, migrations e
                                                  consultas testados

  6                       Backend básico          API própria, validação,
                                                  erros e documentação
                                                  funcionando

  7                       Integração com a Câmara Adaptadores, paginação,
                                                  limites e tratamento de
                                                  falhas testados

  8                       Aplicativo mobile       Navegação, telas e
                                                  estados de interface
                                                  implementados

  9                       Funcionalidades         Perfil, proposições,
                          legislativas            tramitações, votações e
                                                  despesas

  10                      Compromissos e          Fontes, evidências,
                          evidências              regras e histórico
                                                  funcionando

  11                      Favoritos e filtros     Persistência, pesquisa
                                                  e filtros testados

  12                      Qualidade e segurança   Testes, acessibilidade,
                                                  privacidade e revisão
                                                  concluídos

  13                      Publicação de           Backend hospedado,
                          demonstração            variáveis configuradas
                                                  e versão de
                                                  demonstração

  14                      Apresentação acadêmica  Roteiro, dados de
                                                  demonstração e
                                                  limitações documentadas
  -----------------------------------------------------------------------

**Regra de trabalho:** ao terminar cada etapa, atualizar seu arquivo
Markdown, anotar o que foi testado, os erros encontrados e a decisão
tomada.

------------------------------------------------------------------------

## 5. Estrutura de repositório recomendada

Para facilitar o desenvolvimento, use um único repositório com pastas
separadas para mobile, backend e documentação:

``` text
voz-publica/
├── apps/
│   ├── mobile/
│   │   ├── app/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── theme/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── assets/
│   └── api/
│       ├── src/
│       │   ├── config/
│       │   ├── modules/
│       │   ├── integrations/
│       │   ├── middlewares/
│       │   ├── lib/
│       │   └── server.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── tests/
├── docs/
│   ├── 00-VISAO-GERAL.md
│   ├── 01-REQUISITOS-ARQUITETURA.md
│   ├── 02-VALIDACAO-API.md
│   ├── 03-UX-UI.md
│   ├── 04-AMBIENTE-ESTRUTURA.md
│   ├── 05-BANCO-DADOS.md
│   ├── 06-BACKEND.md
│   ├── 07-INTEGRACAO-CAMARA.md
│   ├── 08-APLICATIVO-MOBILE.md
│   ├── 09-COMPROMISSOS-EVIDENCIAS.md
│   ├── 10-TESTES-SEGURANCA.md
│   ├── 11-PUBLICACAO.md
│   └── DECISOES-TECNICAS.md
├── .gitignore
├── README.md
└── package.json (se adotarmos workspace)
```

A estrutura acima é o destino pretendido, não uma instrução para criar
todas as pastas vazias de uma vez. Crie cada parte quando chegar à etapa
correspondente. Isso evita confusão e dependências desnecessárias.

------------------------------------------------------------------------

## 6. Telas do aplicativo

### 6.1 Navegação principal

A primeira versão pode usar navegação inferior com quatro áreas:

1.  **Início:** resumo e atalhos.
2.  **Deputados:** lista, busca e filtros.
3.  **Compromissos:** compromissos documentados e estados de
    verificação.
4.  **Favoritos:** representantes salvos localmente.

A tela de perfil abre a partir da lista ou de um favorito. Detalhes de
proposição, votação e despesa podem ser telas empilhadas dentro da
navegação.

### 6.2 Lista de deputados

Elementos: - campo de pesquisa; - filtro de partido; - filtro de UF; -
lista paginada; - foto, nome, partido e UF quando disponíveis; -
indicador de carregamento; - mensagem de erro com botão de tentar
novamente; - estado vazio quando a pesquisa não encontrar resultados; -
informação de quando os dados foram consultados.

Não carregue todos os registros sem limite. Use paginação e carregamento
progressivo.

### 6.3 Perfil do deputado

Seções: - identificação e partido; - UF e mandato, se fornecidos; -
proposições; - votações; - despesas; - compromissos documentados; -
fontes e data de atualização.

Não mostre campos que a fonte não fornece como se fossem conhecidos.
Para campos ausentes, use uma mensagem consistente como "Não informado
pela fonte consultada".

### 6.4 Detalhe de proposição

Exibir: - identificador oficial; - tipo e número/ano; - ementa ou resumo
oficial; - autor quando disponível; - situação atual, se fornecida; -
tramitações em ordem temporal; - votações relacionadas; - link
oficial; - data da última consulta.

### 6.5 Despesas

Exibir: - período; - tipo de despesa; - fornecedor quando disponível na
fonte; - valores retornados pela API; - filtros de ano/mês/tipo quando
compatíveis; - link e data da consulta.

Preservar o significado original dos valores e campos. Não somar ou
comparar valores sem definir claramente a regra e o período.

### 6.6 Compromissos

Cada registro precisa conter: - texto claro do compromisso; - quem o
registrou e em qual contexto; - fonte original e data; - critérios para
considerar evidência relevante; - evidências vinculadas; - status
atual; - histórico de status; - justificativa factual; - indicação
explícita quando as evidências forem insuficientes.

Status iniciais sugeridos: - `A_VERIFICAR` - `EM_ANDAMENTO` -
`CUMPRIDO` - `PARCIALMENTE_CUMPRIDO` - `NAO_CUMPRIDO` -
`SEM_INFORMACAO_SUFICIENTE`

Os status não devem ser atribuídos automaticamente apenas por palavras
encontradas em uma notícia. A metodologia deve ser documentada e
revisável.

------------------------------------------------------------------------

## 7. API oficial da Câmara dos Deputados

Documentação: https://dadosabertos.camara.leg.br/swagger/api.html\
Base de API v2: `https://dadosabertos.camara.leg.br/api/v2`

Endpoints prioritários para investigar: - `GET /deputados` -
`GET /deputados/{id}` - `GET /deputados/{id}/despesas` -
`GET /proposicoes` - `GET /proposicoes/{id}` -
`GET /proposicoes/{id}/tramitacoes` - `GET /proposicoes/{id}/votacoes` -
`GET /votacoes/{id}/votos`

Exemplo para listar dez deputados:

``` text
https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=10
```

### 7.1 Validação passo a passo

1.  Abra a documentação oficial e localize os endpoints acima.
2.  Abra o endpoint de lista no navegador.
3.  Verifique se a resposta contém `dados` e metadados/links quando
    aplicáveis.
4.  Observe quais campos realmente aparecem na resposta.
5.  Escolha um `id` retornado pela própria lista; não invente um
    identificador.
6.  Teste o endpoint de detalhes com esse ID.
7.  Teste despesas para o mesmo ID.
8.  Registre campos, status HTTP, paginação, tempo aproximado e erros.
9.  Repita a validação em PowerShell usando o script de teste fornecido.
10. Só então implemente o adaptador de integração no backend.

A API pode mudar, estar temporariamente indisponível ou retornar dados
diferentes conforme os parâmetros. A documentação e a resposta real
precisam ser conferidas durante o desenvolvimento.

### 7.2 O que registrar na validação

Para cada endpoint, registrar: - URL e método; - parâmetros usados; -
data/hora do teste; - status HTTP; - formato da resposta; - campos
úteis; - paginação e links de próxima página; - possíveis limites ou
erros; - exemplo de dado com o ID oficial, sem publicar dados pessoais
desnecessários; - decisão de como o backend vai normalizar os dados.

### 7.3 Responsabilidade do backend

O aplicativo mobile não deve depender diretamente do formato bruto da
API externa. O backend deve: - chamar a API oficial; - validar e
normalizar a resposta; - lidar com timeouts e falhas; - respeitar
paginação e limites; - manter a origem dos dados; - devolver ao mobile
um formato estável e documentado.

------------------------------------------------------------------------

## 8. Modelo inicial de dados

O modelo final depende da validação real da API e dos requisitos. As
entidades conceituais iniciais são:

### 8.1 `Representative` (representante)

-   `id`: identificador interno;
-   `externalId`: ID oficial da Câmara;
-   `name`;
-   `party`;
-   `state`;
-   `photoUrl` opcional;
-   `sourceUrl`;
-   `lastSyncedAt`;
-   `createdAt`;
-   `updatedAt`.

Criar uma restrição única para `externalId` dentro do contexto da fonte,
para evitar duplicação.

### 8.2 `Mandate` (mandato)

-   `id`;
-   `representativeId`;
-   início e fim, se disponíveis;
-   situação;
-   fonte;
-   timestamps.

Um representante pode ter mais de um mandato ao longo do tempo. Não
sobrescreva o histórico antigo com a informação atual.

### 8.3 `Proposal` (proposição)

-   `id`;
-   `externalId`;
-   tipo;
-   número;
-   ano;
-   ementa;
-   status/situação, se fornecido;
-   URL oficial;
-   datas disponíveis;
-   data de sincronização.

### 8.4 Relações entre representantes e proposições

Uma proposição pode estar relacionada a vários representantes, por
exemplo, autores ou coautores. Portanto, não presuma uma relação simples
de um representante para uma única proposição. Use uma tabela de relação
com o papel, se os dados confirmarem essa necessidade.

### 8.5 `Expense` (despesa)

-   `id`;
-   identificador externo, quando disponível;
-   `representativeId`;
-   ano/mês;
-   categoria;
-   fornecedor, quando fornecido;
-   valores com precisão decimal adequada;
-   URL/fonte;
-   data de sincronização.

Evite armazenar dinheiro como ponto flutuante binário. Defina uma
estratégia decimal compatível com o PostgreSQL e o Prisma.

### 8.6 `Source` (fonte)

-   `id`;
-   tipo de fonte;
-   nome;
-   URL;
-   data de publicação, se conhecida;
-   data de consulta;
-   metadados necessários para rastreabilidade.

### 8.7 `Commitment` (compromisso)

-   `id`;
-   título e descrição;
-   representante relacionado, se aplicável;
-   origem do compromisso;
-   data do registro;
-   status atual;
-   método de avaliação;
-   responsável pela revisão;
-   timestamps.

### 8.8 `Evidence` (evidência)

-   `id`;
-   `commitmentId`;
-   tipo de evidência;
-   descrição;
-   URL;
-   fonte;
-   data do fato, se conhecida;
-   data de consulta;
-   avaliação/observação;
-   responsável pela revisão.

Um compromisso pode ter várias evidências. Não apague evidências
anteriores quando chegar uma nova; preserve o histórico quando
necessário.

### 8.9 `CommitmentHistory` (histórico)

-   `id`;
-   `commitmentId`;
-   status anterior;
-   novo status;
-   justificativa;
-   data da mudança;
-   autor/revisor;
-   evidências consideradas.

### 8.10 `Favorite` (favorito)

Para o MVP, favoritos podem ficar no armazenamento local do aparelho,
sem exigir conta de usuário. Se futuramente houver sincronização entre
dispositivos, será necessário projetar identidade, autenticação,
privacidade e política de retenção.

------------------------------------------------------------------------

## 9. Backend: módulos e endpoints próprios

Sugestão de módulos: - `representatives` - `mandates` - `proposals` -
`votes` - `expenses` - `commitments` - `evidence` - `sources` -
`favorites` (somente se passar a exigir sincronização) -
`integrations/camara`

Exemplos de rotas próprias planejadas: - `GET /api/health` -
`GET /api/representatives` - `GET /api/representatives/:id` -
`GET /api/representatives/:id/proposals` -
`GET /api/representatives/:id/expenses` - `GET /api/proposals/:id` -
`GET /api/proposals/:id/progress` - `GET /api/proposals/:id/votes` -
`GET /api/commitments` - `GET /api/commitments/:id` -
`GET /api/commitments/:id/evidence`

Essas são propostas de contrato, não rotas já implementadas. Defina e
documente o formato de resposta, filtros, paginação e erros antes de
conectar as telas.

### 9.1 Regras técnicas do backend

-   Validar parâmetros de rota, query e body com um esquema, por exemplo
    Zod.
-   Usar códigos HTTP adequados.
-   Não retornar stack traces ou segredos ao cliente.
-   Definir timeout para chamadas externas.
-   Tratar status de erro da API externa.
-   Implementar logs sem tokens ou dados sensíveis.
-   Separar rotas, serviços, repositórios e integrações.
-   Criar uma resposta de erro consistente.
-   Documentar as rotas, idealmente com OpenAPI/Swagger.
-   Não adicionar autenticação desnecessária no MVP se não houver
    recursos privados; reavaliar antes de publicar endpoints de escrita.

------------------------------------------------------------------------

## 10. Mobile: organização e padrões

### 10.1 Organização de código

-   `app/`: rotas e layouts do Expo Router;
-   `src/components/`: componentes reutilizáveis;
-   `src/features/`: funcionalidades agrupadas por domínio;
-   `src/services/`: cliente HTTP e comunicação com a API;
-   `src/hooks/`: hooks compartilhados;
-   `src/theme/`: cores, tipografia, espaçamentos e tema;
-   `src/types/`: tipos TypeScript;
-   `src/utils/`: formatação e funções puras.

### 10.2 Padrões

-   TypeScript para os dados e as propriedades dos componentes.
-   Componentes pequenos com responsabilidade clara.
-   Reutilização de cartões, botões, estados de carregamento e mensagens
    de erro.
-   Formatação monetária com
    `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`,
    conferindo antes se o valor recebido é válido.
-   Formatação de datas respeitando fuso e formato da fonte.
-   Nunca usar uma URL de produção fixa em todos os ambientes; usar
    configuração de ambiente.
-   Não colocar segredos no aplicativo mobile: o código do app pode ser
    inspecionado.

### 10.3 Estados obrigatórios em cada tela que consulta dados

1.  Carregando.
2.  Sucesso com resultados.
3.  Sucesso sem resultados.
4.  Erro de conexão.
5.  Erro de servidor/fonte externa.
6.  Atualização/recarregamento.
7.  Conteúdo parcialmente indisponível.

------------------------------------------------------------------------

## 11. Segurança, privacidade e integridade

-   Não armazenar senhas em texto puro.
-   Não inserir chaves secretas no repositório ou no aplicativo mobile.
-   Usar variáveis de ambiente no backend e proteger os arquivos `.env`.
-   Criar `.env.example` somente com nomes de variáveis e valores
    ilustrativos não secretos.
-   Usar HTTPS na publicação.
-   Validar entradas e limitar tamanhos de consulta.
-   Definir limites de requisição para evitar abuso.
-   Evitar guardar dados pessoais de usuários sem necessidade.
-   Definir política de privacidade antes de distribuir publicamente.
-   Documentar de onde vieram os dados e quando foram consultados.
-   Registrar alterações de status de compromissos.
-   Diferenciar dado oficial, interpretação editorial e conteúdo
    cadastrado manualmente.
-   Revisar os termos e condições das fontes usadas e as regras de
    atribuição.

------------------------------------------------------------------------

## 12. Testes necessários

### 12.1 Testes de unidade

Testar funções isoladas: - conversão de dados da API; - validação de
parâmetros; - cálculo de paginação; - formatação de moeda/data; -
transições válidas de status de compromisso; - regras para vincular
evidências.

### 12.2 Testes de integração

Testar: - API própria com banco de teste; - rotas e códigos HTTP; -
criação e leitura de compromissos; - preservação do histórico; -
integração externa com respostas de sucesso e erro; - timeout e ausência
de resultados.

### 12.3 Testes mobile

-   primeira abertura;
-   navegação entre telas;
-   busca;
-   filtros;
-   conexão lenta;
-   ausência de internet;
-   API indisponível;
-   rotação/tamanhos de tela quando relevante;
-   leitura de links oficiais;
-   persistência de favoritos;
-   acessibilidade de botões e textos.

### 12.4 Critério de aceite

Cada funcionalidade precisa ter: - requisito correspondente; -
implementação; - teste reproduzível; - resultado registrado; - limitação
conhecida documentada.

------------------------------------------------------------------------

## 13. Publicação e demonstração

Antes de publicar: 1. Confirmar que a API funciona fora do computador
local. 2. Configurar PostgreSQL de produção e usuário com permissões
mínimas. 3. Definir variáveis de ambiente no provedor de hospedagem. 4.
Executar migrations de forma controlada. 5. Configurar CORS para as
origens realmente necessárias. 6. Ativar HTTPS. 7. Verificar logs,
backups e procedimento de recuperação. 8. Testar a URL pública da API.
9. Configurar a URL do backend no mobile. 10. Testar a versão final no
celular e no emulador. 11. Remover dados demonstrativos ou
identificá-los claramente. 12. Preparar roteiro de apresentação e
limitações conhecidas.

Para a apresentação acadêmica, preparar: - problema e objetivo; -
arquitetura; - tecnologias e justificativas; - demonstração das telas; -
origem oficial dos dados; - modelo de dados; - regras de
compromisso/evidência; - testes realizados; - limitações e melhorias
futuras.

------------------------------------------------------------------------

## 14. Documentação Markdown por etapa

Manter um arquivo por etapa, além do README principal. Cada documento
deve ter:

-   objetivo;
-   pré-requisitos;
-   passos numerados;
-   comandos exatos;
-   resultado esperado;
-   como conferir se funcionou;
-   erros comuns e soluções;
-   checklist de conclusão;
-   decisões tomadas;
-   evidências de teste e data;
-   próximos passos.

O README da raiz deve explicar como iniciar o mobile, como iniciar o
backend, como configurar o banco, como rodar testes e onde encontrar a
documentação.

------------------------------------------------------------------------

## 15. Ordem prática imediata

Não comece pela implementação de todas as telas ao mesmo tempo. A ordem
segura é:

1.  Conferir o ambiente instalado no Windows.
2.  Finalizar a validação da API oficial com o script de teste.
3.  Registrar os campos e as limitações reais da API no
    `docs/02-VALIDACAO-API.md`.
4.  Definir os wireframes e os fluxos das telas.
5.  Criar o repositório Git.
6.  Criar o app Expo e confirmar que abre no Expo Go e no emulador.
7.  Criar o backend mínimo com `GET /api/health`.
8.  Instalar/configurar PostgreSQL e Prisma.
9.  Criar a primeira migration.
10. Implementar um fluxo vertical completo: lista de deputados → perfil
    → dados da API.
11. Depois ampliar para proposições, votações, despesas e compromissos.
12. Testar, documentar e só então publicar.

### Checklist de início

-   [ ] Conferi `node -v`, `npm -v` e `git --version`.
-   [ ] Abri a documentação oficial da Câmara.
-   [ ] Testei a lista de deputados.
-   [ ] Testei detalhes e despesas usando um ID retornado pela lista.
-   [ ] Executei o script PowerShell e guardei a saída.
-   [ ] Atualizei o Markdown da Etapa 2 com os resultados reais.

**Próximo passo:** executar o script de validação da API no seu Windows
e analisar a saída antes de implementar a integração. Isso evita
construir o banco e as telas com base em campos presumidos.
