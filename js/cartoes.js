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

  /* Próximos 6 meses a partir do mês de referência — mostra o peso das compras parceladas. */
  function renderProximas(m) {
    const meses = [];
    for (let i = 0; i < 6; i++) meses.push(STORE.somarMes(m, i));
    const tabela = document.getElementById('tabelaProximas');
    const lista = document.getElementById('listaProximas');
    if (!STORE.dados.cartoes.length) { tabela.innerHTML = '<tr><td class="report-empty">Cadastre um cartão para ver as próximas faturas.</td></tr>'; lista.innerHTML = '<li class="vazio-curto">Cadastre um cartão para ver as próximas faturas.</li>'; return; }
    const parcelas = (cId, mes) => STORE.doMes(mes).filter(l => l.forma === cId && l.parcela).length;
    const linhas = STORE.dados.cartoes.map(c => ({ c, valores: meses.map(mes => STORE.fatura(c.id, mes)) }));
    const total = meses.map((_, i) => linhas.reduce((s, l) => s + l.valores[i], 0));
    tabela.innerHTML = `<thead><tr><th>Cartão</th>${meses.map(mes => `<th class="num">${STORE.nomeMes(mes)}</th>`).join('')}</tr></thead>
      <tbody>${linhas.map(l => `<tr><td class="col-nome">💳 ${UI.esc(l.c.nome)}</td>${l.valores.map((v, i) => {
        const np = parcelas(l.c.id, meses[i]);
        return `<td class="num${v ? ' tem-valor' : ''}"${v ? ` data-detalhe="${l.c.id}|${meses[i]}"` : ''}>${v ? UI.brl(v) : '—'}${np ? `<small class="sub-parcelas">${np} parcela${np > 1 ? 's' : ''}</small>` : ''}</td>`;
      }).join('')}</tr>`).join('')}</tbody>
      <tfoot><tr><td class="col-nome">Total</td>${total.map(v => `<td class="num">${UI.brl(v)}</td>`).join('')}</tr></tfoot>`;
    /* Celular: um item por mês, com o total e quanto vai em cada cartão. */
    lista.innerHTML = meses.map((mes, i) => {
      const np = STORE.dados.cartoes.reduce((s, c) => s + parcelas(c.id, mes), 0);
      const det = linhas.filter(l => l.valores[i]).map(l => `${UI.esc(l.c.nome)} ${UI.brl(l.valores[i])}`).join(' · ');
      return `<li data-detalhe="*|${mes}" role="button" tabindex="0"><div><strong>${STORE.nomeMes(mes, true)}</strong><span>${det || 'nada lançado'}${np ? ` · ${np} parcela${np > 1 ? 's' : ''}` : ''}</span></div><strong>${UI.brl(total[i])}</strong></li>`;
    }).join('');
    document.querySelectorAll('[data-detalhe]').forEach(el => el.addEventListener('click', () => {
      const [cId, mes] = el.dataset.detalhe.split('|');
      detalheFatura(cId === '*' ? null : STORE.cartao(cId), mes);
    }));
  }

  /* O que compõe a fatura de um mês: parcelas (com n/de) e gastos à vista, por cartão. */
  function detalheFatura(cartao, mes) {
    const cartoes = cartao ? [cartao] : STORE.dados.cartoes;
    const html = cartoes.map((c) => {
      const itens = STORE.doMes(mes).filter(l => STORE.ehDespesa(l) && l.forma === c.id).sort((a, b) => (b.parcela ? 1 : 0) - (a.parcela ? 1 : 0) || b.valor - a.valor);
      const aj = STORE.ajusteFatura(c.id, mes);
      if (!itens.length && !aj) return '';
      return `<div class="modal-group"><div class="modal-group-title">💳 ${UI.esc(c.nome)}</div>${itens.map(l => `<div class="modal-row"><div class="modal-row-info"><strong>${UI.esc(l.descricao || '(sem descrição)')}</strong><span>${l.parcela ? `parcela ${l.parcela.n}/${l.parcela.de} · compra de ${UI.brl(l.parcela.total)}` : 'à vista'}${l.tipo === 'fixo' ? ' · fixo' : ''}</span></div><span class="modal-row-value">${UI.brl(l.valor)}</span></div>`).join('')}
        ${aj ? `<div class="modal-row"><div class="modal-row-info"><strong>Ajuste manual</strong></div><span class="modal-row-value">${UI.brl(aj)}</span></div>` : ''}
        <div class="modal-total-row"><span>Fatura</span><span>${UI.brl(STORE.fatura(c.id, mes))}</span></div></div>`;
    }).join('');
    UI.modal({ titulo: `Fatura de ${STORE.nomeMes(mes, true)}`, html: html || '<p class="nota">Nada lançado nesta fatura.</p>' });
  }

  /* Cada compra parcelada uma vez só, com parcela atual, o que falta e aviso de duplicada. */
  function renderParceladas(m) {
    const lista = STORE.comprasParceladas(m).filter(c => c.fim >= m);
    const dup = lista.filter(c => c.duplicadaDe).length;
    document.getElementById('parceladasSub').textContent = lista.length ? `${lista.length} em andamento${dup ? ` · ${dup} possivelmente duplicada${dup > 1 ? 's' : ''}` : ''}` : '';
    const el = document.getElementById('parceladas');
    if (!lista.length) { el.innerHTML = '<p class="vazio-curto">Nenhuma compra parcelada em andamento a partir deste mês.</p>'; return; }
    el.innerHTML = (dup ? '<p class="aviso-inline">⚠️ Há compras que parecem ter sido lançadas <strong>mais de uma vez</strong> (mesma descrição, cartão, valor e meses). Confira e exclua as repetidas.</p>' : '') +
      `<ul class="parceladas">${lista.map(c => `<li class="${c.duplicadaDe ? 'is-duplicada' : ''}">
        <div class="parc-info">
          <strong>${UI.esc(c.descricao || '(sem descrição)')}${c.duplicadaDe ? ' <span class="tag tag-alerta">duplicada?</span>' : ''}</strong>
          <span>${UI.esc(STORE.nomeForma(c.forma))} · ${c.de}x de ${UI.brl(c.valorParcela)} (total ${UI.brl(c.total)})</span>
          <span>${c.atual ? `Neste mês: parcela ${c.atual.parcela.n}/${c.de}` : `Começa em ${STORE.nomeMes(c.inicio)}`} · termina em ${STORE.nomeMes(c.fim)} · falta ${UI.brl(c.restante)} (${c.qtdRestante}x)</span>
        </div>
        <button type="button" class="icon-remove" data-compra="${c.grupo}" aria-label="Excluir compra ${UI.esc(c.descricao || '')}">${UI.ico('lixo', 'icon-sm')}</button>
      </li>`).join('')}</ul>`;
    el.querySelectorAll('[data-compra]').forEach(b => b.addEventListener('click', () => {
      const c = lista.find(x => x.grupo === b.dataset.compra);
      if (!UI.confirmar(`Excluir a compra “${c.descricao || 'sem descrição'}” inteira (${c.lancadas} parcela${c.lancadas > 1 ? 's' : ''} lançada${c.lancadas > 1 ? 's' : ''}, de ${STORE.nomeMes(c.inicio)} a ${STORE.nomeMes(c.fim)})?`)) return;
      const n = STORE.removerCompra(c.grupo);
      render();
      UI.toast(`Compra excluída (${n} parcela${n > 1 ? 's' : ''}).`);
    }));
  }

  function render() {
    const m = STORE.mesRef();
    renderCartoes(m);
    renderProximas(m);
    renderParceladas(m);
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
