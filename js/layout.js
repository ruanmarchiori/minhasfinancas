/* Partes comuns a todas as telas: ícones, menu lateral, barra do topo (com o seletor do mês
   de referência), formatação de dinheiro, aviso (toast) e janela (modal).

   O menu e a barra são escritos com document.write enquanto a página carrega — assim
   aparecem já prontos, sem piscar, e o sidebar.js encontra os botões no DOMContentLoaded. */
const UI = (function () {
  const ICONES = {
    home: '<path d="M4 11.5 12 4l8 7.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9h12v-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 19v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    entrada: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v10M8 13l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    fixo: '<rect x="4" y="5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 10h16M9 3v4M15 3v4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9.5 14.5l2 2 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    carrinho: '<path d="M3 4h2.5l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.3a1.5 1.5 0 0 0 1.5-1.1L21 8H6.3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.5" cy="19.5" r="1.5" fill="currentColor"/><circle cx="17" cy="19.5" r="1.5" fill="currentColor"/>',
    cartao: '<rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M2.5 10h19M6 15h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    cofre: '<path d="M5 11a7 6 0 0 1 13-2.5h1.5a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1h-1.3A7 6 0 0 1 16 16.5V19h-3v-1.6a8 8 0 0 1-3 0V19H7v-2.6A6 6 0 0 1 5 11z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="15" cy="10" r=".9" fill="currentColor"/><path d="M10 7.5h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
    alvo: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    livro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5zM9 7.5h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
    engrenagem: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.4-2-3.4-2.3.8a7.7 7.7 0 0 0-1.7-1l-.4-2.4H10.6l-.4 2.4a7.7 7.7 0 0 0-1.7 1l-2.3-.8-2 3.4L6.2 11a7.6 7.6 0 0 0 0 2l-2 1.4 2 3.4 2.3-.8a7.7 7.7 0 0 0 1.7 1l.4 2.4h3.4l.4-2.4a7.7 7.7 0 0 0 1.7-1l2.3.8 2-3.4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    sair: '<path d="M15 17l5-5-5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><line x1="20" y1="12" x2="9" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    chevron: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    chevronDir: '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    menu: '<line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="4" y1="17" x2="20" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    mais: '<line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    lapis: '<path d="M4 20h4L19 9l-4-4L4 16z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M13.5 6.5l4 4" stroke="currentColor" stroke-width="1.8"/>',
    lixo: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    repetir: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9M20 4v5h-5M20 12a8 8 0 0 1-13.7 5.6L4 15M4 20v-5h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    subir: '<path d="M12 15V4M7 9l5-5 5 5M5 20h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    planilha: '<rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 9h16M4 15h16M10 3v18" fill="none" stroke="currentColor" stroke-width="1.6"/>',
    olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    olhoFechado: '<path d="M3 3l18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a15.7 15.7 0 0 1-3.2 4.1M6.2 6.8C3.7 8.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 3.4-.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    seta: '<path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  const MENU = [
    { id: 'painel', href: 'index.html', icone: 'home', nome: 'Painel' },
    { id: 'receita', href: 'lancamentos.html?tipo=receita', icone: 'entrada', nome: 'Receitas' },
    { id: 'fixo', href: 'lancamentos.html?tipo=fixo', icone: 'fixo', nome: 'Gastos fixos' },
    { id: 'variavel', href: 'lancamentos.html?tipo=variavel', icone: 'carrinho', nome: 'Gastos variáveis' },
    { id: 'cartoes', href: 'cartoes.html', icone: 'cartao', nome: 'Cartões' },
    { id: 'reserva', href: 'reserva.html', icone: 'cofre', nome: 'Reserva' },
    { id: 'metas', href: 'metas.html', icone: 'alvo', nome: 'Metas' },
    { id: 'educacao', href: 'educacao.html', icone: 'livro', nome: 'Educação financeira' },
    { id: 'configuracoes', href: 'configuracoes.html', icone: 'engrenagem', nome: 'Configurações' }
  ];

  const ico = (nome, classe) => `<svg class="${classe || 'icon'}" aria-hidden="true"><use href="#i-${nome}"/></svg>`;

  function sprite() {
    return '<svg style="display:none" aria-hidden="true">' +
      Object.entries(ICONES).map(([n, p]) => `<symbol id="i-${n}" viewBox="0 0 24 24">${p}</symbol>`).join('') + '</svg>';
  }

  /* Menu lateral (gaveta no celular). */
  function sidebar(ativo) {
    document.write(sprite() + `
      <aside class="sidebar">
        <button class="sidebar-collapse-btn" id="sidebarCollapseBtn" aria-label="Recolher menu">${ico('chevron', 'icon-sm')}</button>
        <div class="brand"><div class="brand-mark">R$</div><span class="brand-name">Finanças</span></div>
        <nav class="nav-group">
          ${MENU.map(i => `<a href="${i.href}" class="nav-link${i.id === ativo ? ' active' : ''}"${i.id === ativo ? ' aria-current="page"' : ''}>${ico(i.icone)}<span>${i.nome}</span></a>`).join('')}
        </nav>
        <div class="nav-spacer"></div>
        <button class="nav-link nav-logout" id="logoutBtn">${ico('sair')}<span>Sair</span></button>
      </aside>
      <div class="sidebar-backdrop" id="sidebarBackdrop"></div>`);
  }

  /* Barra do topo; com {mes:true} mostra o seletor do mês de referência. */
  function topbar(titulo, opcoes) {
    const o = opcoes || {};
    document.write(`
      <div class="topbar">
        <div class="topbar-title">
          <button class="hamburger-btn" id="hamburgerBtn" aria-label="Abrir menu">${ico('menu')}</button>
          <h1>${titulo}</h1>
        </div>
        <div class="topbar-actions">
          ${o.mes ? `<div class="mes-seletor" role="group" aria-label="Mês de referência">
            <button type="button" class="mes-btn" id="mesAnterior" aria-label="Mês anterior">${ico('chevron', 'icon-sm')}</button>
            <label class="mes-atual"><span id="mesTexto"></span><input type="month" id="mesInput" aria-label="Escolher mês"></label>
            <button type="button" class="mes-btn" id="mesProximo" aria-label="Próximo mês">${ico('chevronDir', 'icon-sm')}</button>
          </div>` : ''}
        </div>
      </div>
      <div class="toast" id="toast" role="status"></div>`);
  }

  /* Liga o seletor de mês; chama aoMudar(mes) a cada troca. */
  function ligarMes(aoMudar) {
    const texto = document.getElementById('mesTexto');
    const input = document.getElementById('mesInput');
    if (!texto) return;
    function mostrar() {
      const m = STORE.mesRef();
      texto.textContent = STORE.nomeMes(m, true);
      input.value = m;
    }
    function ir(m) { STORE.setMesRef(m); mostrar(); aoMudar(m); }
    document.getElementById('mesAnterior').addEventListener('click', () => ir(STORE.somarMes(STORE.mesRef(), -1)));
    document.getElementById('mesProximo').addEventListener('click', () => ir(STORE.somarMes(STORE.mesRef(), 1)));
    input.addEventListener('change', () => { if (/^\d{4}-\d{2}$/.test(input.value)) ir(input.value); });
    mostrar();
  }

  const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const brl = (v) => fmtBRL.format(Number(v) || 0);
  const pct = (v, casas) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: casas ?? 1, maximumFractionDigits: casas ?? 1 });
  /* Aceita "1.234,56", "1234.56", "R$ 10" — o que a pessoa digitar no celular. */
  function lerValor(txt) {
    let s = String(txt || '').replace(/[^\d,.-]/g, '');
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3200);
  }

  /* Janela simples: UI.modal({ titulo, html, largo }) → { el, fechar }. Fecha com Esc,
     clique fora ou em [data-fechar]. */
  function modal(o) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `<div class="modal-card${o.largo ? ' is-wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.titulo)}">
      <div class="modal-head"><h3>${esc(o.titulo)}</h3></div>
      <button type="button" class="notif-popup-close" data-fechar aria-label="Fechar">×</button>
      <div class="modal-corpo">${o.html}</div></div>`;
    document.body.appendChild(overlay);
    const anterior = document.activeElement;
    function fechar() {
      overlay.remove();
      document.removeEventListener('keydown', tecla);
      if (anterior && anterior.focus) anterior.focus();
      if (o.aoFechar) o.aoFechar();
    }
    function tecla(e) { if (e.key === 'Escape') fechar(); }
    overlay.addEventListener('click', (e) => { if (e.target === overlay || e.target.closest('[data-fechar]')) fechar(); });
    document.addEventListener('keydown', tecla);
    const primeiro = overlay.querySelector('input, select, textarea, button:not([data-fechar])');
    if (primeiro) setTimeout(() => primeiro.focus(), 30);
    return { el: overlay, fechar };
  }

  function confirmar(texto) { return window.confirm(texto); }

  /* Botão Sair (em todas as telas). */
  document.addEventListener('DOMContentLoaded', () => {
    const sair = document.getElementById('logoutBtn');
    if (sair) sair.addEventListener('click', () => AUTH.logout());
  });

  return { ico, sidebar, topbar, ligarMes, brl, pct, lerValor, esc, toast, modal, confirmar, MENU };
})();
