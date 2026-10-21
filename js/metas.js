/* Metas de longo prazo — aba "Metas de Longo Prazo" da planilha. Em vez de um único campo
   "Pago adicional", cada pagamento fica registrado com data e valor. */
(function () {
  const ICONE = { Carro: '🚗', Moto: '🏍️', Casa: '🏠', Terreno: '🌳', Projeto: '🛠️', Outro: '🎯' };
  const data = (iso) => iso ? iso.split('-').reverse().join('/') : '';

  function render() {
    const t = STORE.totaisMetas();
    document.getElementById('totalValor').textContent = UI.brl(t.total);
    document.getElementById('totalSub').textContent = t.total
      ? `Pago ${UI.brl(t.pago)} · saldo devedor ${UI.brl(t.saldoDevedor)} · ${UI.pct(t.total ? t.pago / t.total : 0)} concluído`
      : '';
    const el = document.getElementById('metas');
    if (!STORE.dados.metas.length) {
      el.innerHTML = `<div class="panel cartoes-vazio"><div class="empty-state">${UI.ico('alvo')}<div><strong>Nenhuma meta cadastrada.</strong><br>Toque em “Nova meta” para começar.</div></div></div>`;
      return;
    }
    el.innerHTML = STORE.dados.metas.map((meta) => {
      const c = STORE.calcMeta(meta);
      return `<article class="panel meta-card">
        <div class="grupo-head">
          <span class="grupo-icone">${ICONE[meta.categoria] || '🎯'}</span>
          <div class="grupo-nome"><strong>${UI.esc(meta.nome)}</strong><span>${UI.esc(meta.categoria || 'Outro')}${meta.dataInicio ? ' · início ' + data(meta.dataInicio) : ''}</span></div>
          <strong class="grupo-total">${UI.pct(c.pct, 0)}</strong>
        </div>
        <div class="barra-trilho"><div class="barra-cheia is-verde" style="width:${c.pct * 100}%"></div></div>
        <dl class="meta-numeros">
          <div><dt>Valor total</dt><dd>${UI.brl(c.total)}</dd></div>
          <div><dt>Entrada</dt><dd>${UI.brl(c.entrada)}</dd></div>
          <div><dt>Financiado</dt><dd>${UI.brl(c.financiado)}</dd></div>
          <div><dt>Pago (total)</dt><dd class="txt-verde">${UI.brl(c.pago)}</dd></div>
          <div><dt>Saldo devedor</dt><dd class="forte">${UI.brl(c.saldoDevedor)}</dd></div>
          <div><dt>Pagamentos</dt><dd>${(meta.pagamentos || []).length}</dd></div>
        </dl>
        <div class="cartao-acoes">
          <button type="button" class="btn btn-lime btn-sm" data-pagar="${meta.id}">${UI.ico('mais', 'icon-sm')} Registrar pagamento</button>
          <button type="button" class="btn btn-outline btn-sm" data-historico="${meta.id}">Histórico</button>
          <button type="button" class="btn btn-outline btn-sm" data-editar="${meta.id}">${UI.ico('lapis', 'icon-sm')} Editar</button>
        </div>
      </article>`;
    }).join('');
    const achar = (id) => STORE.dados.metas.find(x => x.id === id);
    el.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => abrirForm(achar(b.dataset.editar))));
    el.querySelectorAll('[data-pagar]').forEach(b => b.addEventListener('click', () => pagar(achar(b.dataset.pagar))));
    el.querySelectorAll('[data-historico]').forEach(b => b.addEventListener('click', () => historico(achar(b.dataset.historico))));
  }

  function abrirForm(meta) {
    const novo = !meta;
    const m = meta || { id: STORE.uid('met'), nome: '', categoria: 'Projeto', valorTotal: '', entrada: '', dataInicio: '', pagamentos: [] };
    const janela = UI.modal({
      titulo: novo ? 'Nova meta' : 'Editar meta',
      html: `<form novalidate>
        <div class="form-grid">
          <label class="field field-full"><span>Meta</span><input name="nome" maxlength="60" placeholder="Ex.: Projeto energia solar" value="${UI.esc(m.nome)}"></label>
          <label class="field"><span>Categoria</span><select name="categoria">${STORE.CATEGORIAS_META.map(c => `<option${c === m.categoria ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
          <label class="field"><span>Data de início</span><input type="date" name="dataInicio" value="${m.dataInicio || ''}"></label>
          <label class="field"><span>Valor total (R$)</span><input name="valorTotal" inputmode="numeric" data-dinheiro autocomplete="off" placeholder="0,00" value="${UI.num2(m.valorTotal)}"></label>
          <label class="field"><span>Entrada (R$)</span><input name="entrada" inputmode="numeric" data-dinheiro autocomplete="off" placeholder="0,00" value="${UI.num2(m.entrada)}"></label>
        </div>
        <p class="auth-msg" data-erro></p>
        <div class="form-actions">
          ${novo ? '' : `<button type="button" class="btn btn-danger" data-excluir>${UI.ico('lixo', 'icon-sm')} Excluir</button>`}
          <div class="form-actions-right"><button type="submit" class="btn btn-lime">Salvar</button></div>
        </div>
      </form>`
    });
    const form = janela.el.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = form.nome.value.trim();
      const total = UI.lerValor(form.valorTotal.value);
      const entrada = UI.lerValor(form.entrada.value);
      const erro = form.querySelector('[data-erro]');
      if (!nome) { erro.textContent = 'Dê um nome para a meta.'; return; }
      if (!(total > 0)) { erro.textContent = 'Informe o valor total.'; return; }
      if (entrada > total) { erro.textContent = 'A entrada não pode ser maior que o valor total.'; return; }
      Object.assign(m, { nome, categoria: form.categoria.value, dataInicio: form.dataInicio.value, valorTotal: total, entrada });
      if (novo) STORE.dados.metas.push(m);
      STORE.salvar();
      janela.fechar();
      render();
    });
    const exc = form.querySelector('[data-excluir]');
    if (exc) exc.addEventListener('click', () => {
      if (!UI.confirmar(`Excluir a meta “${m.nome}” e todos os pagamentos registrados?`)) return;
      STORE.remover('metas', m.id);
      janela.fechar();
      render();
    });
  }

  function pagar(meta) {
    const c = STORE.calcMeta(meta);
    const hoje = new Date().toISOString().slice(0, 10);
    const janela = UI.modal({
      titulo: `Pagamento — ${meta.nome}`,
      html: `<form novalidate>
        <p class="nota">Saldo devedor atual: <strong>${UI.brl(c.saldoDevedor)}</strong></p>
        <div class="form-grid">
          <label class="field"><span>Valor pago (R$)</span><input name="valor" inputmode="numeric" data-dinheiro autocomplete="off" placeholder="0,00"></label>
          <label class="field"><span>Data</span><input type="date" name="data" value="${hoje}"></label>
        </div>
        <p class="auth-msg" data-erro></p>
        <div class="form-actions"><div class="form-actions-right"><button type="submit" class="btn btn-lime">Registrar</button></div></div>
      </form>`
    });
    const form = janela.el.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const valor = UI.lerValor(form.valor.value);
      if (!(valor > 0)) { form.querySelector('[data-erro]').textContent = 'Informe o valor pago.'; return; }
      meta.pagamentos = meta.pagamentos || [];
      meta.pagamentos.push({ id: STORE.uid('pag'), data: form.data.value, valor });
      STORE.salvar();
      janela.fechar();
      render();
      UI.toast(`Pagamento de ${UI.brl(valor)} registrado.`);
    });
  }

  function historico(meta) {
    const pags = [...(meta.pagamentos || [])].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
    const c = STORE.calcMeta(meta);
    const janela = UI.modal({
      titulo: `Histórico — ${meta.nome}`,
      html: `${c.entrada ? `<div class="modal-row"><div class="modal-row-info"><strong>Entrada</strong><span>${data(meta.dataInicio)}</span></div><span class="modal-row-value">${UI.brl(c.entrada)}</span></div>` : ''}
        ${pags.map(p => `<div class="modal-row"><div class="modal-row-info"><strong>Pagamento</strong><span>${data(p.data) || 'sem data'}</span></div><span class="modal-row-value">${UI.brl(p.valor)} <button type="button" class="icon-remove" data-remover="${p.id}" aria-label="Remover pagamento">${UI.ico('lixo', 'icon-sm')}</button></span></div>`).join('')}
        ${!pags.length && !c.entrada ? '<p class="nota">Nenhum pagamento registrado ainda.</p>' : ''}
        <div class="modal-total-row"><span>Total pago</span><span>${UI.brl(c.pago)}</span></div>`,
      largo: false
    });
    janela.el.querySelectorAll('[data-remover]').forEach(b => b.addEventListener('click', () => {
      if (!UI.confirmar('Remover este pagamento?')) return;
      meta.pagamentos = meta.pagamentos.filter(p => p.id !== b.dataset.remover);
      STORE.salvar();
      janela.fechar();
      render();
      historico(meta);
    }));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnNovo').addEventListener('click', () => abrirForm(null));
    render();
  });
})();
