/* Partes comuns a todas as telas: ícones, cabeçalho, menu (pílula escura vertical no
   computador; pílula flutuante embaixo no celular), título da página com o seletor do mês de
   referência, formatação de dinheiro, aviso (toast) e janela (modal).

   Cabeçalho, menu e título são escritos com document.write enquanto a página carrega — assim
   aparecem prontos, sem piscar. */
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
    seta: '<path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    busca: '<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M16 16l4.5 4.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    sino: '<path d="M6 17v-5.5a6 6 0 0 1 12 0V17l1.5 2h-15z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 21a2.2 2.2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    pessoa: '<circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M5 20c.9-3.6 3.6-5.5 7-5.5s6.1 1.9 7 5.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/>',
    menos: '<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    fechar: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    sol: '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    lua: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    grade: '<rect x="4" y="4" width="6.5" height="6.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
    logo: '<path d="M5 19V9.5a5.5 5.5 0 0 1 5.5-5.5H19v4.5h-8a1.5 1.5 0 0 0-1.5 1.5V19z" fill="currentColor"/><path d="M12 12.5h6v4h-6z" fill="currentColor"/>',
    diamante: '<path d="M6 4h12l3 5-9 11L3 9z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M3 9h18M9 4l3 16 3-16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>'
  };

  const MENU = [
    { id: 'painel', href: 'index.html', icone: 'home', nome: 'Visão geral', grupo: 'Menu principal' },
    { id: 'receita', href: 'lancamentos.html?tipo=receita', icone: 'entrada', nome: 'Receitas', grupo: 'Menu principal' },
    { id: 'fixo', href: 'lancamentos.html?tipo=fixo', icone: 'fixo', nome: 'Gastos fixos', grupo: 'Menu principal' },
    { id: 'variavel', href: 'lancamentos.html?tipo=variavel', icone: 'carrinho', nome: 'Gastos variáveis', grupo: 'Menu principal' },
    { id: 'cartoes', href: 'cartoes.html', icone: 'cartao', nome: 'Cartões', grupo: 'Menu principal' },
    { id: 'reserva', href: 'reserva.html', icone: 'cofre', nome: 'Reserva', grupo: 'Planejamento' },
    { id: 'metas', href: 'metas.html', icone: 'alvo', nome: 'Metas', grupo: 'Planejamento' },
    { id: 'educacao', href: 'educacao.html', icone: 'livro', nome: 'Educação financeira', grupo: 'Aprender' },
    { id: 'configuracoes', href: 'configuracoes.html', icone: 'engrenagem', nome: 'Configurações', grupo: '' }
  ];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ico = (nome, classe) => `<svg class="${classe || 'icon'}" aria-hidden="true"><use href="#i-${nome}"/></svg>`;

  function sprite() {
    return '<svg style="display:none" aria-hidden="true">' +
      Object.entries(ICONES).map(([n, p]) => `<symbol id="i-${n}" viewBox="0 0 24 24">${p}</symbol>`).join('') + '</svg>';
  }

  const link = (i, ativo, curto) => `<a href="${i.href}" class="nav-link${i.id === ativo ? ' active' : ''}"${i.id === ativo ? ' aria-current="page"' : ''}>${ico(i.icone)}<span>${curto || i.nome}</span></a>`;

  /* Menu lateral verde com grupos (computador) + barra do topo (saudação, busca, avisos) +
     barra inferior no celular. A página fica dentro de .conteudo (aberto aqui e fechado pelo
     HTML com </div> depois do </main>). */
  function sidebar(ativo) {
    const nome = (STORE.dados.pessoas[0] || { nome: '' }).nome || 'Você';
    const email = (window.APP_CONFIG && APP_CONFIG.localAuth && APP_CONFIG.localAuth.email) || '';
    const grupos = [...new Set(MENU.map(i => i.grupo).filter(Boolean))];
    const principais = [['painel', 'Início'], ['receita', 'Receitas'], ['variavel', 'Gastos'], ['cartoes', 'Cartões']];
    const nAvisos = STORE.avisos().length;
    document.write(sprite() + `
      <aside class="sidebar">
        <a class="marca" href="index.html" aria-label="Início"><span class="marca-logo">${ico('logo')}</span><span class="marca-texto"><strong>Finanças</strong></span></a>
        ${grupos.map(g => `<nav class="menu-grupo" aria-label="${g}"><div class="menu-titulo">${g}</div>${MENU.filter(i => i.grupo === g).map(i => link(i, ativo)).join('')}</nav>`).join('')}
        <div class="menu-rodape">
          ${link(MENU.find(i => i.id === 'configuracoes'), ativo)}
          <button type="button" class="nav-link" id="logoutBtn">${ico('sair')}<span>Sair</span></button>
          <div class="usuario"><span class="avatar">${esc(nome.slice(0, 2).toUpperCase())}</span><span class="usuario-info"><strong>${esc(nome)}</strong><span>${esc(email)}</span></span></div>
        </div>
      </aside>
      <div class="conteudo">
      <header class="cabecalho">
        <a class="marca-logo so-celular" href="index.html" aria-label="Início" style="background:var(--menu);color:#fff">${ico('logo')}</a>
        <span class="chip-perfil">${ico('pessoa', 'icon-sm')}Pessoal</span>
        <span class="saudacao">Olá, ${esc(nome)}</span>
        <span class="cabecalho-espaco"></span>
        <form class="busca" id="formBusca" role="search"><svg class="icon-sm" aria-hidden="true"><use href="#i-busca"/></svg><input type="search" id="campoBusca" placeholder="Buscar transações" aria-label="Buscar transações" autocomplete="off"></form>
        <div class="cabecalho-acoes">
          <button type="button" class="btn-redondo so-celular" id="btnBuscaCel" aria-label="Buscar transações">${ico('busca')}</button>
          <button type="button" class="btn-redondo" id="btnAvisos" aria-label="Avisos${nAvisos ? ` (${nAvisos})` : ''}">${ico('sino')}${nAvisos ? `<span class="selo-aviso">${nAvisos}</span>` : ''}</button>
          <button type="button" class="btn-redondo" id="btnTema" aria-label="Alternar modo escuro">${ico(window.THEME && THEME.get() === 'dark' ? 'sol' : 'lua')}</button>
        </div>
      </header>
      <nav class="nav-baixo" aria-label="Menu">
        ${principais.map(([id, curto]) => link(MENU.find(i => i.id === id), ativo, curto)).join('')}
        <button type="button" class="nav-link${principais.some(p => p[0] === ativo) ? '' : ' active'}" id="btnMais" aria-label="Mais telas">${ico('grade')}<span>Mais</span></button>
      </nav>`);
  }

  /* Busca de transações: resultados numa janela; tocar abre o mês e a tela certos. */
  function abrirBusca(textoInicial) {
    const j = modal({
      titulo: 'Buscar transações',
      html: `<label class="field"><span>Descrição, categoria, pessoa, cartão ou valor</span><input type="search" id="buscaTexto" value="${esc(textoInicial || '')}" autocomplete="off"></label><div id="buscaLista" style="margin-top:12px"></div>`
    });
    const campo = j.el.querySelector('#buscaTexto');
    const lista = j.el.querySelector('#buscaLista');
    const TIPO_PAG = { receita: 'receita', fixo: 'fixo', variavel: 'variavel' };
    function mostrar() {
      const res = STORE.buscar(campo.value);
      if (campo.value.trim().length < 2) { lista.innerHTML = '<p class="vazio-curto">Digite pelo menos 2 letras.</p>'; return; }
      lista.innerHTML = res.length ? res.map(l => {
        const c = STORE.categoria(l.categoria), p = STORE.pessoa(l.pessoa);
        const rec = l.tipo === 'receita';
        return `<a class="busca-res" href="lancamentos.html?tipo=${TIPO_PAG[l.tipo]}" data-mes="${l.mes}">
          <span class="ultimo-icone">${rec ? '💰' : esc(c ? c.icone : '•')}</span>
          <span class="ultimo-info"><strong>${esc(l.descricao || (rec ? l.tipoReceita : c ? c.nome : 'Gasto'))}</strong><span>${esc([rec ? (p && p.nome) : (c && c.nome), STORE.nomeMes(l.mes), l.parcela ? `parcela ${l.parcela.n}/${l.parcela.de}` : ''].filter(Boolean).join(' · '))}</span></span>
          <span class="ultimo-valor${rec ? ' is-receita' : ''}">${rec ? '+' : '−'}${brl(l.valor)}</span></a>`;
      }).join('') : '<p class="vazio-curto">Nada encontrado.</p>';
      lista.querySelectorAll('[data-mes]').forEach(a => a.addEventListener('click', () => STORE.setMesRef(a.dataset.mes)));
    }
    campo.addEventListener('input', mostrar);
    mostrar();
    setTimeout(() => { campo.focus(); campo.setSelectionRange(campo.value.length, campo.value.length); }, 40);
  }

  /* Avisos do sino. */
  function abrirAvisos() {
    const lista = STORE.avisos();
    modal({
      titulo: 'Avisos',
      html: lista.length ? lista.map(a => `<a class="aviso-item t-${a.tipo}" href="${a.href}"><i></i><span>${esc(a.texto)}</span></a>`).join('') : '<p class="vazio-curto">Tudo em dia. Nenhum aviso agora.</p>'
    });
  }

  /* Folha com todas as telas (botão "Mais" do celular). */
  function abrirMais() {
    const j = modal({
      titulo: 'Menu',
      html: `<div class="mais-grade">${MENU.map(i => `<a href="${i.href}" class="mais-item">${ico(i.icone)}<span>${i.nome}</span></a>`).join('')}
        <button type="button" class="mais-item is-sair" data-sair>${ico('sair')}<span>Sair</span></button></div>`
    });
    j.el.querySelector('[data-sair]').addEventListener('click', () => AUTH.logout());
  }

  /* Título da página; {mes:true} mostra o seletor do mês de referência, {sub} um subtítulo,
     {pessoas:true} as bolinhas das pessoas da casa (no lugar dos avatares da referência). */
  const CORES_PESSOA = ['#c9d4f2', '#efe3a6', '#f0c4c4', '#cfe8d8', '#e3d3f2'];
  function topbar(titulo, opcoes) {
    const o = opcoes || {};
    document.write(`
      <div class="topbar">
        <div class="topbar-title">
          <h1>${titulo}</h1>
          ${o.sub ? `<p>${o.sub}</p>` : ''}
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
  /* Aceita "1.234,56", "1.500" (ponto de milhar), "1234.56", "R$ 10". */
  function lerValor(txt) {
    let s = String(txt || '').replace(/[^\d,.-]/g, '');
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
  }
  /* Valor para preencher um campo de dinheiro: 1500 → "1.500,00"; 0/vazio → "". */
  const num2 = (v) => (Number(v) ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');

  /* Campos de dinheiro (data-dinheiro) funcionam como app de banco: só se digitam números e os
     centavos entram pela direita (1 → 0,01 · 150000 → 1.500,00). Assim não há como confundir
     ponto e vírgula, e o teclado do celular mostra só números. Vale para campos criados depois
     (janelas), porque o evento é escutado no documento. */
  document.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.matches || !el.matches('input[data-dinheiro]')) return;
    const digitos = el.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 13);
    el.value = digitos ? (Number(digitos) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    try { el.setSelectionRange(el.value.length, el.value.length); } catch (err) { /* alguns tipos não deixam */ }
  }, true); /* captura: formata antes das telas lerem o valor */

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
      <button type="button" class="notif-popup-close" data-fechar aria-label="Fechar">${ico('fechar', 'icon-sm')}</button>
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

  /* Salva um arquivo de texto (backup). No celular usa a folha de compartilhar — no iPhone é o
     jeito de gravar em "Arquivos"/iCloud ou mandar por WhatsApp/e-mail. Devolve false se a pessoa
     cancelar, para quem chamou não seguir adiante (ex.: não apagar o ano sem backup). */
  async function salvarArquivo(nome, texto) {
    const tipo = 'application/json';
    const movel = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (movel && navigator.canShare && typeof File !== 'undefined') {
      const arq = new File([texto], nome, { type: tipo });
      if (navigator.canShare({ files: [arq] })) {
        try { await navigator.share({ files: [arq], title: nome }); return true; }
        catch (e) { if (e && e.name === 'AbortError') return false; /* outro erro: tenta baixar */ }
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    return true;
  }

  /* ===== Desenho do cartão =====
     Visuais inspirados nos cartões de verdade (Nubank roxo, Ourocard amarelo do BB, Smiles Gold
     dourado) — com o nome escrito, sem reproduzir logotipos. O visual vem de c.estilo ou é
     deduzido do nome do cartão. */
  const ESTILOS = [
    { id: 'nubank', nome: 'Nubank' },
    { id: 'ourocard', nome: 'Ourocard' },
    { id: 'smiles', nome: 'Smiles Gold' },
    { id: 'verde', nome: 'Verde' },
    { id: 'azul', nome: 'Azul' },
    { id: 'grafite', nome: 'Grafite' }
  ];
  function estiloDoCartao(c) {
    if (c.estilo && ESTILOS.some(e => e.id === c.estilo)) return c.estilo;
    const n = (c.nome + ' ' + (c.bandeira || '')).toLowerCase();
    if (/smiles/.test(n)) return 'smiles';
    if (/nu|nubank/.test(n)) return 'nubank';
    if (/ourocard|banco do brasil|bb/.test(n)) return 'ourocard';
    return 'verde';
  }
  function bandeiraDoCartao(c, estilo) {
    const b = (c.bandeira || '').toLowerCase();
    if (/master/.test(b)) return 'master';
    if (/visa/.test(b)) return 'visa';
    if (/elo/.test(b)) return 'elo';
    if (/amex|american/.test(b)) return 'amex';
    return estilo === 'nubank' || estilo === 'azul' || estilo === 'grafite' || estilo === 'verde' ? 'master' : 'visa';
  }
  function marcaBandeira(tipo) {
    if (tipo === 'master') return '<span class="cc-master" aria-label="Mastercard"><i></i><i></i></span>';
    if (tipo === 'elo') return '<span class="cc-elo">elo</span>';
    if (tipo === 'amex') return '<span class="cc-elo">AMEX</span>';
    return '<span class="cc-visa">VISA</span>';
  }
  /* o: { rotulo, valor } — o que aparece embaixo à esquerda (ex.: "Fatura de Jul" + valor). */
  function cartaoHTML(c, o) {
    const op = o || {};
    const estilo = estiloDoCartao(c);
    const nivel = (/(gold|platinum|black|infinite|ultravioleta|grafite)/i.exec(c.bandeira || '') || [])[1];
    const emissor = {
      nubank: 'nu',
      ourocard: 'Ourocard<small>Banco do Brasil</small>',
      smiles: 'smiles<small>Banco do Brasil</small>'
    }[estilo] || esc(c.nome);
    const tag = estilo === 'smiles' ? (nivel || 'Gold') : (nivel || (estilo === 'nubank' ? '' : ''));
    const titular = c.titular ? (STORE.pessoa(c.titular) || {}).nome : '';
    return `<div class="cc cc-${estilo}" role="img" aria-label="Cartão ${esc(c.nome)}">
      <div class="cc-topo"><span class="cc-emissor">${emissor}</span><span class="cc-tag">${esc(tag || '')}</span></div>
      <div class="cc-chip"></div>
      <div class="cc-numero">•••• •••• •••• ${esc(c.final || '••••')}</div>
      <div class="cc-base">
        <div class="cc-info">${op.rotulo ? `<small>${esc(op.rotulo)}</small>` : ''}<strong>${op.valor !== undefined ? esc(op.valor) : esc(titular || c.nome)}</strong></div>
        <span class="cc-bandeira">${marcaBandeira(bandeiraDoCartao(c, estilo))}</span>
      </div>
    </div>`;
  }

  /* Sair, tema e "Mais" (em todas as telas). */
  document.addEventListener('DOMContentLoaded', () => {
    const sair = document.getElementById('logoutBtn');
    if (sair) sair.addEventListener('click', () => AUTH.logout());
    const mais = document.getElementById('btnMais');
    if (mais) mais.addEventListener('click', abrirMais);
    const fb = document.getElementById('formBusca');
    if (fb) fb.addEventListener('submit', (e) => { e.preventDefault(); abrirBusca(document.getElementById('campoBusca').value); });
    const cb = document.getElementById('campoBusca');
    if (cb) { cb.readOnly = true; const abrir = () => abrirBusca(''); cb.addEventListener('click', abrir); cb.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key.length === 1) { e.preventDefault(); abrirBusca(e.key.length === 1 ? e.key : ''); } }); }
    const bc = document.getElementById('btnBuscaCel');
    if (bc) bc.addEventListener('click', () => abrirBusca(''));
    const av = document.getElementById('btnAvisos');
    if (av) av.addEventListener('click', abrirAvisos);
    const tema = document.getElementById('btnTema');
    if (tema) tema.addEventListener('click', () => {
      const escuro = THEME.get() !== 'dark';
      THEME.set(escuro ? 'dark' : 'light');
      tema.innerHTML = ico(escuro ? 'sol' : 'lua');
      document.dispatchEvent(new Event('temamudou'));
    });
  });

  return { ico, sidebar, topbar, ligarMes, brl, pct, lerValor, num2, esc, toast, modal, confirmar, salvarArquivo, MENU, cartaoHTML, ESTILOS, estiloDoCartao };
})();
