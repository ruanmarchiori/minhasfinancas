/* Visão geral — equivale ao Dashboard da planilha, no layout da referência: saldo, resumo do
   mês, nota de saúde, fluxo de caixa, gastos por categoria, cartões e últimas transações. */
(function () {
  const $ = (id) => document.getElementById(id);
  const CORES = ['#145c37', '#1f8a52', '#5fb98a', '#a9dbbb', '#cfe9d8', '#86938b'];
  let iCartao = 0;
  const dm = (iso) => (iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '');
  const variacao = (atual, ant) => (ant ? (atual - ant) / Math.abs(ant) : null);
  const txtVar = (v) => (v === null ? '' : `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(0)}% vs mês anterior`);

  function saldo(m) {
    const serie = STORE.serieAno(STORE.anoDe(m));
    const ate = serie.filter(x => x.mes <= m);
    const acumulado = ate.length ? ate[ate.length - 1].acumulado : 0;
    $('saldoAno').textContent = UI.brl(acumulado);
    $('saldoAnoSub').textContent = `Sobra acumulada de Jan a ${STORE.MESES_CURTOS[Number(m.slice(5)) - 1]} · reserva ${UI.brl(STORE.saldoReservaAte(m))}`;
  }

  function resumo(m) {
    const t = STORE.totais(m), a = STORE.totais(STORE.somarMes(m, -1));
    $('resumoMes').textContent = STORE.nomeMes(m, true);
    $('mcReceitas').textContent = UI.brl(t.receitas);
    $('mcReceitasSub').textContent = txtVar(variacao(t.receitas, a.receitas)) || 'receitas do mês';
    $('mcDespesas').textContent = UI.brl(t.despesas);
    const cartao = STORE.dados.cartoes.reduce((s, c) => s + STORE.gastosNaForma(c.id, m), 0);
    $('mcDespesasSub').textContent = `${UI.brl(cartao)} no cartão`;
    $('mcSobraRot').textContent = t.saldo >= 0 ? 'Sobrou' : 'Faltou';
    $('mcSobra').textContent = UI.brl(Math.abs(t.saldo));
    $('mcSobraSub').textContent = t.receitas ? `${UI.pct(Math.abs(t.poupado), 0)} da receita` : '—';
    document.querySelector('.mc-sobra').classList.toggle('is-negativo', t.saldo < 0);
  }

  function saude(m) {
    const n = STORE.notaSaude(m);
    $('saudeNota').textContent = n.nota;
    const nv = $('saudeNivel');
    nv.textContent = n.nivel;
    nv.className = 'saude-nivel n-' + n.nivel.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    $('saudeBarra').style.width = n.nota + '%';
    $('saudeBarra').style.background = n.nota >= 60 ? 'var(--azul)' : n.nota >= 40 ? 'var(--alerta)' : 'var(--vermelho)';
    $('saudeDica').textContent = n.dicas.length ? 'Para subir a nota: ' + n.dicas.slice(0, 2).join(' · ') + '.' : 'Tudo certo por aqui. Continue assim!';
    $('saudeDica').title = n.itens.map(i => `${i.nome}: ${Math.round(i.pts)}/${i.max}`).join('\n');
  }

  /* Barras para cima (receitas) e para baixo (despesas), últimos 6 meses. */
  function fluxo(m) {
    const meses = [];
    for (let i = 5; i >= 0; i--) meses.push(STORE.somarMes(m, -i));
    const ts = meses.map(x => STORE.totais(x));
    const topo = Math.max(1, ...ts.map(t => Math.max(t.receitas, t.despesas)));
    $('fluxo').innerHTML = meses.map((x, i) => `<button type="button" class="fluxo-mes${x === m ? ' is-atual' : ''}" data-mes="${x}" title="${STORE.nomeMes(x, true)}: receitas ${UI.brl(ts[i].receitas)} · despesas ${UI.brl(ts[i].despesas)}">
      <span class="fluxo-cima"><i style="height:${(ts[i].receitas / topo) * 100}%"></i></span>
      <span class="fluxo-baixo"><i style="height:${(ts[i].despesas / topo) * 100}%"></i></span>
      <small>${STORE.MESES_CURTOS[Number(x.slice(5)) - 1]}</small></button>`).join('');
    $('fluxo').querySelectorAll('[data-mes]').forEach(b => b.addEventListener('click', () => {
      STORE.setMesRef(b.dataset.mes);
      $('mesTexto').textContent = STORE.nomeMes(b.dataset.mes, true);
      $('mesInput').value = b.dataset.mes;
      render(b.dataset.mes);
    }));
  }

  /* Rosca de gastos por categoria. */
  function gastos(m) {
    const lista = STORE.porCategoria(m);
    const total = lista.reduce((s, c) => s + c.valor, 0);
    const top = lista.slice(0, 4);
    const resto = lista.slice(4).reduce((s, c) => s + c.valor, 0);
    if (resto > 0) top.push({ nome: 'Outras categorias', valor: resto, pct: total ? resto / total : 0 });
    $('gastosSub').textContent = UI.brl(total);
    $('roscaPct').textContent = lista.length ? UI.pct(lista[0].pct, 1) : '—';
    const r = 46, circ = 2 * Math.PI * r;
    let acc = 0;
    const fatias = top.map((c, i) => {
      const len = total ? (c.valor / total) * circ : 0;
      const gap = top.length > 1 ? 2.2 : 0;
      const seg = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${CORES[i % CORES.length]}" stroke-width="16" stroke-dasharray="${Math.max(0, len - gap)} ${circ}" stroke-dashoffset="${-acc}" transform="rotate(-90 60 60)"/>`;
      acc += len;
      return seg;
    });
    $('rosca').innerHTML = `<circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--painel-2)" stroke-width="16"/>` + fatias.join('');
    $('roscaLegenda').innerHTML = top.length ? top.map((c, i) => `<li><i style="background:${CORES[i % CORES.length]}"></i><span>${UI.esc(c.nome)}</span><strong>${UI.brl(c.valor)}</strong></li>`).join('') : '<li class="vazio-curto">Sem gastos neste mês.</li>';
  }

  /* Cartão em destaque + faturas (anterior, atual, próxima) + últimas compras. */
  function cartoes(m) {
    const lista = STORE.dados.cartoes;
    const slot = $('cartaoSlot'), info = $('cartaoInfo');
    $('cartaoAnt').hidden = $('cartaoProx').hidden = lista.length < 2;
    if (!lista.length) {
      slot.innerHTML = UI.cartaoHTML({ nome: 'Seu cartão', estilo: 'verde' }, { rotulo: 'Nenhum cartão', valor: 'Cadastre em Cartões' });
      info.innerHTML = '';
      return;
    }
    iCartao = (iCartao + lista.length) % lista.length;
    const c = lista[iCartao];
    const u = STORE.usoLimite(c);
    slot.innerHTML = `<a href="cartoes.html">${UI.cartaoHTML(c, { rotulo: 'Em aberto', valor: UI.brl(STORE.saldoFatura(c.id, m)) })}</a>`;
    const NOME = { aberta: 'Aberta', fechada: 'Fechada', vencida: 'Vencida', paga: 'Paga', vazia: '—' };
    const faturas = [-1, 0, 1].map(i => STORE.somarMes(m, i));
    const compras = STORE.dados.lancamentos.filter(l => l.forma === c.id && STORE.ehDespesa(l) && l.mes <= STORE.somarMes(m, 1))
      .sort((a, b) => (b.dataCompra || b.mes).localeCompare(a.dataCompra || a.mes) || (b.criadoEm || '').localeCompare(a.criadoEm || '')).slice(0, 4);
    info.innerHTML = `
      <div class="cartao-resumo">
        <div><span>Vencimento</span><strong>${STORE.temCiclo(c) ? dm(STORE.vencimentoFatura(c, m)) : '—'}</strong></div>
        <div><span>Limite livre</span><strong class="${u.disponivel < 0 ? 'txt-vermelho' : ''}">${c.limite ? UI.brl(u.disponivel) : 'Sem limite'}</strong></div>
      </div>
      <div class="sub-titulo">Faturas</div>
      <ul class="faturas-mini">${faturas.map(f => { const st = STORE.statusFatura(c, f); return `<li><span>${STORE.nomeMes(f)}</span><span class="status-fatura st-${st}">${NOME[st]}</span><strong>${UI.brl(STORE.fatura(c.id, f))}</strong></li>`; }).join('')}</ul>
      <div class="sub-titulo">Últimas compras</div>
      <ul class="compras-mini">${compras.length ? compras.map(l => `<li><span><strong>${UI.esc(l.descricao || '(sem descrição)')}</strong><small>${l.dataCompra ? dm(l.dataCompra) + '/' + l.dataCompra.slice(0, 4) : STORE.nomeMes(l.mes)}${l.parcela ? ` · ${l.parcela.n}/${l.parcela.de}` : ''}</small></span><strong>−${UI.brl(l.valor)}</strong></li>`).join('') : '<li class="vazio-curto">Nenhuma compra lançada.</li>'}</ul>`;
  }

  function ultimos(m) {
    const lista = STORE.dados.lancamentos.filter(l => l.mes <= m)
      .sort((a, b) => b.mes.localeCompare(a.mes) || (b.criadoEm || '').localeCompare(a.criadoEm || '')).slice(0, 6);
    $('ultimos').innerHTML = lista.length ? lista.map((l) => {
      const rec = l.tipo === 'receita';
      const c = rec ? null : STORE.categoria(l.categoria);
      const p = rec ? STORE.pessoa(l.pessoa) : null;
      const naFatura = !rec && STORE.cartao(l.forma);
      const titulo = l.descricao || (rec ? l.tipoReceita : (c ? c.nome : 'Gasto'));
      const sub = [rec ? (p ? p.nome : 'Receita') : (c ? c.nome : ''), !rec && STORE.nomeForma(l.forma) !== '—' ? STORE.nomeForma(l.forma) : ''].filter(Boolean).join(' · ');
      const data = l.dataCompra ? `${dm(l.dataCompra)}/${l.dataCompra.slice(0, 4)}` : (l.dia ? `${String(l.dia).padStart(2, '0')}/${l.mes.slice(5)}/${l.mes.slice(0, 4)}` : STORE.nomeMes(l.mes));
      return `<li><span class="ultimo-icone${rec ? ' is-receita' : ' is-despesa'}">${rec ? '↓' : '↑'}</span>
        <span class="ultimo-info"><strong>${UI.esc(titulo)}</strong><span>${naFatura ? '<span class="tag tag-fatura">Na fatura</span>' : ''}${l.parcela ? `<span class="tag">${l.parcela.n}/${l.parcela.de}</span>` : ''}${UI.esc(sub)}</span></span>
        <span class="ultimo-lado"><span class="ultimo-valor${rec ? ' is-receita' : ' is-despesa'}">${rec ? '+' : '−'}${UI.brl(l.valor)}</span><small>${data}</small></span></li>`;
    }).join('') : '<li class="vazio-curto">Nada lançado ainda.</li>';
  }

  function resumoAno(m) {
    const ano = STORE.anoDe(m);
    const r = STORE.resumoAno(ano);
    $('tituloResumo').textContent = `Resumo anual ${ano}`;
    const item = (rot, v, cls) => `<div class="resumo-item${cls ? ' ' + cls : ''}"><span>${rot}</span><strong>${UI.brl(v)}</strong></div>`;
    $('resumoAno').innerHTML = [
      item('Salário fixo (ano)', r.salario), item('Renda variável (ano)', r.rendaVariavel), item('Total de receitas', r.receitas, 'is-verde'),
      item('Gastos fixos', r.fixos), item('Gastos variáveis', r.variaveis), item('Total de despesas', r.despesas, 'is-vermelho'),
      item('Sobra anual', r.sobra, r.sobra >= 0 ? 'is-destaque' : 'is-vermelho'), item('Total em metas', r.totalMetas), item('Pago em metas', r.pagoMetas)
    ].join('');
  }

  function render(m) {
    const fechar = STORE.anoParaFechar();
    $('avisoAno').hidden = !fechar;
    if (fechar) { $('avisoAnoTitulo').textContent = `${fechar} terminou — hora de fechar o ano.`; $('avisoAnoBtn').textContent = `Fechar ${fechar}`; }
    $('avisoVazio').hidden = STORE.doMes(m).length > 0;
    saldo(m); resumo(m); saude(m); fluxo(m); gastos(m); cartoes(m); ultimos(m); resumoAno(m);
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('cartaoAnt').addEventListener('click', () => { iCartao--; cartoes(STORE.mesRef()); });
    $('cartaoProx').addEventListener('click', () => { iCartao++; cartoes(STORE.mesRef()); });
    UI.ligarMes(render);
    render(STORE.mesRef());
  });
})();
