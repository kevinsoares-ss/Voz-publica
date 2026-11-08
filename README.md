# Voz Pública

Aplicativo mobile de transparência política. O projeto começou com
deputados federais e está evoluindo para o escopo multi-cargo do
[Guia Mestre — Versão 2](./GUIA-MESTRE-VOZ-PUBLICA.Versao2.md).
Consulte também a documentação em [`docs/`](./docs/).

## Estrutura

- `apps/mobile`: aplicativo React Native com Expo e TypeScript.
- `apps/api`: servidor Node.js com TypeScript.
- `docs`: decisões e registros do projeto por etapa.
- `scripts`: ferramentas locais de validação.
- `logs`: evidências JSON das consultas à API oficial.

## Requisitos

- Node.js LTS e npm.
- PostgreSQL 18 (ou versão compatível) para a API V2.
- Expo Go para executar no celular; Android Studio/ADB para emulador.
- Acesso à internet para consultar os dados oficiais da Câmara.
- A API local precisa estar acessível pelo aparelho/emulador durante o
  desenvolvimento mobile.

## Instalação e execução local

Na raiz do repositório, instale os workspaces. Prepare os arquivos de
ambiente locais (sem compartilhar nem commitar `.env`):

```powershell
npm install
Copy-Item .\apps\api\.env.example .\apps\api\.env
Copy-Item .\apps\mobile\.env.example .\apps\mobile\.env
```

Antes de migrar/iniciar a API, configure `DATABASE_URL` no
`apps/api/.env` com as credenciais locais do PostgreSQL. O valor no
`.env.example` é apenas um placeholder. Para gerar migrations locais com
`npm run db:migrate`, configure também `SHADOW_DATABASE_URL`, apontando para
um banco de desenvolvimento separado. Não use a conta administrativa do
PostgreSQL na aplicação nem publique as URLs reais.

O arquivo `.env` mobile define `EXPO_PUBLIC_API_URL`. Mantenha
`http://127.0.0.1:3000` para Web no mesmo computador; use
`http://10.0.2.2:3000` para o emulador Android padrão, ou o IP local do
computador (por exemplo `http://192.168.1.20:3000`) para Expo Go no
celular. Computador e celular devem estar na mesma rede. O servidor API
aceita conexões de rede local por padrão para permitir esse teste.

Aplique as migrations PostgreSQL e inicie o backend:

```powershell
npm run db:migrate:deploy --workspace @voz-publica/api
npm run dev:api
```

Em outro terminal, importe uma página limitada de deputados oficiais:

```powershell
npm run camara:sync:representatives --workspace @voz-publica/api -- --max-pages=1
npm run senado:sync:representatives --workspace @voz-publica/api
npm run senado:sync:expenses --workspace @voz-publica/api -- 2025
npm run tse:sync:representatives --workspace @voz-publica/api
```

Para percorrer todas as páginas retornadas pela Câmara (com limite de
segurança de 52 páginas):

```powershell
npm run camara:sync:representatives --workspace @voz-publica/api -- --max-pages=52
```

Inicie o app em outro terminal:

```powershell
npm run dev:mobile
```

Pressione `w` no Expo para Web ou escaneie o QR code no Expo Go. A tela
Agentes permite buscar representantes por nome, cargo, partido, UF e município.
Deputados federais e senadores vêm das APIs oficiais da Câmara e do Senado.
Presidente, governadores, prefeitos, deputados estaduais e vereadores vêm dos
arquivos oficiais de candidaturas/resultados do TSE de 2022 e 2024. Esses dados
identificam quem foi eleito naquele pleito, mas não confirmam substituições
posteriores no mandato; a eleição e a fonte são exibidas no registro. Execute a
sincronização TSE após aplicar as migrations para importar esses cargos. O
app busca as fotos oficiais dos candidatos nos arquivos por UF do TSE usando
requisições HTTP de intervalo, sem baixar o arquivo completo de imagens. Quando
o TSE não publicou uma foto, o cartão mostra a inicial do nome.
O Senado usa a API administrativa oficial para sincronizar a lista atual e
despesas CEAPS por ano. Sincronize a lista antes das despesas; o app persiste
apenas categoria, fornecedor, mês e valor, não CPF/CNPJ ou detalhes pessoais
do arquivo de origem. Despesas CEAPS podem ser consultadas no perfil do senador
após sincronização.

