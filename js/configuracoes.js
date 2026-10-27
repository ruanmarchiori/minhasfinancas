/* Configurações: importar planilha, pessoas, categorias, preferências, backup, senha. */
(function () {
  const D = () => STORE.dados;

  /* ===== Importar planilha ===== */
  async function lerPlanilha(arquivo) {
    const previa = document.getElementById('previaPlanilha');
    previa.innerHTML = '<p class="nota">Lendo a planilha…</p>';
    let r;
    try {
      r = PLANILHA.converter(await PLANILHA.lerXlsx(arquivo));
    } catch (e) {
      console.error(e);
      previa.innerHTML = `<p class="auth-msg">Não foi possível ler: ${UI.esc(e.message)}</p>`;
      return;
    }
    const s = PLANILHA.resumo(r.dados);
    const temDados = D().lancamentos.length > 0;
    previa.innerHTML = `<div class="previa">
      <h4 class="sub-titulo">Encontrado na planilha (${r.ano})</h4>
      <div class="report-table-wrap"><table class="report-table"><thead><tr><th>Mês</th><th class="num">Receitas</th><th class="num">Gastos fixos</th><th class="num">Gastos variáveis</th><th class="num">Lançamentos</th></tr></thead>
      <tbody>${s.meses.map(m => `<tr><td>${STORE.nomeMes(m.mes, true)}</td><td class="num">${UI.brl(m.receitas)}</td><td class="num">${UI.brl(m.fixos)}</td><td class="num">${UI.brl(m.variaveis)}</td><td class="num">${m.qtd}</td></tr>`).join('') || '<tr><td colspan="5" class="report-empty">Nenhum valor lançado.</td></tr>'}</tbody></table></div>
      <p class="nota">${s.pessoas} pessoa(s): ${r.dados.pessoas.map(p => UI.esc(p.nome)).join(', ')} · ${s.cartoes} cartão(ões) · ${s.categorias} categorias · ${s.aportes} aporte(s) na reserva · ${s.metas} meta(s).</p>
      ${r.avisos.map(a => `<p class="auth-msg">${UI.esc(a)}</p>`).join('')}
      ${temDados ? `<p class="aviso-inline">Você já tem ${D().lancamentos.length} lançamento(s) aqui. Importar <strong>substitui</strong> tudo pelos dados da planilha — baixe um backup antes se quiser guardar.</p>` : ''}
      <div class="botoes-linha"><button type="button" class="btn btn-lime" id="confirmarImport">Importar ${s.lancamentos} lançamentos</button><button type="button" class="btn btn-outline" id="cancelarImport">Cancelar</button></div>
    </div>`;
    document.getElementById('cancelarImport').addEventListener('click', () => { previa.innerHTML = ''; });
    document.getElementById('confirmarImport').addEventListener('click', () => {
      if (temDados && !UI.confirmar('Substituir todos os dados atuais pelos da planilha?')) return;
      STORE.substituirTudo(r.dados);
      /* Abre o Painel no último mês que tem lançamentos (o "mês de referência" da planilha). */
      if (s.meses.length) STORE.setMesRef(s.meses[s.meses.length - 1].mes);
      previa.innerHTML = `<p class="aviso-ok">Planilha importada. <a href="index.html">Ver o Painel →</a></p>`;
      renderTudo();
    });
  }

  /* ===== Pessoas ===== */
  function renderPessoas() {
    const ul = document.getElementById('listaPessoas');
    ul.innerHTML = D().pessoas.map(p => `<li>
      <span class="mini-avatar">${UI.esc(p.nome.slice(0, 1).toUpperCase())}</span>
      <input value="${UI.esc(p.nome)}" data-id="${p.id}" maxlength="30" aria-label="Nome">
      <span class="uso">${STORE.emUso('pessoa', p.id)} receita(s)</span>
      <button type="button" class="icon-remove" data-remover="${p.id}" aria-label="Remover ${UI.esc(p.nome)}">${UI.ico('lixo', 'icon-sm')}</button>
    </li>`).join('');
    ul.querySelectorAll('input[data-id]').forEach(inp => inp.addEventListener('change', () => {
      const p = STORE.pessoa(inp.dataset.id);
      const nome = inp.value.trim();
      if (!nome) { inp.value = p.nome; return; }
      p.nome = nome; STORE.salvar(); renderPessoas(); UI.toast('Nome atualizado.');
    }));
    ul.querySelectorAll('[data-remover]').forEach(b => b.addEventListener('click', () => {
      const p = STORE.pessoa(b.dataset.remover);
      const n = STORE.emUso('pessoa', p.id);
      if (D().pessoas.length === 1) { UI.toast('Precisa ter pelo menos uma pessoa.'); return; }
      if (!UI.confirmar(`Remover ${p.nome}?${n ? `\n\nAs ${n} receita(s) dela continuam, mas ficam “sem pessoa”.` : ''}`)) return;
      STORE.remover('pessoas', p.id); renderPessoas();
    }));
  }

  /* ===== Categorias ===== */
  function renderCategorias() {
    ['fixo', 'variavel'].forEach((tipo) => {
      const ul = document.getElementById(tipo === 'fixo' ? 'catFixo' : 'catVariavel');
      const lista = D().categorias.filter(c => c.tipo === tipo);
      ul.innerHTML = lista.length ? lista.map(c => `<li>
        <input class="input-emoji" value="${UI.esc(c.icone)}" data-icone="${c.id}" maxlength="4" aria-label="Emoji de ${UI.esc(c.nome)}">
        <input value="${UI.esc(c.nome)}" data-nome="${c.id}" maxlength="30" aria-label="Nome">
        <span class="uso">${STORE.emUso('categoria', c.id)}</span>
        <button type="button" class="icon-btn-mini" data-mover="${c.id}" title="Mover para ${tipo === 'fixo' ? 'variáveis' : 'fixos'}" aria-label="Mover ${UI.esc(c.nome)} para ${tipo === 'fixo' ? 'gastos variáveis' : 'gastos fixos'}">⇄</button>
        <button type="button" class="icon-remove" data-remover="${c.id}" aria-label="Remover ${UI.esc(c.nome)}">${UI.ico('lixo', 'icon-sm')}</button>
      </li>`).join('') : '<li class="vazio-curto">Nenhuma.</li>';
    });
    const sec = document.getElementById('catFixo').closest('.panel');
    sec.querySelectorAll('[data-nome]').forEach(inp => inp.addEventListener('change', () => {
      const c = STORE.categoria(inp.dataset.nome);
      const nome = inp.value.trim();
      if (!nome) { inp.value = c.nome; return; }
      c.nome = nome; STORE.salvar(); UI.toast('Categoria renomeada.');
    }));
    sec.querySelectorAll('[data-icone]').forEach(inp => inp.addEventListener('change', () => {
      const c = STORE.categoria(inp.dataset.icone);
      c.icone = inp.value.trim() || '🏷️'; STORE.salvar();
    }));
    sec.querySelectorAll('[data-mover]').forEach(b => b.addEventListener('click', () => {
      const c = STORE.categoria(b.dataset.mover);
      c.tipo = c.tipo === 'fixo' ? 'variavel' : 'fixo'; STORE.salvar(); renderCategorias();
    }));
    sec.querySelectorAll('[data-remover]').forEach(b => b.addEventListener('click', () => {
      const c = STORE.categoria(b.dataset.remover);
      const n = STORE.emUso('categoria', c.id);
      if (!UI.confirmar(`Remover a categoria “${c.nome}”?${n ? `\n\n${n} lançamento(s) dela continuam, mas ficam “sem categoria”.` : ''}`)) return;
      STORE.remover('categorias', c.id); renderCategorias();
    }));
  }

  function renderInfo() {
    const d = D();
    const kb = Math.round(JSON.stringify(d).length / 1024);
    const ult = d.config.ultimoBackup ? new Date(d.config.ultimoBackup).toLocaleDateString('pt-BR') : 'nunca';
    document.getElementById('infoDados').textContent = `${d.lancamentos.length} lançamento(s), ${d.cartoes.length} cartão(ões), ${d.metas.length} meta(s) · ${kb} KB neste aparelho · último backup: ${ult}.`;
  }

  function textoBackup(extra) {
    return JSON.stringify(Object.assign({ app: 'sistema-financeiro', exportadoEm: new Date().toISOString(), dados: D() }, extra || {}), null, 2);
  }

  /* ===== Fechar o ano ===== */
  function renderFechar() {
    const el = document.getElementById('fecharAno');
    const anos = STORE.anosComLancamentos();
    const atual = new Date().getFullYear();
    if (!anos.length) { el.innerHTML = '<p class="vazio-curto">Nenhum lançamento para fechar.</p>'; return; }
    el.innerHTML = `<div class="linha-add">
        <select id="anoFechar" aria-label="Ano">${anos.map(a => `<option value="${a}"${a === (STORE.anoParaFechar() || anos[0]) ? ' selected' : ''}>${a}${a === atual ? ' (ano atual)' : ''}</option>`).join('')}</select>
        <button type="button" class="btn btn-primary btn-sm" id="btnFechar">Fechar o ano</button>
      </div>
      <p class="field-hint" id="fecharInfo"></p>`;
    const sel = document.getElementById('anoFechar');
    const info = () => {
      const a = Number(sel.value);
      const n = D().lancamentos.filter(l => STORE.anoDe(l.mes) === a).length;
      document.getElementById('fecharInfo').textContent = `${a}: ${n} lançamento(s) serão apagados depois de salvar o arquivo.`;
    };
    sel.addEventListener('change', info);
    info();
    document.getElementById('btnFechar').addEventListener('click', async () => {
      const a = Number(sel.value);
      const n = D().lancamentos.filter(l => STORE.anoDe(l.mes) === a).length;
      if (a === atual && !UI.confirmar(`${a} ainda não terminou. Fechar mesmo assim?`)) return;
      if (!UI.confirmar(`Fechar ${a}?\n\n1) Vou salvar o arquivo financas-${a}.backup.json (guarde-o).\n2) Depois apago os ${n} lançamento(s) de ${a}.\n\nCartões, metas e reserva continuam.`)) return;
      const salvo = await UI.salvarArquivo(`financas-${a}.backup.json`, textoBackup({ anoFechado: a }));
      if (!salvo) { UI.toast('Arquivo não salvo — nada foi apagado.'); return; }
      if (!UI.confirmar(`O arquivo de ${a} foi salvo? Toque em OK para apagar os lançamentos de ${a}.`)) { UI.toast('Nada foi apagado.'); return; }
      const apagados = STORE.fecharAno(a);
      STORE.setMesRef(STORE.hojeMes());
      renderTudo();
      UI.toast(`${a} fechado: ${apagados} lançamento(s) apagados. Bom ano novo!`);
    });
  }

  /* ===== Ciclo dos cartões ===== */
  function renderCiclos() {
    const el = document.getElementById('ciclos');
    const cs = D().cartoes;
    if (!cs.length) { el.innerHTML = '<p class="vazio-curto">Nenhum cartão cadastrado. <a href="cartoes.html">Cadastrar</a></p>'; return; }
    const dm = (iso) => iso ? iso.split('-').reverse().join('/') : '—';
    const mes = STORE.mesRef();
    el.innerHTML = cs.map((c) => {
      const exc = Object.entries(c.excecoes || {}).sort();
      return `<div class="ciclo-cartao" data-cartao="${c.id}">
        <div class="ciclo-topo"><strong>💳 ${UI.esc(c.nome)}</strong><span class="panel-sub">${STORE.temCiclo(c) ? `Fatura de ${STORE.nomeMes(mes)}: fecha ${dm(STORE.fechamentoFatura(c, mes))} · vence ${dm(STORE.vencimentoFatura(c, mes))}` : 'Informe o vencimento'}</span></div>
        <div class="ciclo-dias">
          <label class="field"><span>Dia do fechamento</span><input inputmode="numeric" maxlength="2" data-campo="fechamento" value="${c.fechamento || ''}" placeholder="${STORE.diaFechamento(c) ? 'estimado: ' + STORE.diaFechamento(c) : 'Ex.: 3'}"></label>
          <label class="field"><span>Dia do vencimento</span><input inputmode="numeric" maxlength="2" data-campo="vencimento" value="${c.vencimento || ''}" placeholder="Ex.: 10"></label>
        </div>
        <div>
          <div class="sub-titulo">Exceções (datas de uma fatura específica)</div>
          <ul class="excecoes">${exc.length ? exc.map(([m, e]) => `<li><span><strong>${STORE.nomeMes(m, true)}</strong> · fecha ${dm(e.fechamento || STORE.fechamentoFatura({ ...c, excecoes: {} }, m))} · vence ${dm(e.vencimento || STORE.vencimentoFatura({ ...c, excecoes: {} }, m))}</span><button type="button" class="icon-remove" data-tirar="${m}" aria-label="Remover exceção">${UI.ico('lixo', 'icon-sm')}</button></li>`).join('') : '<li class="vazio-curto">Nenhuma. Todas as faturas seguem os dias acima.</li>'}</ul>
          ${STORE.temCiclo(c) ? `<button type="button" class="btn btn-outline btn-sm" data-nova-excecao style="margin-top:8px">${UI.ico('mais', 'icon-sm')} Mudar datas de uma fatura</button>` : ''}
        </div>
      </div>`;
    }).join('');
    el.querySelectorAll('[data-cartao]').forEach((box) => {
      const c = STORE.cartao(box.dataset.cartao);
      box.querySelectorAll('[data-campo]').forEach(inp => inp.addEventListener('change', () => {
        const v = parseInt(inp.value, 10);
        if (inp.value && !(v >= 1 && v <= 31)) { UI.toast('Dia inválido (1 a 31).'); inp.value = c[inp.dataset.campo] || ''; return; }
        c[inp.dataset.campo] = v || '';
        STORE.salvar();
        renderCiclos();
        UI.toast('Datas do cartão salvas.');
      }));
      box.querySelectorAll('[data-tirar]').forEach(b => b.addEventListener('click', () => {
        STORE.setExcecaoFatura(c, b.dataset.tirar, '', '');
        renderCiclos();
      }));
      const nova = box.querySelector('[data-nova-excecao]');
      if (nova) nova.addEventListener('click', () => novaExcecao(c));
    });
  }
  function novaExcecao(c) {
    const m0 = STORE.mesRef();
    const opcoes = [];
    for (let i = -1; i <= 6; i++) opcoes.push(STORE.somarMes(m0, i));
    const janela = UI.modal({
      titulo: `Datas de uma fatura — ${c.nome}`,
      html: `<form novalidate>
        <label class="field"><span>Fatura</span><select name="mes">${opcoes.map(m => `<option value="${m}"${m === m0 ? ' selected' : ''}>${STORE.nomeMes(m, true)}</option>`).join('')}</select></label>
        <div class="form-grid" style="margin-top:14px">
          <label class="field"><span>Fecha em</span><input type="date" name="fechamento"></label>
          <label class="field"><span>Vence em</span><input type="date" name="vencimento"></label>
        </div>
        <p class="field-hint" style="margin:10px 0 0">Compras feitas antes da data de fechamento entram nesta fatura.</p>
        <p class="auth-msg" data-erro></p>
        <div class="form-actions"><div class="form-actions-right"><button type="submit" class="btn btn-lime">Salvar datas</button></div></div>
      </form>`
    });
    const form = janela.el.querySelector('form');
    const preencher = () => {
      const m = form.mes.value;
      const atual = (c.excecoes || {})[m] || {};
      const semExc = { ...c, excecoes: {} };
      form.fechamento.value = atual.fechamento || STORE.fechamentoFatura(semExc, m) || '';
      form.vencimento.value = atual.vencimento || STORE.vencimentoFatura(semExc, m) || '';
    };
    form.mes.addEventListener('change', preencher);
    preencher();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = form.fechamento.value, v = form.vencimento.value;
      if (!f || !v) { form.querySelector('[data-erro]').textContent = 'Informe as duas datas.'; return; }
      if (f >= v) { form.querySelector('[data-erro]').textContent = 'O fechamento precisa ser antes do vencimento.'; return; }
      const semExc = { ...c, excecoes: {} };
      const m = form.mes.value;
      const iguais = f === STORE.fechamentoFatura(semExc, m) && v === STORE.vencimentoFatura(semExc, m);
      STORE.setExcecaoFatura(c, m, iguais ? '' : f, iguais ? '' : v);
      janela.fechar();
      renderCiclos();
      UI.toast(iguais ? 'Datas iguais às normais — nenhuma exceção criada.' : `Fatura de ${STORE.nomeMes(m)} ajustada.`);
    });
  }

  function renderTudo() { renderPessoas(); renderCategorias(); renderInfo(); renderFechar(); renderCiclos(); }

  document.addEventListener('DOMContentLoaded', () => {
    renderTudo();

    document.getElementById('arquivoPlanilha').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) lerPlanilha(f);
      e.target.value = '';
    });

    document.getElementById('formPessoa').addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = e.target.nome.value.trim();
      if (!nome) return;
      D().pessoas.push({ id: STORE.uid('pes'), nome });
      STORE.salvar(); e.target.reset(); renderPessoas();
    });
    document.getElementById('formCategoria').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const nome = f.nome.value.trim();
      if (!nome) return;
      D().categorias.push({ id: STORE.uid('cat'), nome, tipo: f.tipo.value, icone: f.icone.value.trim() || '🏷️' });
      STORE.salvar(); f.reset(); renderCategorias();
    });

    const meta = document.getElementById('metaPoupanca');
    meta.value = String(Math.round(D().config.metaPoupanca * 1000) / 10).replace('.', ',');
    meta.addEventListener('change', () => {
      const v = UI.lerValor(meta.value);
      if (v >= 0 && v <= 100) { D().config.metaPoupanca = v / 100; STORE.salvar(); UI.toast('Meta de poupança salva.'); }
    });
    const tema = document.getElementById('temaEscuro');
    tema.checked = THEME.get() === 'dark';
    tema.addEventListener('change', () => THEME.set(tema.checked ? 'dark' : 'light'));

    document.getElementById('baixarBackup').addEventListener('click', async () => {
      const ok = await UI.salvarArquivo(`financas-${new Date().toISOString().slice(0, 10)}.backup.json`, textoBackup());
      if (ok) { D().config.ultimoBackup = new Date().toISOString(); STORE.salvar(); renderInfo(); }
    });
    document.getElementById('arquivoBackup').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const json = JSON.parse(await f.text());
        const dados = json && json.dados ? json.dados : json;
        if (!dados || !Array.isArray(dados.lancamentos)) throw new Error('Este arquivo não é um backup deste sistema.');
        /* Arquivo de um ano fechado: junta só os lançamentos daquele ano, sem apagar o resto. */
        if (json.anoFechado) {
          const ano = Number(json.anoFechado);
          const ids = new Set(D().lancamentos.map(l => l.id));
          const doAno = dados.lancamentos.filter(l => STORE.anoDe(l.mes) === ano && !ids.has(l.id));
          if (!UI.confirmar(`Trazer de volta ${doAno.length} lançamento(s) de ${ano}? Os dados atuais continuam.`)) return;
          /* pessoas/categorias/cartões removidos depois do fechamento voltam, para os nomes aparecerem */
          ['pessoas', 'categorias', 'cartoes'].forEach((k) => (dados[k] || []).forEach((x) => { if (!D()[k].some(y => y.id === x.id)) D()[k].push(x); }));
          D().lancamentos.push(...doAno);
          Object.entries(dados.ajustesFatura || {}).forEach(([id, meses]) => Object.entries(meses).forEach(([m, v]) => {
            if (STORE.anoDe(m) === ano) { D().ajustesFatura[id] = D().ajustesFatura[id] || {}; D().ajustesFatura[id][m] = v; }
          }));
          STORE.salvar();
          renderTudo();
          UI.toast(`${ano} trazido de volta (${doAno.length} lançamentos).`);
          return;
        }
        if (!UI.confirmar(`Substituir os dados deste navegador pelo backup (${dados.lancamentos.length} lançamentos)?`)) return;
        STORE.substituirTudo(dados);
        renderTudo();
        UI.toast('Backup importado.');
      } catch (err) {
        UI.toast('Não foi possível importar: ' + err.message);
      }
    });

    document.getElementById('formSenha').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('senhaMsg');
      const r = await AUTH.changePassword(e.target.atual.value, e.target.nova.value);
      msg.style.color = r.ok ? '#1e8a4c' : '';
      msg.textContent = r.ok ? 'Senha alterada neste navegador.' : r.error;
      if (r.ok) e.target.reset();
    });

    document.getElementById('apagarTudo').addEventListener('click', () => {
      if (!UI.confirmar('Apagar TODOS os dados financeiros deste navegador? Isso não pode ser desfeito.')) return;
      if (!UI.confirmar('Tem certeza? Baixou o backup?')) return;
      STORE.substituirTudo(null);
      renderTudo();
      UI.toast('Dados apagados.');
    });

    if (['#importar', '#fechar', '#ciclo'].includes(location.hash)) document.getElementById(location.hash.slice(1)).scrollIntoView();
  });
})();
