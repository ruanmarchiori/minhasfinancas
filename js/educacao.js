/* Educação financeira — as duas calculadoras e as dicas da planilha, mais um retrato dos
   seus próprios números (reserva de emergência e % poupado).

   Calculadora 1: aporte A tal que  guardado·(1+r)^n + A·((1+r)^n − 1)/r = meta.
   (A planilha usava −PMT(r; n; guardado; meta), que trata o valor já guardado como dívida e
   pedia um aporte maior que o necessário.)
   Calculadora 2: n = ln((meta·r + A)/(guardado·r + A)) / ln(1+r) — igual ao NPER da planilha. */
(function () {
  function aporteNecessario(meta, n, r, guardado) {
    if (n <= 0) return NaN;
    if (r === 0) return (meta - guardado) / n;
    const f = Math.pow(1 + r, n);
    return (meta - guardado * f) * r / (f - 1);
  }
  function prazoNecessario(meta, aporte, r, guardado) {
    if (guardado >= meta) return 0;
    if (r === 0) return aporte > 0 ? (meta - guardado) / aporte : Infinity;
    const num = meta * r + aporte;
    const den = guardado * r + aporte;
    if (den <= 0 || num / den <= 0) return Infinity;
    return Math.log(num / den) / Math.log(1 + r);
  }

  function calc1() {
    const f = document.getElementById('calc1');
    const meta = UI.lerValor(f.meta.value), n = parseInt(f.prazo.value, 10) || 0;
    const r = UI.lerValor(f.taxa.value) / 100, guardado = UI.lerValor(f.guardado.value);
    const a = aporteNecessario(meta, n, r, guardado);
    const out = document.getElementById('res1'), sub = document.getElementById('res1Sub');
    if (!Number.isFinite(a)) { out.textContent = '—'; sub.textContent = 'Informe um prazo em meses.'; return; }
    if (a <= 0) { out.textContent = UI.brl(0); sub.textContent = 'Só com o rendimento do que já está guardado você chega lá.'; return; }
    out.textContent = UI.brl(a) + '/mês';
    sub.textContent = `Você vai depositar ${UI.brl(a * n)}; os juros completam ${UI.brl(Math.max(0, meta - guardado - a * n))}.`;
  }
  function calc2() {
    const f = document.getElementById('calc2');
    const meta = UI.lerValor(f.meta.value), aporte = UI.lerValor(f.aporte.value);
    const r = UI.lerValor(f.taxa.value) / 100, guardado = UI.lerValor(f.guardado.value);
    const n = prazoNecessario(meta, aporte, r, guardado);
    const out = document.getElementById('res2'), sub = document.getElementById('res2Sub');
    if (!Number.isFinite(n)) { out.textContent = '—'; sub.textContent = 'Com esse aporte a meta não é alcançada.'; return; }
    const meses = Math.ceil(n - 1e-9);
    out.textContent = `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    const anos = n / 12;
    sub.textContent = `≈ ${anos.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} anos (${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} meses exatos).`;
  }

  /* Custo de vida = média das despesas dos últimos meses que têm lançamento. */
  function seusNumeros() {
    const m = STORE.mesRef();
    const meses = [];
    for (let i = 0; i < 6; i++) meses.push(STORE.somarMes(m, -i));
    const comDados = meses.map(x => STORE.totais(x)).filter(t => t.despesas > 0);
    const custo = comDados.length ? comDados.reduce((s, t) => s + t.despesas, 0) / comDados.length : 0;
    const reserva = STORE.saldoReservaAte(m);
    const t = STORE.totais(m);
    const meta = STORE.dados.config.metaPoupanca;
    const mesesCobertos = custo ? reserva / custo : 0;
    document.getElementById('seusSub').textContent = `Base: ${STORE.nomeMes(m, true)}${comDados.length ? ` · custo de vida = média de ${comDados.length} ${comDados.length === 1 ? 'mês' : 'meses'}` : ''}`;
    const item = (rot, val, cls) => `<div class="resumo-item${cls ? ' ' + cls : ''}"><span>${rot}</span><strong>${val}</strong></div>`;
    document.getElementById('seusNumeros').innerHTML = [
      item('Custo de vida mensal', custo ? UI.brl(custo) : '—'),
      item('Reserva ideal (3 a 6 meses)', custo ? `${UI.brl(custo * 3)} a ${UI.brl(custo * 6)}` : '—'),
      item('Sua reserva hoje', UI.brl(reserva), custo && mesesCobertos >= 3 ? 'is-verde' : ''),
      item('Meses cobertos pela reserva', custo ? mesesCobertos.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '—', custo ? (mesesCobertos >= 3 ? 'is-verde' : 'is-vermelho') : ''),
      item('% poupado no mês', t.receitas ? UI.pct(t.poupado) : '—', t.receitas ? (t.poupado >= meta ? 'is-verde' : 'is-vermelho') : ''),
      item('Meta de poupança', UI.pct(meta, 0))
    ].join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calc1').addEventListener('input', calc1);
    document.getElementById('calc2').addEventListener('input', calc2);
    document.querySelectorAll('form.calc').forEach(f => f.addEventListener('submit', e => e.preventDefault()));
    calc1(); calc2(); seusNumeros();
  });
})();
