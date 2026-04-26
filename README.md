# Server-ia

Servidor modular em Node.js (sem libs externas) com:

- Dashboard de módulos com `✅` e `❌`
- Logs em tempo real via SSE
- Página de documentação (`/docs`)
- Endpoints para crash/aviator base (rodada, aposta, cashout)
- Persistência com Firebase REST **ou** memória local automática

## O que foi melhorado

- Sem dependência de `express`, `firebase SDK` etc. (evita erro de install em ambientes bloqueados).
- Estrutura robusta para rodar em Termux, VPS e Render com comandos simples.
- Testes automatizados com `node --test` incluídos.

## Funcionalidades incluídas (17)

1. Baixador de música (adapter)
2. Baixador de vídeos (adapter)
3. Baixador TikTok (adapter)
4. Baixador Facebook (adapter)
5. Baixador Instagram (adapter)
6. YouTube metadata
7. QR + Sessões
8. WhatsApp bridge
9. Telegram bridge
10. Aviator websocket
11. Crash engine
12. Gestão de apostas
13. Saldos dos usuários
14. Contagem de usuários
15. Notificações
16. Docs service
17. Logs service

## Execução local

```bash
cp .env.example .env
npm start
```

Acesse:

- `http://localhost:9999/`
- `http://localhost:9999/docs`
- `http://localhost:9999/logs`

## Termux

```bash
pkg update -y
pkg install nodejs git -y
git clone <seu-repo>
cd Server-ia
cp .env.example .env
npm start
```

## Firebase

Você pode usar em 2 modos:

- **Memória local** (padrão): não define `FIREBASE_DATABASE_URL`.
- **Firebase REST**: define `FIREBASE_DATABASE_URL` e opcionalmente `FIREBASE_DATABASE_SECRET`.

`.env.example`:

```env
PORT=9999
FIREBASE_DATABASE_URL=
FIREBASE_DATABASE_SECRET=
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
```

## Endpoints

- `GET /api/services`
- `POST /api/services/:id/status`
- `POST /api/users/credit`
- `GET /api/stats`
- `POST /api/games/crash/round`
- `POST /api/games/crash/bet`
- `POST /api/games/crash/cashout`
- `GET /api/logs`
- `GET /events`

## Exemplo rápido

Creditar saldo:

```bash
curl -X POST http://localhost:9999/api/users/credit \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","amount":100}'
```

Apostar:

```bash
curl -X POST http://localhost:9999/api/games/crash/bet \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","amount":10}'
```

Cashout:

```bash
curl -X POST http://localhost:9999/api/games/crash/cashout \
  -H "Content-Type: application/json" \
  -d '{"userId":"u1","amount":10,"multiplier":2.1}'
```
