export const SERVICE_CATALOG = [
  ['music-downloader', 'Baixador de música', 'media'],
  ['video-downloader', 'Baixador de vídeos', 'media'],
  ['tiktok-downloader', 'Baixador do TikTok', 'media'],
  ['facebook-downloader', 'Baixador do Facebook', 'media'],
  ['instagram-downloader', 'Baixador do Instagram', 'media'],
  ['youtube-metadata', 'YouTube metadata', 'media'],
  ['qr-session-manager', 'QR + Sessões', 'messaging'],
  ['whatsapp-bridge', 'WhatsApp bridge', 'messaging'],
  ['telegram-bridge', 'Telegram bridge', 'messaging'],
  ['aviator-ws', 'Aviator websocket', 'games'],
  ['crash-engine', 'Crash engine', 'games'],
  ['bets-manager', 'Gestão de apostas', 'games'],
  ['balances-manager', 'Saldos dos usuários', 'core'],
  ['users-counter', 'Contagem de usuários', 'core'],
  ['notifications', 'Notificações', 'core'],
  ['docs-service', 'Portal de docs', 'infra'],
  ['logs-service', 'Logs em tempo real', 'infra']
].map(([id, name, category]) => ({ id, name, category, status: 'online' }));

export function getServiceById(id) {
  return SERVICE_CATALOG.find((item) => item.id === id);
}
