import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addLog, store } from './firebase.js';
import { SERVICE_CATALOG, getServiceById } from './services.js';
import { nextCrashMultiplier, registerBet, cashout, getPlatformStats, ensureUser } from './gameEngine.js';

const port = Number(process.env.PORT || 9999);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');
const sseClients = new Set();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendEvent(event, payload) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) client.write(frame);
}

async function bodyJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function serveHtml(res, filename) {
  const content = await readFile(path.join(publicDir, filename), 'utf8');
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(content);
}

async function seedServices() {
  const now = Date.now();
  for (const service of SERVICE_CATALOG) {
    await store.set(`services/${service.id}`, { ...service, updatedAt: now });
  }
}

async function bootstrap() {
  await seedServices();
  await addLog({ level: 'info', service: 'Core', message: `Servidor iniciado na porta ${port}` });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && url.pathname === '/') return serveHtml(res, 'index.html');
    if (req.method === 'GET' && url.pathname === '/docs') return serveHtml(res, 'docs.html');
    if (req.method === 'GET' && url.pathname === '/logs') return serveHtml(res, 'logs.html');

    if (req.method === 'GET' && url.pathname === '/events') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive'
      });
      res.write('event: connected\ndata: {"ok": true}\n\n');
      sseClients.add(res);
      req.on('close', () => sseClients.delete(res));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/services') {
      const services = (await store.get('services')) || {};
      return sendJson(res, 200, services);
    }

    if (req.method === 'POST' && /^\/api\/services\/[^/]+\/status$/.test(url.pathname)) {
      const [, , , serviceId] = url.pathname.split('/');
      const service = getServiceById(serviceId);
      if (!service) return sendJson(res, 404, { error: 'Serviço não encontrado' });

      const body = await bodyJson(req);
      const status = body.status === 'offline' ? 'offline' : 'online';
      await store.patch(`services/${serviceId}`, { status, updatedAt: Date.now() });

      const log = await addLog({
        level: status === 'online' ? 'info' : 'warn',
        service: service.name,
        message: `Status atualizado para ${status}`
      });
      sendEvent('service', { serviceId, status });
      sendEvent('log', log);
      return sendJson(res, 200, { ok: true, serviceId, status });
    }

    if (req.method === 'GET' && url.pathname === '/api/stats') {
      const stats = await getPlatformStats();
      return sendJson(res, 200, stats);
    }

    if (req.method === 'POST' && url.pathname === '/api/users/credit') {
      const { userId, amount } = await bodyJson(req);
      if (!userId || !Number.isFinite(Number(amount))) {
        return sendJson(res, 400, { error: 'userId e amount obrigatórios' });
      }
      await ensureUser(userId);
      const current = Number((await store.get(`wallets/${userId}`)) ?? 0);
      const next = Number((current + Number(amount)).toFixed(2));
      await store.set(`wallets/${userId}`, next);
      return sendJson(res, 200, { userId, balance: next });
    }

    if (req.method === 'POST' && url.pathname === '/api/games/crash/round') {
      const multiplier = nextCrashMultiplier();
      const log = await addLog({
        level: 'info',
        service: 'Crash engine',
        message: `Rodada gerada: x${multiplier}`
      });
      sendEvent('log', log);
      return sendJson(res, 200, { multiplier });
    }

    if (req.method === 'POST' && url.pathname === '/api/games/crash/bet') {
      const { userId, amount } = await bodyJson(req);
      const result = await registerBet(userId, Number(amount));
      const log = await addLog({
        level: 'info',
        service: 'Gestão de apostas',
        message: `Aposta aceita: ${userId} (${amount})`
      });
      sendEvent('log', log);
      return sendJson(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/games/crash/cashout') {
      const { userId, amount, multiplier } = await bodyJson(req);
      const result = await cashout(userId, Number(amount), Number(multiplier));
      const log = await addLog({
        level: 'info',
        service: 'Crash engine',
        message: `Cashout: ${userId} ganhou ${result.prize}`
      });
      sendEvent('log', log);
      return sendJson(res, 200, result);
    }

    if (req.method === 'GET' && url.pathname === '/api/logs') {
      const logs = (await store.get('logs')) || {};
      const list = Object.values(logs).sort((a, b) => b.createdAt - a.createdAt).slice(0, 200);
      return sendJson(res, 200, list);
    }

    return sendJson(res, 404, { error: 'Rota não encontrada' });
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }
});

bootstrap()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server-ia rodando em http://localhost:${port}`);
      console.log(`Modo store: ${store.isRemoteEnabled() ? 'Firebase REST' : 'Memória local'}`);
    });
  })
  .catch((error) => {
    console.error('Falha ao iniciar servidor:', error.message);
    process.exit(1);
  });
