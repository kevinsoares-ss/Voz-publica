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
Agentes permite buscar e filtrar os registros sincronizados da Câmara e do
Senado por cargo, partido, UF e município. A sincronização atual carregou
513 deputados e 81 senadores nas fontes oficiais. Os demais fluxos incluem
perfis com proveniência, favoritos locais, pesquisa de proposições,
tramitações/votações da Câmara, consulta de despesas e votos individuais
com estados vazios honestos. A tela Compromissos consulta os registros,
e perfis consultam ações documentadas; a base ainda não tem conteúdo
editorial cadastrado. A API de compromissos/ações está em modo somente
leitura até que autenticação e autorização editoriais sejam implementadas.
Na página inicial, a consulta da CGU permite buscar órgãos pelo catálogo
SIAFI oficial e consultar despesas anuais do Executivo Federal. Configure
`CGU_API_KEY` somente no `apps/api/.env`; a chave nunca deve ser colocada
no app mobile.
O suporte de despesas/votações específicas do Senado e de outros cargos
depende da validação e integração de suas fontes.

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

## Publicação da API na Vercel

Crie um projeto Vercel ligado ao repositório e defina `apps/api` como
**Root Directory**. A configuração em `apps/api/vercel.json` publica a
entrada serverless da API, e o script `vercel-build` gera o Prisma Client
antes de compilar o TypeScript. Configure no painel Vercel as variáveis
`DATABASE_URL` (PostgreSQL acessível pela nuvem) e `CGU_API_KEY` (chave
privada da CGU), pelo menos nos ambientes em que a API será executada. Não
coloque esses valores no repositório, no app mobile ou em `vercel.json`.
O `DATABASE_URL` também precisa estar disponível durante o build, pois a
configuração do Prisma o valida ao gerar o client.

Após o deploy, valide `https://<dominio-da-api>/api/health`. Para conectar
o app publicado, configure `EXPO_PUBLIC_API_URL` no ambiente de build do
mobile com a URL base da API Vercel; essa variável é pública e não deve
conter segredos.

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
