/* Cartões de crédito — equivale à aba "Cartões de Crédito" da planilha:
   fatura do mês = gastos lançados com o cartão (automático) + ajuste manual. */
(function () {
  function renderCartoes(m) {
    const el = document.getElementById('cartoes');
    const cartoes = STORE.dados.cartoes;
    const totalFaturas = cartoes.reduce((s, c) => s + STORE.fatura(c.id, m), 0);
    const limites = cartoes.reduce((s, c) => s + (Number(c.limite) || 0), 0);
    document.getElementById('totalRotulo').textContent = `Faturas — ${STORE.nomeMes(m, true)}`;
    document.getElementById('totalValor').textContent = UI.brl(totalFaturas);
    document.getElementById('totalSub').textContent = limites ? `${UI.pct(totalFaturas / limites)} do limite total de ${UI.brl(limites)}` : '';

    if (!cartoes.length) {
      el.innerHTML = `<div class="panel cartoes-vazio"><div class="empty-state">${UI.ico('cartao')}<div><strong>Nenhum cartão cadastrado.</strong><br>Cadastre os cartões para ver fatura e limite de cada um.</div></div></div>`;
      return;
    }
    el.innerHTML = cartoes.map((c) => {
      const auto = STORE.gastosNaForma(c.id, m);
      const ajuste = STORE.ajusteFatura(c.id, m);
      const fat = auto + ajuste;
      const uso = c.limite > 0 ? fat / c.limite : 0;
      return `<article class="cartao-card">
        ${UI.cartaoHTML(c, { rotulo: `Fatura de ${STORE.nomeMes(m)}`, valor: UI.brl(fat) })}
        <div class="cartao-uso">
          <div class="cartao-uso-topo"><span>${c.limite > 0 ? `${UI.pct(uso)} de ${UI.brl(c.limite)}` : 'Sem limite cadastrado'}</span><span>${c.vencimento ? `vence dia ${c.vencimento}` : ''}</span></div>
          <div class="barra-trilho"><div class="barra-cheia${uso > .8 ? ' is-alerta' : ''}" style="width:${Math.min(100, uso * 100)}%"></div></div>
        </div>
        <dl class="cartao-detalhe">
          <div><dt>Gastos lançados</dt><dd>${UI.brl(auto)}</dd></div>
          <div><dt>Ajuste manual</dt><dd><button type="button" class="link-btn" data-ajuste="${c.id}">${ajuste ? UI.brl(ajuste) : 'adicionar'}</button></dd></div>
          <div><dt>Limite disponível</dt><dd class="${c.limite && c.limite - fat < 0 ? 'txt-vermelho' : ''}">${c.limite ? UI.brl(c.limite - fat) : '—'}</dd></div>
        </dl>
        <div class="cartao-acoes">
          <button type="button" class="btn btn-outline btn-sm" data-ver="${c.id}">Ver gastos</button>
          <button type="button" class="btn btn-outline btn-sm" data-editar="${c.id}">${UI.ico('lapis', 'icon-sm')} Editar</button>
        </div>
      </article>`;
    }).join('');
    el.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => abrirForm(STORE.cartao(b.dataset.editar))));
    el.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => verGastos(STORE.cartao(b.dataset.ver), m)));
    el.querySelectorAll('[data-ajuste]').forEach(b => b.addEventListener('click', () => ajustar(STORE.cartao(b.dataset.ajuste), m)));
  }

  function renderAno(m) {
    const ano = STORE.anoDe(m);
    const meses = STORE.mesesDoAno(ano);
    document.getElementById('anoTitulo').textContent = `Faturas de ${ano}`;
    const linhas = [
      ...STORE.dados.cartoes.map(c => ({ nome: '💳 ' + c.nome, valores: meses.map(mes => STORE.fatura(c.id, mes)) })),
      ...STORE.FORMAS_FIXAS.map(f => ({ nome: f.nome, valores: meses.map(mes => STORE.gastosNaForma(f.id, mes)) }))
    ];
    const cel = (v) => `<td class="num${v ? ' tem-valor' : ''}">${v ? UI.brl(v) : '—'}</td>`;
    document.getElementById('tabelaAno').innerHTML = `<thead><tr><th>Forma</th>${STORE.MESES_CURTOS.map(n => `<th class="num">${n}</th>`).join('')}<th class="num">Total</th></tr></thead>
      <tbody>${linhas.map(l => `<tr><td class="col-nome">${UI.esc(l.nome)}</td>${l.valores.map(cel).join('')}<td class="num forte">${UI.brl(l.valores.reduce((a, b) => a + b, 0))}</td></tr>`).join('')}</tbody>`;
  }

  function render() {
    const m = STORE.mesRef();
    renderCartoes(m);
    renderAno(m);
  }

  function abrirForm(cartao) {
    const novo = !cartao;
    const c = cartao || { id: STORE.uid('car'), nome: '', bandeira: '', limite: '', vencimento: '', final: '', titular: '', estilo: '' };
    const estiloAtual = UI.estiloDoCartao(c);
    const janela = UI.modal({
      largo: true,
      titulo: novo ? 'Novo cartão' : 'Editar cartão',
      html: `<form novalidate>
        <div class="form-grid">
          <label class="field"><span>Nome do cartão</span><input name="nome" maxlength="40" placeholder="Ex.: Nubank" value="${UI.esc(c.nome)}" required></label>
          <label class="field"><span>Banco / bandeira</span><input name="bandeira" maxlength="40" placeholder="Ex.: Visa Gold, Mastercard" value="${UI.esc(c.bandeira)}"></label>
          <label class="field"><span>Limite (R$)</span><input name="limite" inputmode="numeric" data-dinheiro autocomplete="off" placeholder="0,00" value="${UI.num2(c.limite)}"></label>
          <label class="field"><span>Dia do vencimento</span><input name="vencimento" inputmode="numeric" maxlength="2" placeholder="Ex.: 10" value="${c.vencimento || ''}"></label>
          <label class="field"><span>Final do cartão (opcional)</span><input name="final" inputmode="numeric" maxlength="4" placeholder="Ex.: 2734" value="${UI.esc(c.final || '')}"></label>
          <label class="field"><span>Titular</span><select name="titular"><option value="">—</option>${STORE.dados.pessoas.map(p => `<option value="${p.id}"${p.id === c.titular ? ' selected' : ''}>${UI.esc(p.nome)}</option>`).join('')}</select></label>
        </div>
        <div class="field" style="margin-top:16px"><span>Visual do cartão</span>
          <div class="estilos-cartao">${UI.ESTILOS.map(e => `<label class="estilo-opcao"><input type="radio" name="estilo" value="${e.id}"${e.id === estiloAtual ? ' checked' : ''}>${UI.cartaoHTML({ ...c, nome: c.nome || e.nome, estilo: e.id }, { valor: '' })}<span>${e.nome}</span></label>`).join('')}</div>
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
      const venc = parseInt(form.vencimento.value, 10);
      if (!nome) { form.querySelector('[data-erro]').textContent = 'Dê um nome ao cartão.'; return; }
      if (form.vencimento.value && !(venc >= 1 && venc <= 31)) { form.querySelector('[data-erro]').textContent = 'Dia de vencimento inválido.'; return; }
      const final = form.final.value.replace(/D/g, '');
      if (final && final.length !== 4) { form.querySelector('[data-erro]').textContent = 'O final do cartão tem 4 dígitos.'; return; }
      Object.assign(c, { nome, bandeira: form.bandeira.value.trim(), limite: UI.lerValor(form.limite.value), vencimento: venc || '', final, titular: form.titular.value, estilo: (form.querySelector('[name=estilo]:checked') || {}).value || '' });
      if (novo) STORE.dados.cartoes.push(c);
      STORE.salvar();
      janela.fechar();
      render();
      UI.toast(novo ? 'Cartão cadastrado.' : 'Cartão atualizado.');
    });
    const exc = form.querySelector('[data-excluir]');
    if (exc) exc.addEventListener('click', () => {
      const n = STORE.emUso('forma', c.id);
      if (!UI.confirmar(`Excluir o cartão “${c.nome}”?${n ? `\n\n${n} lançamento(s) pagos com ele continuam existindo, mas ficam como “cartão removido”.` : ''}`)) return;
      STORE.remover('cartoes', c.id);
      delete STORE.dados.ajustesFatura[c.id];
      STORE.salvar();
      janela.fechar();
      render();
    });
  }

  function ajustar(c, m) {
    const atual = STORE.ajusteFatura(c.id, m);
    const janela = UI.modal({
      titulo: `Ajuste da fatura — ${c.nome}`,
      html: `<form novalidate>
        <p class="nota">Valor que entra na fatura de <strong>${STORE.nomeMes(m, true)}</strong> além dos gastos lançados (juros, anuidade, estorno…). Deixe vazio para tirar o ajuste.</p>
        <div class="form-grid">
          <label class="field"><span>Ajuste (R$)</span><input name="valor" inputmode="numeric" data-dinheiro autocomplete="off" placeholder="0,00" value="${UI.num2(Math.abs(atual))}"></label>
          <label class="field"><span>Tipo</span><select name="sinal"><option value="1"${atual >= 0 ? ' selected' : ''}>Somar à fatura</option><option value="-1"${atual < 0 ? ' selected' : ''}>Descontar da fatura</option></select></label>
        </div>
        <div class="form-actions"><div class="form-actions-right"><button type="submit" class="btn btn-lime">Salvar ajuste</button></div></div>
      </form>`
    });
    const form = janela.el.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      STORE.setAjusteFatura(c.id, m, UI.lerValor(form.valor.value) * Number(form.sinal.value));
      STORE.salvar();
      janela.fechar();
      render();
    });
  }

  function verGastos(c, m) {
    const lista = STORE.doMes(m).filter(l => STORE.ehDespesa(l) && l.forma === c.id);
    const total = STORE.soma(lista);
    UI.modal({
      titulo: `${c.nome} — ${STORE.nomeMes(m, true)}`,
      html: lista.length
        ? lista.map(l => {
          const cat = STORE.categoria(l.categoria);
          return `<div class="modal-row"><div class="modal-row-info"><strong>${UI.esc(l.descricao || '(sem descrição)')}</strong><span>${cat ? UI.esc(cat.icone + ' ' + cat.nome) : ''}${l.dia ? ' · dia ' + l.dia : ''}${l.tipo === 'fixo' ? ' · fixo' : ''}</span></div><span class="modal-row-value">${UI.brl(l.valor)}</span></div>`;
        }).join('') + `<div class="modal-total-row"><span>Total lançado</span><span>${UI.brl(total)}</span></div>`
        : '<p class="nota">Nenhum gasto lançado com este cartão neste mês.</p>'
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnNovo').addEventListener('click', () => abrirForm(null));
    UI.ligarMes(render);
    render();
  });
})();