Os demais fluxos incluem perfis com proveniência, favoritos locais, pesquisa
de proposições, tramitações e votos individuais da Câmara, e consulta de
despesas com estados vazios honestos. A integração do Senado é limitada à lista
de senadores e às despesas CEAPS; proposições e votações do Senado não fazem
parte do produto. A tela Compromissos consulta os registros, e perfis consultam
ações documentadas; a base ainda não tem conteúdo editorial cadastrado. A API
de compromissos/ações permanece somente leitura; o app não exige cadastro e não
oferece escrita editorial.
Na tela de despesas, os órgãos do catálogo SIAFI oficial da CGU são listados por
categoria (ministérios, agências, universidades, institutos e fundações) e
permitem consultar despesas anuais do Executivo Federal. Configure
`CGU_API_KEY` em `apps/api/.env` durante o desenvolvimento local e nas
variáveis de ambiente de produção da Vercel; a chave nunca deve ser colocada
no app mobile.
As telas principais seguem a direção institucional do planejamento UX/UI V3:
Início, Agentes, Atuação, Despesas e Mais. O app permanece público e não
apresenta cadastro ou login de cidadão.
Também oferece busca global por agentes, órgãos SIAFI e identificadores de
proposições da Câmara, diretório de órgãos, detalhes das fontes, ajuda e
preferência de aparência persistida localmente. A busca legislativa respeita
os filtros disponíveis na API oficial; não há busca textual de proposições
nem integração de proposições/votações do Senado. Os dados locais podem ser
limpos nas preferências.

Para executar testes e verificações:

```powershell
npm run typecheck
npm run db:test --workspace @voz-publica/api
npm run build --workspace @voz-publica/api
Set-Location apps/mobile
npx expo export --platform web
```

O banco ativo da V2 é PostgreSQL. O antigo arquivo SQLite e suas migrations
foram preservados em `apps/api/prisma/dev.db` e
`apps/api/prisma/sqlite-migrations/`; os registros oficiais de demonstração
são carregados novamente pelas sincronizações acima.

## Publicação do Web e da API na Vercel

Crie um projeto Vercel ligado ao repositório e deixe o **Root Directory**
na raiz do repositório. A função em `api/index.ts` encaminha as rotas
`/api/*` ao handler da API em `apps/api/src/app.ts`, preservando o caminho
original para rotas aninhadas. O build
compila a API e exporta o aplicativo Expo Router para Web em
`apps/mobile/dist`, que é o diretório publicado pela Vercel. Rotas web sem
arquivo estático são redirecionadas ao app, e `/api/*` permanece atendido
pela função.

Configure no painel Vercel as variáveis
`DATABASE_URL` (PostgreSQL acessível pela nuvem) e `CGU_API_KEY` (chave
privada da CGU), pelo menos nos ambientes em que a API será executada. Não
coloque esses valores no repositório, no app mobile ou em `vercel.json`.
O `DATABASE_URL` também precisa estar disponível durante o build, pois a
configuração do Prisma o valida ao gerar o client.

Após o deploy, abra `https://<dominio>/` para acessar o app e valide
`https://<dominio>/api/health` para verificar a API e o banco. No Web
publicado, o app usa por padrão a mesma origem para as chamadas `/api/*`;
`EXPO_PUBLIC_API_URL` pode sobrescrever essa URL se necessário. A API acessa
o banco Neon diretamente por `DATABASE_URL`, sem bindings entre serviços.

## Documentação por etapa

- [Validação da API oficial — Etapa 2](./docs/02-VALIDACAO-API.md)
- [UX/UI — Etapa 3](./docs/03-UX-UI.md)
- [Ambiente e estrutura — Etapa 4](./docs/04-AMBIENTE-ESTRUTURA.md)
- [Banco de dados — Etapa 5](./docs/05-BANCO-DADOS.md)
- [Backend básico — Etapa 6](./docs/06-BACKEND.md)
- [Integração com a Câmara — Etapa 7](./docs/07-INTEGRACAO-CAMARA.md)
- [Aplicativo mobile MVP — Etapa 8](./docs/08-APLICATIVO-MOBILE.md)
- [Evolução multi-cargo — Versão 2](./docs/09-VERSAO-2-MULTI-CARGO.md)
- [Integração com o Senado — Versão 2](./docs/10-INTEGRACAO-SENADO.md)

Valide as consultas oficiais com:

```powershell
.\scripts\validar-api-camara.ps1
```

Dados ausentes não são preenchidos com valores fictícios. Sempre mantenha
a fonte oficial, o identificador original e a data da consulta junto aos
dados exibidos.
