/* Painel — equivale à aba Dashboard da planilha, para o mês de referência escolhido. */
(function () {
  const CORES = ['#d7fb3d', '#5b8def', '#ef5b5b', '#f5a623', '#2fbf6a', '#a46bf0', '#3cc8c8', '#ff8ac2', '#8b8c96'];
  let graficoAno = null;
  let graficoCat = null;

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  function cards(m) {
    const t = STORE.totais(m);
    const meta = STORE.dados.config.metaPoupanca;
    document.getElementById('cSaldo').textContent = UI.brl(t.saldo);
    const anterior = STORE.totais(STORE.somarMes(m, -1)).saldo;
    document.getElementById('cSaldoSub').textContent = t.receitas || t.despesas
      ? (t.saldo >= 0 ? 'Sobrou dinheiro no mês' : 'Gastou mais do que recebeu')
      : (anterior ? `Mês anterior: ${UI.brl(anterior)}` : '');
    document.getElementById('cReceitas').textContent = UI.brl(t.receitas);
    document.getElementById('cDespesas').textContent = UI.brl(t.despesas);
    document.getElementById('cDespesasSub').textContent = `Fixos ${UI.brl(t.fixos)} · Variáveis ${UI.brl(t.variaveis)}`;
    document.getElementById('cPoupado').textContent = t.receitas ? UI.pct(t.poupado) : '—';
    const sub = document.getElementById('cPoupadoSub');
    sub.textContent = `Meta recomendada: ${UI.pct(meta, 0)}`;
    sub.className = 'stat-sub' + (t.receitas ? (t.poupado >= meta ? ' is-ok' : ' is-pending') : '');
    document.getElementById('avisoVazio').hidden = STORE.doMes(m).length > 0;
  }

  function graficoDoAno(m) {
    const ano = STORE.anoDe(m);
    const serie = STORE.serieAno(ano);
    document.getElementById('tituloAno').textContent = `Receitas x despesas — ${ano}`;
    const texto = css('--gray-500');
    const grade = css('--gray-100');
    const dados = {
      labels: STORE.MESES_CURTOS,
      datasets: [
        { type: 'bar', label: 'Receitas', data: serie.map(s => s.receitas), backgroundColor: '#2fbf6a', borderRadius: 6, maxBarThickness: 18 },
        { type: 'bar', label: 'Despesas', data: serie.map(s => s.despesas), backgroundColor: '#ef5b5b', borderRadius: 6, maxBarThickness: 18 },
        { type: 'line', label: 'Saldo acumulado', data: serie.map(s => s.acumulado), borderColor: css('--ink'), backgroundColor: css('--ink'), pointRadius: 2.5, tension: .3, borderWidth: 2 }
      ]
    };
    const opcoes = {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: texto, boxWidth: 10, boxHeight: 10, usePointStyle: true, font: { size: 11 } } },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${UI.brl(c.parsed.y)}` } }
      },
      scales: {
        x: { ticks: { color: texto, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: texto, font: { size: 10 }, callback: (v) => v.toLocaleString('pt-BR', { notation: 'compact' }) }, grid: { color: grade } }
      },
      onClick: (e, els) => {
        if (!els.length) return;
        STORE.setMesRef(serie[els[0].index].mes);
        location.reload();
      }
    };
    if (graficoAno) { graficoAno.data = dados; graficoAno.options = opcoes; graficoAno.update(); }
    else graficoAno = new Chart(document.getElementById('graficoAno'), { data: dados, options: opcoes });
  }

  function categorias(m) {
    const lista = STORE.porCategoria(m);
    const total = lista.reduce((s, c) => s + c.valor, 0);
    /* Até 7 fatias; o resto vira "Outras". */
    const top = lista.slice(0, 7);
    const resto = lista.slice(7).reduce((s, c) => s + c.valor, 0);
    if (resto > 0) top.push({ nome: 'Outras', icone: '•', valor: resto, pct: total ? resto / total : 0 });

    const forte = document.getElementById('donutTotal');
    forte.textContent = UI.brl(total);
    forte.className = UI.brl(total).length > 12 ? 'is-xlong' : UI.brl(total).length > 10 ? 'is-long' : '';
    document.getElementById('catSub').textContent = lista.length ? `${lista.length} categoria${lista.length > 1 ? 's' : ''}` : '';
    document.getElementById('legendaCategorias').innerHTML = top.length
      ? top.map((c, i) => `<div class="legend-item"><span class="legend-dot" style="background:${CORES[i % CORES.length]}"></span><span class="legend-nome">${UI.esc(c.icone)} ${UI.esc(c.nome)}</span><span class="legend-pct">${UI.pct(c.pct, 0)}</span><strong>${UI.brl(c.valor)}</strong></div>`).join('')
      : '<p class="vazio-curto">Sem gastos neste mês.</p>';

    const dados = {
      labels: top.map(c => c.nome),
      datasets: [{ data: top.length ? top.map(c => c.valor) : [1], backgroundColor: top.length ? top.map((_, i) => CORES[i % CORES.length]) : [css('--gray-100')], borderWidth: 0, hoverOffset: 4 }]
    };
    const opcoes = { cutout: '72%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: !!top.length, callbacks: { label: (c) => `${c.label}: ${UI.brl(c.parsed)} (${UI.pct(top[c.dataIndex].pct, 0)})` } } } };
    if (graficoCat) { graficoCat.data = dados; graficoCat.options = opcoes; graficoCat.update(); }
    else graficoCat = new Chart(document.getElementById('graficoCategorias'), { type: 'doughnut', data: dados, options: opcoes });
  }

  /* Cartões (fatura e % do limite) + Pix/Dinheiro/Débito. */
  function formas(m) {
    const linhas = STORE.dados.cartoes.map((c) => {
      const f = STORE.fatura(c.id, m);
      const uso = c.limite > 0 ? f / c.limite : 0;
      return `<div class="barra-item">
        <div class="barra-topo"><span>${UI.ico('cartao', 'icon-sm')} ${UI.esc(c.nome)}</span><strong>${UI.brl(f)}</strong></div>
        <div class="barra-trilho"><div class="barra-cheia${uso > .8 ? ' is-alerta' : ''}" style="width:${Math.min(100, uso * 100)}%"></div></div>
        <div class="barra-rodape">${c.limite > 0 ? `${UI.pct(uso)} do limite de ${UI.brl(c.limite)}` : 'Sem limite cadastrado'}${c.vencimento ? ` · vence dia ${c.vencimento}` : ''}</div>
      </div>`;
    });
    STORE.FORMAS_FIXAS.forEach((f) => {
      const v = STORE.gastosNaForma(f.id, m);
      if (v || f.id !== 'debito') linhas.push(`<div class="barra-item is-simples"><div class="barra-topo"><span>${UI.esc(f.nome)}</span><strong>${UI.brl(v)}</strong></div></div>`);
    });
    const semForma = STORE.gastosNaForma('', m) + STORE.doMes(m).filter(l => STORE.ehDespesa(l) && l.forma === undefined).reduce((s, l) => s + l.valor, 0);
    if (semForma) linhas.push(`<div class="barra-item is-simples"><div class="barra-topo"><span>Sem forma informada</span><strong>${UI.brl(semForma)}</strong></div></div>`);
    document.getElementById('listaFormas').innerHTML = (STORE.dados.cartoes.length ? '' : '<p class="vazio-curto">Nenhum cartão cadastrado. <a href="cartoes.html">Cadastrar</a></p>') + linhas.join('');
  }

  function pessoas(m) {
    const lista = STORE.porPessoa(m);
    const total = lista.reduce((s, p) => s + p.total, 0);
    document.getElementById('listaPessoas').innerHTML = lista.map(p => `
      <div class="barra-item">
        <div class="barra-topo"><span><span class="mini-avatar">${UI.esc(p.nome.slice(0, 1).toUpperCase())}</span> ${UI.esc(p.nome)}</span><strong>${UI.brl(p.total)}</strong></div>
        <div class="barra-trilho"><div class="barra-cheia is-verde" style="width:${total ? p.pct * 100 : 0}%"></div></div>
        <div class="barra-rodape">Fixa ${UI.brl(p.fixa)} · Variável ${UI.brl(p.variavel)} · ${UI.pct(p.pct, 0)} da renda da casa</div>
      </div>`).join('') + `<div class="total-linha"><span>Total da casa</span><strong>${UI.brl(total)}</strong></div>`;
  }

  function resumo(m) {
    const ano = STORE.anoDe(m);
    const r = STORE.resumoAno(ano);
    document.getElementById('tituloResumo').textContent = `Resumo anual ${ano}`;
    const item = (rot, v, cls) => `<div class="resumo-item${cls ? ' ' + cls : ''}"><span>${rot}</span><strong>${UI.brl(v)}</strong></div>`;
    document.getElementById('resumoAno').innerHTML = [
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
    cards(m); graficoDoAno(m); categorias(m); formas(m); pessoas(m); resumo(m);
  }

  document.addEventListener('DOMContentLoaded', () => {
    UI.ligarMes(render);
    render(STORE.mesRef());
  });
})();
