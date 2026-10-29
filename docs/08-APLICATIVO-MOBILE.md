# Etapa 8 — Aplicativo mobile MVP

## Escopo

O Expo Router agora implementa um MVP mobile ligado à API local:

- Início com estado de conexão da API;
- busca multi-cargo por nome, cargo, partido, UF e município, com paginação;
- perfil com os campos importados e a fonte/horário da consulta;
- favoritos locais, sem login;
- pesquisa de proposições por tipo/ano;
- detalhe de proposição com tramitações e votações oficiais;
- consulta de votos individuais e despesas;
- área de compromissos com estado vazio explícito, sem registros fictícios.

As telas de despesas/votos não atribuem significado a dados sem campos
validados. Nas amostras usadas até aqui, as respostas foram vazias; se a
fonte retornar registros no futuro, a interface explica que os campos
necessitam de validação antes de exibir posições ou valores interpretados.
O MVP ainda não cadastra compromissos, não relaciona automaticamente
proposições com deputado e não oferece fluxo editorial de evidências.

## Executar

1. Instale dependências na raiz e configure os arquivos `.env` conforme o
   [README](../README.md).
2. Inicie o backend com `npm run dev:api`.
3. Execute uma sincronização oficial limitada, conforme
   [`docs/07-INTEGRACAO-CAMARA.md`](./07-INTEGRACAO-CAMARA.md).
4. Inicie o app com `npm run dev:mobile`.
5. Pressione `w` para Web ou use QR code no Expo Go.

Configuração padrão para Web local:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
```

Para emulador Android use `http://10.0.2.2:3000`; para um celular físico,
use o endereço IP LAN do computador. Se a porta API for diferente,
atualize a variável e reinicie o Metro para recarregar a configuração.
Não configure URL de produção até existir backend hospedado com HTTPS.

## Rotas móveis

| Tela | Caminho |
|---|---|
| Início | `/` |
| Agentes públicos | `/representatives` |
| Compromissos | `/commitments` |
| Favoritos | `/favorites` |
| Perfil do agente público | `/representatives/{id}` |
| Despesas do deputado da Câmara | `/representatives/{id}/expenses` |
| Pesquisa de proposições | `/proposals` |
| Detalhe / tramitações / votações | `/proposals/{id}` |
| Votos individuais | `/votes/{id}` |

## Testes e verificações registrados

- `npx tsc --noEmit` no workspace mobile: passou.
- `npx expo export --platform web` em `apps/mobile`: bundling/export
  passou para as rotas do app.
- Backend e Web foram iniciados em ambiente local; o browser confirmou
  conexão com `/api/health`, carregamento da lista sincronizada, navegação
  para perfil e apresentação da fonte oficial.
- O teste de API inclui preflight CORS para origens de desenvolvimento.
- A verificação física em dispositivo Android ainda depende de ADB/emulador
  ou Expo Go na rede do usuário; ADB não está disponível neste ambiente.

## Limitações restantes

- Favoritos usam armazenamento local não criptografado, adequado a IDs
  públicos e sem dados sensíveis.
- CORS padrão só permite localhost de desenvolvimento. Ajuste
  `CORS_ORIGINS` no `.env` explicitamente para incluir a origem web do
  Metro ou a origem hospedada; não use `*` em produção.
- O backend escuta em `0.0.0.0` no ambiente de desenvolvimento para
  permitir acesso do celular. Em hospedagem, configure firewall e
  plataforma com política própria.
- O PostgreSQL está configurado neste ambiente local. A hospedagem,
  credenciais de produção, HTTPS e rotinas de atualização ainda estão
  pendentes.
- Sem payload real não vazio, não há cartões de valor de despesa nem
  resultados individuais de votação fabricados.
- As rotas globais de proposições não afirmam relação autoral com o
  representante do perfil.

**Situação:** fluxo móvel funcional e verificado em Web local; aceitação
de Android físico, publicação e funcionalidades editoriais continuam
pendentes.
