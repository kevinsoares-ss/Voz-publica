# Etapa 4 — Repositório e estrutura

## Objetivo

Estabelecer um monorepo npm com os aplicativos separados em `apps/mobile`
e `apps/api`, iniciar ambos em desenvolvimento e registrar como reproduzir
as verificações no Windows. Esta etapa não implementa funcionalidades do
MVP, persistência ou integração de dados.

## Pré-requisitos

- Node.js e npm disponíveis no PATH.
- Git instalado.
- Internet para instalar dependências Expo e executar o bundler.
- Expo Go no celular ou Android Studio/ADB para validar em dispositivo.

Ambiente encontrado em 28/10/2026:

| Ferramenta | Versão/estado |
|---|---|
| Node.js | `v24.21.0` |
| npm | `11.19.0` |
| Git | `2.55.0.windows.5` |
| VS Code | `1.143.1` |
| ADB | Não encontrado no PATH |

O app e a API podem ser iniciados sem ADB. A execução no emulador Android
fica pendente até configurar Android Studio/SDK; o uso com Expo Go requer
um telefone com Expo Go instalado.

## Estrutura criada

```text
apps/
├── api/
│   ├── src/server.ts
│   ├── package.json
│   └── tsconfig.json
└── mobile/
    ├── src/app/
    ├── assets/
    ├── app.json
    └── package.json
docs/
scripts/
logs/
package.json
README.md
```

O mobile foi iniciado com Expo, TypeScript e Expo Router. A tela inicial é
apenas um placeholder de inicialização: navegação e telas do produto
continuam para as etapas apropriadas. O servidor Node inicia em
`127.0.0.1:3000` (ou nas variáveis locais `HOST` e `PORT`) e responde `404`
para rotas não implementadas. Ele não se conecta a banco nem à Câmara.

## Passos para instalar e iniciar

1. Na raiz do projeto, instalar os workspaces:

   ```powershell
   npm install
   ```

2. Em um terminal, iniciar a API:

   ```powershell
   npm run dev:api
   ```

   Resultado esperado: `API scaffold listening at http://127.0.0.1:3000`.
   Para conferir o processo sem criar uma rota de saúde nesta etapa:

   ```powershell
   Invoke-WebRequest http://127.0.0.1:3000 -UseBasicParsing
   ```

   O servidor retorna HTTP 404 com JSON, indicando que iniciou e que a
   rota raiz não foi implementada.

3. Em outro terminal, iniciar o Expo:

   ```powershell
   npm run dev:mobile
   ```

   Resultado esperado: Metro/Expo informa que está pronto para abrir o
   projeto. Leia o QR code no Expo Go; para emulador Android, configure
   ADB antes de usar `npm run android --workspace @voz-publica/mobile`.

4. Conferir os tipos TypeScript:

   ```powershell
   npm run typecheck
   ```

## Estado da validação

- A estrutura Expo TypeScript foi gerada e as dependências foram
  instaladas.
- O servidor API mínimo usa somente o módulo HTTP nativo do Node, sem
  dependência de framework, Prisma ou PostgreSQL nesta etapa.
- A tela inicial é placeholder; as telas e os fluxos definidos em
  [03-UX-UI.md](./03-UX-UI.md) ainda não foram implementados.
- `npm run typecheck` passou nos dois workspaces; `npm run build
  --workspace @voz-publica/api` compilou a API.
- `npx expo-doctor` passou em 20/20 verificações depois de alinhar os
  módulos de React compartilhados no workspace.
- `npx expo export --platform web` gerou o bundle Web; o Metro respondeu
  `packager-status:running` em `/status`.
- O servidor API iniciou e respondeu HTTP 404 com JSON à rota `/`, como
  esperado para uma API sem rotas nesta etapa.
- O `npm audit fix` sem `--force` não removeu os avisos; o resultado
  continua em 8 (5 baixos e 3 altos).
- A rota `GET /api/health`, os contratos da API e a integração com a
  Câmara permanecem para etapas posteriores.
- A auditoria do workspace consolidado encontrou 8 avisos (5 baixos e 3
  altos) em dependências transitivas do Expo, incluindo `deepmerge` e
  `zod`. O `npm audit fix --force` proposto pelo npm rebaixaria o Expo
  para a versão 51, incompatível com o scaffold atual; não foi aplicado.
- A auditoria de dependências deve ser reavaliada antes de publicar ou
  expor o app; não aplicar o downgrade proposto pelo `--force`.
- Uma primeira tentativa de instalar Expo Router falhou ao carregar um
  arquivo interno do CLI. Após instalar os pacotes como workspace,
  alinhar versões e executar o diagnóstico Expo, a inicialização e o
  bundle Web passaram.
- A execução em Android/emulador não foi verificada porque `adb` não está
  disponível no PATH.

## Erros comuns

- **`npm` não encontrado:** confira a instalação do Node.js LTS e abra um
  novo terminal para atualizar o PATH.
- **Porta 3000 ocupada:** inicie com uma porta local livre:
  `$env:PORT=3001; npm run dev:api`.
- **Expo não conecta ao aparelho:** confirme que computador e celular
  estão na mesma rede; se necessário, use o modo tunnel do Expo.
- **`adb` não reconhecido:** instale/configure Android Studio e adicione
  `platform-tools` ao PATH; não declare o teste no emulador concluído
  antes disso.

## Decisões tomadas

1. Usar npm workspaces para coordenar os dois aplicativos no mesmo
   repositório.
2. Usar o template TypeScript oficial do Expo; Expo Router foi incluído
   como ponto de partida de navegação, sem adiantar telas do MVP.
3. Manter a API inicial no HTTP nativo do Node e adiar framework,
   validação, saúde e rotas para suas respectivas etapas.
4. Não inicializar dependências de banco, Prisma ou arquivo `.env` antes
   da etapa de banco/backend.
5. Centralizar exclusões comuns no `.gitignore` da raiz, manter artefatos
   de validação rastreáveis e remover o Git interno eventualmente criado
   pelo scaffolder Expo.
6. Fixar `react`, `react-dom` e `react-native` na raiz para compartilhar
   uma única versão compatível entre workspaces e evitar módulos nativos
   duplicados reportados pelo Expo Doctor.

## Checklist

- [x] Repositório Git inicializado na raiz do workspace.
- [x] Monorepo npm com `apps/mobile` e `apps/api` criado.
- [x] Aplicativo Expo/TypeScript scaffoldado.
- [x] Servidor API TypeScript inicializado.
- [x] Reinstalar dependências como workspaces.
- [x] Executar typecheck e build da API.
- [x] Confirmar que API e Metro Expo iniciam localmente.
- [x] Exportar o bundle Web do app.
- [x] Validar dependências e configuração com Expo Doctor.
- [ ] Testar abertura no Expo Go ou emulador Android.
- [x] Revalidar auditoria das dependências após a instalação final.
- [ ] Resolver os avisos transitivos sem rebaixar o SDK Expo.

**Situação:** estrutura e inicialização técnica da Etapa 4 verificadas em
28/10/2026. A abertura em dispositivo/emulador e a resolução segura dos
avisos transitivos continuam pendentes; `adb` não está no PATH. Esses
limites não impediram o typecheck, o Expo Doctor, a inicialização do
Metro/API nem o bundle Web.

**Próximo passo:** fechar os itens de validação da Etapa 4 antes de
começar a etapa seguinte. Não criar banco nem implementar rotas de
negócio nesta etapa.
