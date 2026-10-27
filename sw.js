/* Service worker: guarda todos os arquivos do sistema no aparelho para o app abrir sem
   internet. Os DADOS (lançamentos etc.) não passam por aqui — ficam no localStorage do
   próprio app, só no aparelho.

   Estratégia: responde do que está guardado (abre na hora, inclusive offline) e, se houver
   internet, busca a versão nova por trás para a próxima abertura. Ao publicar mudanças, suba
   o número de VERSAO para trocar o pacote guardado. */
const VERSAO = 'financas-v10';
const ARQUIVOS = [
  './', 'index.html', 'login.html', 'lancamentos.html', 'cartoes.html', 'reserva.html', 'metas.html',
  'educacao.html', 'configuracoes.html', 'manifest.webmanifest', 'favicon.svg',
  'css/app.css',
  'js/config.js', 'js/auth.js', 'js/theme.js', 'js/pwa.js', 'js/store.js', 'js/layout.js', 'js/painel.js',
  'js/lancamentos.js', 'js/cartoes.js', 'js/reserva.js', 'js/metas.js', 'js/educacao.js',
  'js/configuracoes.js', 'js/planilha.js',
  'icones/icone-180.png', 'icones/icone-192.png', 'icones/icone-512.png', 'icones/icone-maskable-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  /* Fontes do Google: guarda depois da primeira vez (sem elas o app usa a fonte do sistema). */
  const externo = url.origin !== self.location.origin;
  if (externo && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;

  e.respondWith(caches.open(VERSAO).then(async (cache) => {
    /* ignoreSearch: "lancamentos.html?tipo=fixo" e "app.css?v=4" usam o arquivo guardado. */
    const guardado = await cache.match(req, { ignoreSearch: !externo });
    const daRede = fetch(req).then((resp) => {
      if (resp && (resp.ok || resp.type === 'opaque')) cache.put(externo ? req : new Request(url.origin + url.pathname), resp.clone());
      return resp;
    }).catch(() => null);
    if (guardado) { e.waitUntil(daRede); return guardado; }
    const resp = await daRede;
    return resp || cache.match('index.html');
  }));
});
