/* App instalável (iPhone: Safari → Compartilhar → Adicionar à Tela de Início; Android/Chrome:
   menu → Instalar app). Registra o service worker (funciona sem internet) e pede ao navegador
   que não apague os dados do app para liberar espaço. */
(function () {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Sem modo offline:', e));
    });
  }
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((ok) => { if (!ok) navigator.storage.persist(); }).catch(() => {});
  }
  /* Aberto como app instalado (sem a barra do Safari). */
  const app = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  document.documentElement.classList.toggle('modo-app', app);
})();
