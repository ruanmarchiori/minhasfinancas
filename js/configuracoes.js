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
    document.getElementById('infoDados').textContent = `${d.lancamentos.length} lançamento(s), ${d.cartoes.length} cartão(ões), ${d.metas.length} meta(s) · ${kb} KB guardados neste navegador.`;
  }

  function renderTudo() { renderPessoas(); renderCategorias(); renderInfo(); }

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

    document.getElementById('baixarBackup').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({ app: 'sistema-financeiro', exportadoEm: new Date().toISOString(), dados: D() }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `financas-${new Date().toISOString().slice(0, 10)}.backup.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    document.getElementById('arquivoBackup').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const json = JSON.parse(await f.text());
        const dados = json && json.dados ? json.dados : json;
        if (!dados || !Array.isArray(dados.lancamentos)) throw new Error('Este arquivo não é um backup deste sistema.');
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

    if (location.hash === '#importar') document.getElementById('importar').scrollIntoView();
  });
})();
