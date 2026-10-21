/* Receitas / Gastos fixos / Gastos variáveis (window.TIPO).
   Visão "Mês": lançamentos do mês agrupados por categoria (gastos) ou pessoa (receitas).
   Visão "Ano": a grade da planilha — linhas por categoria/pessoa, colunas Jan..Dez, Total, Média. */
(function () {
  const RECEITA = TIPO === 'receita';
  let visao = 'mes';

  /* Agrupamento: receitas por pessoa, gastos por categoria. */
  function chaveGrupo(l) { return RECEITA ? (l.pessoa || '') : (l.categoria || ''); }
  function infoGrupo(id) {
    if (RECEITA) {
      const p = STORE.pessoa(id);
      return { nome: p ? p.nome : '(sem pessoa)', icone: p ? p.nome.slice(0, 1).toUpperCase() : '?', avatar: true };
    }
    const c = STORE.categoria(id);
    return { nome: c ? c.nome : '(sem categoria)', icone: c ? c.icone : '•' };
  }
  /* Ordem dos grupos: pessoas/categorias na ordem cadastrada, depois as "órfãs". */
  function ordemGrupos(ids) {
    const base = RECEITA ? STORE.dados.pessoas.map(p => p.id) : STORE.dados.categorias.map(c => c.id);
    return [...ids].sort((a, b) => {
      const ia = base.indexOf(a), ib = base.indexOf(b);
      return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
    });
  }

  function linhaInfo(l) {
    const partes = [];
    if (l.dia) partes.push(`dia ${l.dia}`);
    if (RECEITA) partes.push(l.tipoReceita || 'Receita');
    else partes.push(STORE.nomeForma(l.forma));
    return partes.join(' · ');
  }

  function renderMes(m) {
    const lista = STORE.doMes(m, TIPO);
    const total = STORE.soma(lista);
    const grupos = new Map();
    lista.forEach((l) => {
      const k = chaveGrupo(l);
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(l);
    });

    document.getElementById('totalValor').textContent = UI.brl(total);
    document.getElementById('totalRotulo').textContent = `${TITULO} — ${STORE.nomeMes(m, true)}`;
    const anterior = STORE.soma(STORE.doMes(STORE.somarMes(m, -1), TIPO));
    const dif = total - anterior;
    document.getElementById('totalSub').textContent = `${lista.length} lançamento${lista.length === 1 ? '' : 's'}` +
      (anterior ? ` · ${dif >= 0 ? '+' : '−'}${UI.brl(Math.abs(dif))} vs. mês anterior` : '');

    /* "Repetir do mês anterior" — contas fixas e salários se repetem todo mês. */
    const btnRep = document.getElementById('btnRepetir');
    const qtdAnterior = STORE.doMes(STORE.somarMes(m, -1), TIPO).length;
    btnRep.hidden = TIPO === 'variavel' || !qtdAnterior;
    document.getElementById('btnRepetirTxt').textContent = `Repetir de ${STORE.nomeMes(STORE.somarMes(m, -1))} (${qtdAnterior})`;

    const el = document.getElementById('visaoMes');
    if (!lista.length) {
      el.innerHTML = `<div class="panel"><div class="empty-state">
        ${UI.ico(RECEITA ? 'entrada' : TIPO === 'fixo' ? 'fixo' : 'carrinho')}
        <div><strong>Nada lançado em ${STORE.nomeMes(m, true)}.</strong><br>
        ${qtdAnterior && TIPO !== 'variavel' ? 'Use “Repetir” para trazer os do mês anterior, ou lance um novo.' : 'Toque em “Novo” para lançar.'}</div>
      </div></div>`;
      return;
    }
    el.innerHTML = ordemGrupos(grupos.keys()).map((k) => {
      const itens = grupos.get(k).sort((a, b) => (a.dia || 99) - (b.dia || 99) || (a.criadoEm || '').localeCompare(b.criadoEm || ''));
      const g = infoGrupo(k);
      const sub = STORE.soma(itens);
      return `<div class="panel grupo">
        <div class="grupo-head">
          <span class="grupo-icone${g.avatar ? ' is-avatar' : ''}">${UI.esc(g.icone)}</span>
          <div class="grupo-nome"><strong>${UI.esc(g.nome)}</strong><span>${itens.length} ${itens.length === 1 ? 'item' : 'itens'} · ${UI.pct(total ? sub / total : 0, 0)} do total</span></div>
          <strong class="grupo-total">${UI.brl(sub)}</strong>
        </div>
        <ul class="lanc-lista">
          ${itens.map(l => `<li><button type="button" class="lanc-item" data-id="${l.id}">
            <span class="lanc-desc"><strong>${UI.esc(l.descricao || (RECEITA ? l.tipoReceita : '(sem descrição)'))}</strong><span>${UI.esc(linhaInfo(l))}</span></span>
            <span class="lanc-valor">${UI.brl(l.valor)}</span>
            ${UI.ico('lapis', 'icon-sm lanc-editar')}
          </button></li>`).join('')}
        </ul>
      </div>`;
    }).join('');
    el.querySelectorAll('.lanc-item').forEach((b) => b.addEventListener('click', () => {
      abrirForm(STORE.dados.lancamentos.find(l => l.id === b.dataset.id));
    }));
  }

  function renderAno(m) {
    const ano = STORE.anoDe(m);
    const meses = STORE.mesesDoAno(ano);
    const doAno = STORE.dados.lancamentos.filter(l => l.tipo === TIPO && STORE.anoDe(l.mes) === ano);
    const grupos = ordemGrupos(new Set(doAno.map(chaveGrupo)));
    document.getElementById('anoTitulo').textContent = `${TITULO} — ${ano}`;
    const somaMes = (lista, mes) => STORE.soma(lista.filter(l => l.mes === mes));
    const celula = (v, mes) => `<td class="num${v ? ' tem-valor' : ''}"${v ? ` data-mes="${mes}"` : ''}>${v ? UI.brl(v) : '—'}</td>`;
    const media = (lista) => {
      const ativos = meses.filter(mes => somaMes(lista, mes));
      return ativos.length ? STORE.soma(lista) / ativos.length : 0;
    };
    const tabela = document.getElementById('tabelaAno');
    if (!doAno.length) {
      tabela.innerHTML = `<tr><td class="report-empty">Nenhum lançamento em ${ano}.</td></tr>`;
      return;
    }
    tabela.innerHTML = `<thead><tr><th>${RECEITA ? 'Pessoa' : 'Categoria'}</th>${STORE.MESES_CURTOS.map(n => `<th class="num">${n}</th>`).join('')}<th class="num">Total</th><th class="num" title="Média dos meses com lançamento">Média</th></tr></thead>
      <tbody>${grupos.map((k) => {
        const lista = doAno.filter(l => chaveGrupo(l) === k);
        const g = infoGrupo(k);
        return `<tr><td class="col-nome">${g.avatar ? '' : UI.esc(g.icone) + ' '}${UI.esc(g.nome)}</td>${meses.map(mes => celula(somaMes(lista, mes), mes)).join('')}<td class="num forte">${UI.brl(STORE.soma(lista))}</td><td class="num">${UI.brl(media(lista))}</td></tr>`;
      }).join('')}</tbody>
      <tfoot><tr><td class="col-nome">Total</td>${meses.map(mes => celula(somaMes(doAno, mes), mes)).join('')}<td class="num forte">${UI.brl(STORE.soma(doAno))}</td><td class="num">${UI.brl(media(doAno))}</td></tr></tfoot>`;
    tabela.querySelectorAll('td[data-mes]').forEach((td) => td.addEventListener('click', () => {
      STORE.setMesRef(td.dataset.mes);
      trocarVisao('mes');
      document.getElementById('mesTexto').textContent = STORE.nomeMes(td.dataset.mes, true);
      document.getElementById('mesInput').value = td.dataset.mes;
    }));
  }

  function render() {
    const m = STORE.mesRef();
    if (visao === 'mes') renderMes(m); else renderAno(m);
  }

  function trocarVisao(v) {
    visao = v;
    document.querySelectorAll('[data-visao]').forEach((b) => {
      b.classList.toggle('active', b.dataset.visao === v);
      b.setAttribute('aria-selected', String(b.dataset.visao === v));
    });
    document.getElementById('visaoMes').hidden = v !== 'mes';
    document.getElementById('visaoAno').hidden = v !== 'ano';
    render();
  }

  /* ===== Formulário (novo / editar) ===== */
  function opcoesCategoria(sel) {
    const doTipo = STORE.dados.categorias.filter(c => c.tipo === TIPO);
    const outras = STORE.dados.categorias.filter(c => c.tipo !== TIPO);
    const opt = (c) => `<option value="${c.id}"${c.id === sel ? ' selected' : ''}>${UI.esc(c.icone)} ${UI.esc(c.nome)}</option>`;
    return doTipo.map(opt).join('') +
      (outras.length ? `<optgroup label="${TIPO === 'fixo' ? 'Categorias de gastos variáveis' : 'Categorias de gastos fixos'}">${outras.map(opt).join('')}</optgroup>` : '') +
      '<option value="__nova">+ Nova categoria…</option>';
  }
  function opcoesForma(sel) {
    return '<option value="">— não informar —</option>' +
      STORE.formas().map(f => `<option value="${f.id}"${f.id === sel ? ' selected' : ''}>${f.cartao ? '💳 ' : ''}${UI.esc(f.nome)}</option>`).join('');
  }

  function abrirForm(lanc) {
    const novo = !lanc;
    const ultimo = STORE.dados.lancamentos.filter(l => l.tipo === TIPO).slice(-1)[0];
    const l = lanc || {
      id: STORE.uid('lan'), tipo: TIPO, mes: STORE.mesRef(), dia: '', descricao: '', valor: '',
      categoria: !RECEITA ? (ultimo && ultimo.categoria) || (STORE.dados.categorias.find(c => c.tipo === TIPO) || {}).id : undefined,
      forma: !RECEITA ? (ultimo ? ultimo.forma : '') : undefined,
      pessoa: RECEITA ? (ultimo && ultimo.pessoa) || (STORE.dados.pessoas[0] || {}).id : undefined,
      tipoReceita: RECEITA ? STORE.RENDA_FIXA : undefined
    };
    const nomeTipo = { receita: 'receita', fixo: 'gasto fixo', variavel: 'gasto variável' }[TIPO];
    const html = `<form class="form-lanc" novalidate>
      <label class="field campo-valor"><span>Valor (R$)</span>
        <input name="valor" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${l.valor !== '' ? String(l.valor).replace('.', ',') : ''}" required>
      </label>
      <label class="field"><span>${RECEITA ? 'Descrição (opcional)' : 'Descrição / onde'}</span>
        <input name="descricao" maxlength="80" placeholder="${RECEITA ? 'Ex.: salário empresa X' : 'Ex.: Supermercado Extra Bom'}" value="${UI.esc(l.descricao)}">
      </label>
      ${RECEITA ? `
        <div class="form-grid">
          <label class="field"><span>Pessoa</span><select name="pessoa">${STORE.dados.pessoas.map(p => `<option value="${p.id}"${p.id === l.pessoa ? ' selected' : ''}>${UI.esc(p.nome)}</option>`).join('')}</select></label>
          <label class="field"><span>Tipo de receita</span><select name="tipoReceita">${STORE.TIPOS_RECEITA.map(t => `<option${t === l.tipoReceita ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        </div>` : `
        <div class="form-grid">
          <label class="field"><span>Categoria</span><select name="categoria">${opcoesCategoria(l.categoria)}</select></label>
          <label class="field"><span>Forma de pagamento</span><select name="forma">${opcoesForma(l.forma)}</select></label>
        </div>`}
      <div class="form-grid">
        <label class="field"><span>Mês</span><input type="month" name="mes" value="${l.mes}" required></label>
        <label class="field"><span>Dia (opcional)</span><input name="dia" inputmode="numeric" maxlength="2" placeholder="—" value="${l.dia || ''}"></label>
      </div>
      <p class="auth-msg" data-erro></p>
      <div class="form-actions">
        ${novo ? '' : `<button type="button" class="btn btn-danger" data-excluir>${UI.ico('lixo', 'icon-sm')} Excluir</button>`}
        <div class="form-actions-right">
          ${novo ? '<button type="submit" class="btn btn-outline" data-outro>Salvar e lançar outro</button>' : ''}
          <button type="submit" class="btn btn-lime">${novo ? 'Salvar' : 'Salvar alterações'}</button>
        </div>
      </div>
    </form>`;
    const janela = UI.modal({ titulo: novo ? `Nova ${nomeTipo}`.replace('Nova gasto', 'Novo gasto') : `Editar ${nomeTipo}`, html });
    const form = janela.el.querySelector('form');
    const erro = form.querySelector('[data-erro]');
    setTimeout(() => form.valor.focus(), 40);

    if (!RECEITA) {
      form.categoria.addEventListener('change', () => {
        if (form.categoria.value !== '__nova') return;
        const nome = (prompt('Nome da nova categoria:') || '').trim();
        if (!nome) { form.categoria.selectedIndex = 0; return; }
        const c = { id: STORE.uid('cat'), nome, tipo: TIPO, icone: '🏷️' };
        STORE.dados.categorias.push(c);
        STORE.salvar();
        form.categoria.innerHTML = opcoesCategoria(c.id);
      });
    }

    let lancarOutro = false;
    form.querySelectorAll('button[type=submit]').forEach(b => b.addEventListener('click', () => { lancarOutro = b.hasAttribute('data-outro'); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const valor = UI.lerValor(form.valor.value);
      const dia = parseInt(form.dia.value, 10);
      if (!(valor > 0)) { erro.textContent = 'Informe um valor maior que zero.'; form.valor.focus(); return; }
      if (!/^\d{4}-\d{2}$/.test(form.mes.value)) { erro.textContent = 'Escolha o mês.'; return; }
      if (form.dia.value && !(dia >= 1 && dia <= 31)) { erro.textContent = 'Dia inválido (1 a 31).'; return; }
      if (!RECEITA && form.categoria.value === '__nova') { erro.textContent = 'Escolha a categoria.'; return; }
      const salvo = {
        ...l, valor, descricao: form.descricao.value.trim(), mes: form.mes.value, dia: dia || '',
        criadoEm: l.criadoEm || new Date().toISOString()
      };
      if (RECEITA) { salvo.pessoa = form.pessoa.value; salvo.tipoReceita = form.tipoReceita.value; }
      else { salvo.categoria = form.categoria.value; salvo.forma = form.forma.value; }
      STORE.salvarLancamento(salvo);
      janela.fechar();
      render();
      UI.toast(novo ? `Lançado: ${UI.brl(valor)}${salvo.mes !== STORE.mesRef() ? ' em ' + STORE.nomeMes(salvo.mes) : ''}` : 'Alterações salvas.');
      if (lancarOutro) abrirForm(null);
    });
    const exc = form.querySelector('[data-excluir]');
    if (exc) exc.addEventListener('click', () => {
      if (!UI.confirmar(`Excluir “${l.descricao || nomeTipo}” de ${UI.brl(l.valor)}?`)) return;
      STORE.removerLancamento(l.id);
      janela.fechar();
      render();
      UI.toast('Lançamento excluído.');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnNovoTxt').textContent = RECEITA ? 'Nova receita' : 'Novo gasto';
    document.getElementById('btnNovo').addEventListener('click', () => abrirForm(null));
    document.getElementById('fabNovo').addEventListener('click', () => abrirForm(null));
    document.querySelectorAll('[data-visao]').forEach(b => b.addEventListener('click', () => trocarVisao(b.dataset.visao)));
    document.getElementById('btnRepetir').addEventListener('click', () => {
      const m = STORE.mesRef();
      const n = STORE.repetirDoMes(TIPO, STORE.somarMes(m, -1), m);
      UI.toast(n ? `${n} lançamento${n > 1 ? 's' : ''} copiado${n > 1 ? 's' : ''} — confira os valores.` : 'Esses lançamentos já foram copiados para este mês.');
      render();
    });
    UI.ligarMes(render);
    render();
  });
})();
