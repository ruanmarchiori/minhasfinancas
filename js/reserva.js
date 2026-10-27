/* Reserva / Poupança — aba "Reserva e Poupança" da planilha. Os meses depois do mês atual
   aparecem como projeção (mesma conta, só que ainda não aconteceu). */
(function () {
  const r = () => STORE.dados.reserva;

  function render() {
    const m = STORE.mesRef();
    const ano = STORE.anoDe(m);
    const t = STORE.tabelaReserva(ano);
    const hoje = STORE.hojeMes();
    const linhaRef = t.linhas.find(l => l.mes === m) || t.linhas[t.linhas.length - 1];

    document.getElementById('cSaldo').textContent = UI.brl(linhaRef.saldo);
    document.getElementById('cSaldoRot').textContent = `Saldo em ${STORE.nomeMes(m)}`;
    document.getElementById('cPct').textContent = UI.pct(linhaRef.pctMeta);
    document.getElementById('cPctSub').textContent = `Meta: ${UI.brl(r().meta)}`;
    document.getElementById('cAportado').textContent = UI.brl(t.aportado);
    document.getElementById('cAportadoRot').textContent = `Aportado em ${ano}`;
    document.getElementById('cRend').textContent = UI.brl(t.rendimentos);
    document.getElementById('cRendRot').textContent = `Rendimentos em ${ano}`;
    document.getElementById('anoTitulo').textContent = `Aportes de ${ano}`;
    document.getElementById('barraMeta').style.width = Math.min(100, linhaRef.pctMeta * 100) + '%';
    const falta = r().meta - linhaRef.saldo;
    document.getElementById('faltaMeta').textContent = falta > 0 ? `Faltam ${UI.brl(falta)} para a meta` : 'Meta atingida 🎉';

    const tabela = document.getElementById('tabela');
    tabela.innerHTML = `<thead><tr><th>Mês</th><th class="num">Aporte</th><th class="num">Rendimento</th><th class="num">Saldo acumulado</th><th class="num">% da meta</th></tr></thead>
      <tbody>${t.linhas.map(l => {
        const futuro = l.mes > hoje;
        return `<tr class="${futuro ? 'is-projecao' : ''}${l.mes === m ? ' is-atual' : ''}">
          <td class="col-nome">${STORE.MESES_LONGOS[Number(l.mes.slice(5)) - 1]}${futuro ? ' <span class="tag">projeção</span>' : ''}</td>
          <td class="num"><input class="input-tabela" inputmode="numeric" data-dinheiro autocomplete="off" data-mes="${l.mes}" value="${UI.num2(l.aporte)}" placeholder="0,00" aria-label="Aporte de ${STORE.nomeMes(l.mes, true)}"></td>
          <td class="num">${UI.brl(l.rendimento)}</td>
          <td class="num forte">${UI.brl(l.saldo)}</td>
          <td class="num">${UI.pct(l.pctMeta)}</td>
        </tr>`;
      }).join('')}</tbody>
      <tfoot><tr><td class="col-nome">Total do ano</td><td class="num">${UI.brl(t.aportado)}</td><td class="num">${UI.brl(t.rendimentos)}</td><td class="num forte">${UI.brl(t.saldoFinal)}</td><td class="num">${UI.pct(t.pctMeta)}</td></tr></tfoot>`;
    tabela.querySelectorAll('input[data-mes]').forEach((inp) => {
      inp.addEventListener('change', () => {
        const v = UI.lerValor(inp.value);
        if (v) r().aportes[inp.dataset.mes] = v; else delete r().aportes[inp.dataset.mes];
        STORE.salvar();
        render();
        UI.toast('Aporte salvo.');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formConfig');
    const fmt = (v) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    form.meta.value = fmt(r().meta);
    form.rendimento.value = String(Math.round(r().rendimento * 10000) / 100).replace('.', ',');
    form.meta.addEventListener('change', () => { r().meta = UI.lerValor(form.meta.value); form.meta.value = fmt(r().meta); STORE.salvar(); render(); });
    form.rendimento.addEventListener('change', () => { r().rendimento = UI.lerValor(form.rendimento.value) / 100; STORE.salvar(); render(); });
    form.addEventListener('submit', (e) => e.preventDefault());
    UI.ligarMes(render);
    render();
  });
})();
