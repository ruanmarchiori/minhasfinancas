/* Painel — equivale à aba Dashboard da planilha, para o mês de referência escolhido.
   Gráficos desenhados direto em HTML/SVG (barras em pílula, medidor meia-lua). */
(function () {
  let cartaoAtual = 0;
  const $ = (id) => document.getElementById(id);

  /* ----- Saldo do mês: valor, minigráfico de 6 meses, variação e pílulas de despesas ----- */
  function saldo(m) {
    const t = STORE.totais(m);
    $('saldo').textContent = UI.brl(t.saldo);
    $('saldoSub').textContent = t.receitas || t.despesas ? (t.saldo >= 0 ? 'sobrou no mês' : 'gastou mais do que recebeu') : 'receitas − despesas';

    const meses = [];
    for (let i = 5; i >= 0; i--) meses.push(STORE.somarMes(m, -i));
    const saldos = meses.map(x => STORE.totais(x).saldo);
    const min = Math.min(...saldos), max = Math.max(...saldos);
    const pts = saldos.map((v, i) => `${(i / 5) * 66 + 2},${max === min ? 13 : 23 - ((v - min) / (max - min)) * 20}`).join(' ');
    $('sparkline').innerHTML = `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

    const ant = STORE.totais(STORE.somarMes(m, -1)).saldo;
    const v = $('variacao');
    if (ant && (t.receitas || t.despesas)) {
      const p = (t.saldo - ant) / Math.abs(ant);
      v.className = 'variacao ' + (p >= 0 ? 'is-alta' : 'is-baixa');
      v.innerHTML = `<i>${p >= 0 ? '↑' : '↓'}</i>${UI.pct(Math.abs(p), 0)}`;
    } else {
      v.className = 'variacao';
      v.innerHTML = '<i>–</i>sem comparação';
    }

    const ult = [];
    for (let i = 4; i >= 0; i--) ult.push(STORE.somarMes(m, -i));
    const desp = ult.map(x => STORE.totais(x).despesas);
    const topo = Math.max(...desp, 1);
    $('pilulasDespesas').innerHTML = ult.map((x, i) => `<div class="pilula-col${x === m ? ' is-atual' : ''}" title="Despesas de ${STORE.nomeMes(x, true)}: ${UI.brl(desp[i])}">
      <div class="pilula-barra" style="height:${Math.max(10, (desp[i] / topo) * 78)}%"></div><span>${STORE.MESES_CURTOS[Number(x.slice(5)) - 1]}</span></div>`).join('');
  }

  /* ----- Cartão em destaque (carrossel) + Pix/Dinheiro/Débito ----- */
  function cartoes(m) {
    const lista = STORE.dados.cartoes;
    const el = $('carrossel');
    if (!lista.length) {
      el.innerHTML = UI.cartaoHTML({ nome: 'Seu cartão', estilo: 'azul' }, { rotulo: 'Nenhum cartão', valor: 'Cadastre em Cartões' });
      return;
    }
    /* Começa pelo cartão com a maior fatura do mês. */
    const ordem = [...lista].sort((a, b) => STORE.fatura(b.id, m) - STORE.fatura(a.id, m));
    if (cartaoAtual >= ordem.length) cartaoAtual = 0;
    const c = ordem[cartaoAtual];
    const f = STORE.fatura(c.id, m);
    el.innerHTML = `<a href="cartoes.html" aria-label="Abrir cartões">${UI.cartaoHTML(c, { rotulo: `Fatura de ${STORE.nomeMes(m)}`, valor: UI.brl(f) })}</a>
      ${c.limite ? `<div class="cartao-uso"><div class="cartao-uso-topo"><span>${UI.pct(f / c.limite)} do limite</span><span>${UI.brl(c.limite - f)} livre</span></div><div class="barra-trilho"><div class="barra-cheia${f / c.limite > .8 ? ' is-alerta' : ''}" style="width:${Math.min(100, (f / c.limite) * 100)}%"></div></div></div>` : ''}
      ${ordem.length > 1 ? `<div class="cc-pontos">${ordem.map((x, i) => `<button type="button" class="${i === cartaoAtual ? 'ativo' : ''}" data-i="${i}" aria-label="Ver ${UI.esc(x.nome)}"></button>`).join('')}</div>` : ''}`;
    el.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { cartaoAtual = Number(b.dataset.i); cartoes(m); }));
  }

  /* ----- Medidor: quanto da renda foi para fixos, variáveis e o que sobrou ----- */
  function arco(ini, fim, cor) {
    /* Meia-lua de 180° a 0° (raio 90, centro 110,112); ini/fim em fração 0..1. */
    const ang = (f) => Math.PI * (1 - f);
    const p = (f) => [110 + 90 * Math.cos(ang(f)), 112 - 90 * Math.sin(ang(f))];
    const [x1, y1] = p(ini), [x2, y2] = p(fim);
    return `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)} A90 90 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}" fill="none" stroke="${cor}" stroke-width="20" stroke-linecap="round"/>`;
  }
  function medidor(m) {
    const t = STORE.totais(m);
    const base = Math.max(t.receitas, t.despesas);
    const partes = [
      { nome: 'Gastos fixos', valor: t.fixos, cor: 'var(--azul)' },
      { nome: 'Gastos variáveis', valor: t.variaveis, cor: 'var(--amarelo)' },
      { nome: t.saldo >= 0 ? 'Sobra' : 'Faltou', valor: Math.abs(t.saldo), cor: t.saldo >= 0 ? 'var(--rosa)' : 'var(--vermelho)' }
    ];
    $('legendaMedidor').innerHTML = partes.map(p => `<span><i style="background:${p.cor}"></i>${p.nome}${base ? ' · ' + UI.pct(p.valor / base, 0) : ''}</span>`).join('');
    let svg = arco(0, 1, 'var(--painel-2)');
    if (base) {
      let ini = 0;
      const gap = 0.025;
      const total = t.saldo >= 0 ? t.receitas : t.despesas;
      partes.filter(p => p.valor > 0).forEach((p) => {
        const fr = p.valor / total;
        const fim = Math.min(1, ini + fr);
        if (fim - ini > gap * 1.2) svg += arco(ini + gap / 2, fim - gap / 2, p.cor);
        ini = fim;
      });
    }
    $('medidor').innerHTML = svg;
    $('medidorValor').textContent = t.receitas ? UI.pct(t.poupado, 0) : '—';
    const meta = STORE.dados.config.metaPoupanca;
    $('medidorRotulo').textContent = t.receitas ? (t.poupado >= meta ? `poupado · meta ${UI.pct(meta, 0)} ✓` : `poupado · meta ${UI.pct(meta, 0)}`) : 'sem receitas no mês';
  }

  /* ----- Últimos lançamentos do mês ----- */
  function ultimos(m) {
    const lista = STORE.doMes(m).sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || '') || (b.dia || 0) - (a.dia || 0)).slice(0, 6);
    $('ultimos').innerHTML = lista.length ? lista.map((l) => {
      const receita = l.tipo === 'receita';
      const c = receita ? null : STORE.categoria(l.categoria);
      const p = receita ? STORE.pessoa(l.pessoa) : null;
      const titulo = l.descricao || (receita ? l.tipoReceita : (c ? c.nome : 'Gasto'));
      const sub = [receita ? (p ? p.nome : 'Receita') : (c ? c.nome : ''), l.dia ? `${String(l.dia).padStart(2, '0')}/${l.mes.slice(5)}` : STORE.nomeMes(l.mes)].filter(Boolean).join(' · ');
      return `<li><span class="ultimo-icone">${receita ? '💰' : UI.esc(c ? c.icone : '•')}</span>
        <span class="ultimo-info"><strong>${UI.esc(titulo)}</strong><span>${UI.esc(sub)}</span></span>
        <span class="ultimo-valor${receita ? ' is-receita' : ''}">${receita ? '+' : ''}${UI.brl(l.valor)}</span></li>`;
    }).join('') : '<li class="vazio-curto">Nada lançado neste mês.</li>';
  }

  /* ----- Despesas & receitas + formas de pagamento + reserva ----- */
  function despesasReceitas(m) {
    const t = STORE.totais(m);
    const gasto = t.receitas ? t.despesas / t.receitas : 0;
    $('pctDespesas').textContent = t.receitas ? UI.pct(gasto, 0) : '—';
    $('pctSobra').textContent = t.receitas ? UI.pct(Math.max(0, 1 - gasto), 0) : '—';
    $('drSub').textContent = `${UI.brl(t.despesas)} de ${UI.brl(t.receitas)}`;
    const a = t.receitas ? Math.min(1, gasto) : .5;
    $('drBarras').innerHTML = `<i style="flex:${a};background:${gasto > 1 ? 'var(--vermelho)' : 'var(--azul)'}"></i><i style="flex:${Math.max(0.02, 1 - a)};background:var(--amarelo)"></i>`;

    $('formas').innerHTML = STORE.FORMAS_FIXAS.map((f) => {
      const v = STORE.gastosNaForma(f.id, m);
      return f.id === 'debito' && !v ? '' : `<div class="barra-item is-simples"><div class="barra-topo"><span>${UI.esc(f.nome)}</span><strong>${UI.brl(v)}</strong></div></div>`;
    }).join('');

    const r = STORE.dados.reserva;
    const saldoRes = STORE.saldoReservaAte(m);
    $('reservaValor').textContent = `Reserva: ${UI.brl(saldoRes)}`;
    $('reservaSub').textContent = r.meta ? `${UI.pct(saldoRes / r.meta)} da meta de ${UI.brl(r.meta)}` : 'Defina uma meta';
  }

  function categorias(m) {
    const lista = STORE.porCategoria(m);
    const topo = lista.length ? lista[0].valor : 1;
    $('catSub').textContent = lista.length ? `${lista.length} categoria${lista.length > 1 ? 's' : ''}` : '';
    $('categorias').innerHTML = lista.length ? lista.slice(0, 6).map(c => `
      <div class="barra-item">
        <div class="barra-topo"><span>${UI.esc(c.icone)} ${UI.esc(c.nome)}</span><strong>${UI.brl(c.valor)}</strong></div>
        <div class="barra-trilho"><div class="barra-cheia" style="width:${(c.valor / topo) * 100}%"></div></div>
        <div class="barra-rodape">${UI.pct(c.pct)} das despesas</div>
      </div>`).join('') + (lista.length > 6 ? `<p class="vazio-curto">+ ${lista.length - 6} outras categorias</p>` : '')
      : '<p class="vazio-curto">Sem gastos neste mês.</p>';
  }

  function pessoas(m) {
    const lista = STORE.porPessoa(m);
    const total = lista.reduce((s, p) => s + p.total, 0);
    $('pessoas').innerHTML = lista.map(p => `
      <div class="barra-item">
        <div class="barra-topo"><span><span class="mini-avatar">${UI.esc(p.nome.slice(0, 1).toUpperCase())}</span> ${UI.esc(p.nome)}</span><strong>${UI.brl(p.total)}</strong></div>
        <div class="barra-trilho"><div class="barra-cheia is-verde" style="width:${total ? p.pct * 100 : 0}%"></div></div>
        <div class="barra-rodape">Fixa ${UI.brl(p.fixa)} · Variável ${UI.brl(p.variavel)} · ${UI.pct(p.pct, 0)} da renda da casa</div>
      </div>`).join('') + `<div class="total-linha"><span>Total da casa</span><strong>${UI.brl(total)}</strong></div>`;
  }

  function graficoAno(m) {
    const ano = STORE.anoDe(m);
    const serie = STORE.serieAno(ano);
    $('tituloAno').textContent = `Receitas x despesas — ${ano}`;
    const topo = Math.max(1, ...serie.map(s => Math.max(s.receitas, s.despesas)));
    const el = $('graficoAno');
    el.innerHTML = serie.map((s, i) => `<button type="button" class="ano-mes${s.mes === m ? ' is-atual' : ''}" data-mes="${s.mes}" title="${STORE.nomeMes(s.mes, true)} — receitas ${UI.brl(s.receitas)}, despesas ${UI.brl(s.despesas)}">
      <div class="ano-par"><i class="r" style="height:${(s.receitas / topo) * 100}%"></i><i class="d" style="height:${(s.despesas / topo) * 100}%"></i></div>
      <span>${STORE.MESES_CURTOS[i]}</span></button>`).join('');
    el.querySelectorAll('[data-mes]').forEach(b => b.addEventListener('click', () => {
      STORE.setMesRef(b.dataset.mes);
      $('mesTexto').textContent = STORE.nomeMes(b.dataset.mes, true);
      $('mesInput').value = b.dataset.mes;
      render(b.dataset.mes);
    }));
  }

  function resumo(m) {
    const ano = STORE.anoDe(m);
    const r = STORE.resumoAno(ano);
    $('tituloResumo').textContent = `Resumo anual ${ano}`;
    const item = (rot, v, cls) => `<div class="resumo-item${cls ? ' ' + cls : ''}"><span>${rot}</span><strong>${UI.brl(v)}</strong></div>`;
    $('resumoAno').innerHTML = [
      item('Salário fixo (ano)', r.salario),
      item('Renda variável (ano)', r.rendaVariavel),
      item('Total de receitas', r.receitas, 'is-verde'),
      item('Gastos fixos', r.fixos),
      item('Gastos variáveis', r.variaveis),
      item('Total de despesas', r.despesas, 'is-vermelho'),
      item('Sobra anual', r.sobra, r.sobra >= 0 ? 'is-destaque' : 'is-vermelho'),
      item('Total em metas', r.totalMetas),
      item('Pago em metas', r.pagoMetas)
    ].join('');
  }

  function render(m) {
    $('avisoVazio').hidden = STORE.doMes(m).length > 0;
    saldo(m); cartoes(m); medidor(m); ultimos(m); despesasReceitas(m); categorias(m); pessoas(m); graficoAno(m); resumo(m);
  }

  document.addEventListener('DOMContentLoaded', () => {
    UI.ligarMes(render);
    render(STORE.mesRef());
  });
})();
