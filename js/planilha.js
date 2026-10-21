/* Importa a PLANILHA.xlsx (o modelo de controle financeiro que deu origem a este sistema).

   Tudo acontece no navegador: o .xlsx é um .zip de arquivos XML — o zip é aberto com o
   DecompressionStream nativo e as abas são lidas com DOMParser. Nada é enviado para fora.

   Conversão (planilha → sistema):
   - Receitas: cada célula com valor (pessoa × tipo de receita × mês) vira um lançamento.
   - Gastos Fixos / Variáveis: cada célula de mês com valor vira um lançamento; a coluna
     "Pagto" ao lado vira a forma de pagamento. A categoria é a do bloco (🏠 MORADIA etc.).
     Se a linha tem outro nome na coluna Categoria (ex.: "Agropet" dentro de Compras
     Inesperadas), ele vai para a descrição: "Agropet — Ração". O bloco "NOVA CATEGORIA"
     vira a categoria "Outros".
   - Cartões, ajustes manuais da fatura, Reserva (meta, rendimento, aportes) e Metas. */
const PLANILHA = (function () {
  /* ===== Leitura do .zip ===== */
  async function descompactar(dados, metodo) {
    if (metodo === 0) return dados;
    if (metodo !== 8) throw new Error('Compressão não suportada no arquivo.');
    if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador não consegue abrir .xlsx. Use Chrome, Edge, Firefox ou Safari atualizados.');
    const stream = new Blob([dados]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function abrirZip(buffer) {
    const v = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    let fim = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
      if (v.getUint32(i, true) === 0x06054b50) { fim = i; break; }
    }
    if (fim < 0) throw new Error('O arquivo não parece ser uma planilha .xlsx.');
    const total = v.getUint16(fim + 10, true);
    let p = v.getUint32(fim + 16, true);
    const arquivos = {};
    const dec = new TextDecoder();
    for (let k = 0; k < total; k++) {
      if (v.getUint32(p, true) !== 0x02014b50) break;
      const metodo = v.getUint16(p + 10, true);
      const tam = v.getUint32(p + 20, true);
      const nLen = v.getUint16(p + 28, true), xLen = v.getUint16(p + 30, true), cLen = v.getUint16(p + 32, true);
      const local = v.getUint32(p + 42, true);
      const nome = dec.decode(bytes.subarray(p + 46, p + 46 + nLen));
      const inicio = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      arquivos[nome] = { metodo, dados: bytes.subarray(inicio, inicio + tam) };
      p += 46 + nLen + xLen + cLen;
    }
    return {
      async texto(nome) {
        const a = arquivos[nome];
        if (!a) return null;
        return dec.decode(await descompactar(a.dados, a.metodo));
      }
    };
  }

  const xml = (t) => new DOMParser().parseFromString(t, 'application/xml');
  const colIdx = (letras) => [...letras].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

  /* Devolve { nomeDaAba: { linhas: Map<linha, Map<coluna, valor>> } }. */
  async function lerXlsx(arquivo) {
    const zip = await abrirZip(await arquivo.arrayBuffer());
    const wb = await zip.texto('xl/workbook.xml');
    if (!wb) throw new Error('O arquivo não parece ser uma planilha .xlsx.');
    const relsDoc = xml(await zip.texto('xl/_rels/workbook.xml.rels'));
    const rels = {};
    [...relsDoc.getElementsByTagName('Relationship')].forEach(r => { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
    const ssTxt = await zip.texto('xl/sharedStrings.xml');
    const compartilhadas = ssTxt ? [...xml(ssTxt).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join('')) : [];

    const abas = {};
    for (const s of [...xml(wb).getElementsByTagName('sheet')]) {
      const rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
      const alvo = (rels[rid] || '').replace(/^\/?(xl\/)?/, 'xl/');
      const txt = await zip.texto(alvo);
      if (!txt) continue;
      const linhas = new Map();
      [...xml(txt).getElementsByTagName('c')].forEach((c) => {
        const ref = c.getAttribute('r');
        const m = /^([A-Z]+)(\d+)$/.exec(ref || '');
        if (!m) return;
        const t = c.getAttribute('t');
        const vEl = c.getElementsByTagName('v')[0];
        let valor;
        if (t === 's' && vEl) valor = compartilhadas[Number(vEl.textContent)];
        else if (t === 'inlineStr') valor = [...c.getElementsByTagName('t')].map(x => x.textContent).join('');
        else if (vEl) valor = (t === 'str' || t === 'e') ? vEl.textContent : Number(vEl.textContent);
        if (valor === undefined || valor === '') return;
        const lin = Number(m[2]);
        if (!linhas.has(lin)) linhas.set(lin, new Map());
        linhas.get(lin).set(colIdx(m[1]), valor);
      });
      abas[s.getAttribute('name')] = { linhas };
    }
    return abas;
  }

  /* ===== Conversão para o formato do sistema ===== */
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const titulo = (s) => String(s).toLowerCase().replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase());
  const vazioOuMarcador = (s) => !s || /^\(nova/.test(norm(s));
  const num = (v) => typeof v === 'number' ? v : (parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')) || 0);
  const serialParaData = (n) => new Date(Date.UTC(1899, 11, 30) + n * 86400000).toISOString().slice(0, 10);

  function acharAba(abas, ...nomes) {
    const chaves = Object.keys(abas);
    for (const n of nomes) {
      const k = chaves.find(c => norm(c).includes(norm(n)));
      if (k) return abas[k];
    }
    return null;
  }
  const cel = (aba, lin, col) => { const l = aba && aba.linhas.get(lin); return l ? l.get(col) : undefined; };
  const linhasOrdenadas = (aba) => [...aba.linhas.keys()].sort((a, b) => a - b);

  /* Ano: o título das abas traz "- 2026". */
  function anoDa(abas) {
    for (const aba of Object.values(abas)) {
      const a1 = cel(aba, 1, 0);
      const m = /(20\d{2})/.exec(String(a1 || ''));
      if (m) return Number(m[1]);
    }
    return new Date().getFullYear();
  }

  function converter(abas) {
    const d = STORE.normalizar({ pessoas: [], categorias: [], cartoes: [], lancamentos: [], metas: [] });
    const ano = anoDa(abas);
    const mesStr = (i) => `${ano}-${String(i + 1).padStart(2, '0')}`;
    const avisos = [];

    /* --- Cartões (antes dos gastos, que apontam para eles pelo nome) --- */
    const abaCart = acharAba(abas, 'Cartões de Crédito', 'Cartoes');
    const cartaoPorNome = (nome, criar) => {
      const n = norm(nome);
      let c = d.cartoes.find(x => norm(x.nome) === n);
      if (!c && criar) { c = { id: STORE.uid('car'), nome: String(nome).trim(), bandeira: '', limite: 0, vencimento: '' }; d.cartoes.push(c); }
      return c;
    };
    if (abaCart) {
      let lin = 5;
      while (true) {
        const nome = cel(abaCart, lin, 0);
        if (nome === undefined && cel(abaCart, lin, 2) === undefined) break;
        if (nome && !/^\+/.test(String(nome))) {
          const c = cartaoPorNome(nome, true);
          c.bandeira = String(cel(abaCart, lin, 1) || '');
          c.limite = num(cel(abaCart, lin, 2));
          const venc = /(\d{1,2})/.exec(String(cel(abaCart, lin, 5) || ''));
          c.vencimento = venc ? Number(venc[1]) : '';
        }
        lin++;
        if (lin > 40) break;
      }
      /* "Faturas Mensais por Cartão" (ajuste manual), até "TOTAL FATURAS". */
      const ini = linhasOrdenadas(abaCart).find(l => norm(cel(abaCart, l, 0)).startsWith('faturas mensais'));
      if (ini) {
        for (let l = ini + 2; l < ini + 30; l++) {
          const nome = cel(abaCart, l, 0);
          if (nome && /^total/.test(norm(nome))) break;
          if (!nome || /^\+/.test(String(nome))) continue;
          const c = cartaoPorNome(nome, false);
          if (!c) continue;
          for (let i = 0; i < 12; i++) {
            const v = num(cel(abaCart, l, 1 + i));
            if (v) { d.ajustesFatura[c.id] = d.ajustesFatura[c.id] || {}; d.ajustesFatura[c.id][mesStr(i)] = v; }
          }
        }
      }
    }
    function forma(valor) {
      const n = norm(valor);
      if (!n) return '';
      if (n === 'pix') return 'pix';
      if (n === 'dinheiro') return 'dinheiro';
      if (n.startsWith('debito')) return 'debito';
      return cartaoPorNome(valor, true).id;
    }

    /* --- Receitas --- */
    const abaRec = acharAba(abas, 'Receitas');
    if (abaRec) {
      let pessoaAtual = null;
      const TIPOS = STORE.TIPOS_RECEITA;
      linhasOrdenadas(abaRec).forEach((l) => {
        const tipo = norm(cel(abaRec, l, 31));            // AF: Tipo (auxiliar)
        const a = cel(abaRec, l, 0);
        if (tipo === 'cabecalho') {
          const nome = String(a || '').replace(/^\S*👤\S*\s*/u, '').replace(/^[^\p{L}]+/u, '').trim();
          pessoaAtual = { nome: /renomeie/i.test(nome) ? nome : titulo(nome), id: STORE.uid('pes'), usada: false, placeholder: /renomeie/i.test(nome) };
          d.pessoas.push(pessoaAtual);
          return;
        }
        if (tipo !== 'item' || !pessoaAtual) return;
        const tipoReceita = TIPOS.find(t => norm(t) === norm(a)) || (TIPOS.find(t => norm(a) && norm(t).startsWith(norm(a).split(' ')[0])) || 'Outra receita');
        for (let i = 0; i < 12; i++) {
          const v = num(cel(abaRec, l, 1 + i));
          if (!v) continue;
          pessoaAtual.usada = true;
          d.lancamentos.push({ id: STORE.uid('lan'), tipo: 'receita', mes: mesStr(i), dia: '', descricao: vazioOuMarcador(a) ? '' : (tipoReceita === 'Outra receita' ? String(a) : ''), valor: v, pessoa: pessoaAtual.id, tipoReceita, criadoEm: new Date().toISOString() });
        }
      });
      /* Blocos "PESSOA 3 (renomeie)" vazios não viram pessoas. */
      d.pessoas = d.pessoas.filter(p => p.usada || !p.placeholder).map(({ id, nome }) => ({ id, nome }));
    }
    if (!d.pessoas.length) d.pessoas = STORE.normalizar({}).pessoas;

    /* --- Gastos fixos e variáveis --- */
    const categoriaPorNome = (nome, tipo, icone) => {
      let c = d.categorias.find(x => norm(x.nome) === norm(nome));
      if (!c) { c = { id: STORE.uid('cat'), nome, tipo, icone: icone || '🏷️' }; d.categorias.push(c); }
      return c;
    };
    function lerGastos(aba, tipo) {
      if (!aba) return;
      const linhas = linhasOrdenadas(aba);
      let bloco = [];
      let iconeBloco = '';
      linhas.forEach((l) => {
        const t = norm(cel(aba, l, 31));                // AF
        if (t === 'cabecalho') {
          bloco = [];
          const cab = String(cel(aba, l, 0) || '');
          iconeBloco = (/^(\S+)\s/.exec(cab) || [])[1] || '';
          if (/^[\p{L}\d]/u.test(iconeBloco)) iconeBloco = '';
          return;
        }
        if (t === 'subcategoria') { bloco.push(l); return; }
        if (t !== 'subtotal') return;
        const nomeBloco = String(cel(aba, l, 32) || '').trim() || 'Outros';   // AG
        const ehNova = norm(nomeBloco) === 'nova categoria';
        /* "Outros" só é criada se o bloco NOVA CATEGORIA tiver algum valor. */
        const temValor = bloco.some(lin => { for (let i = 0; i < 12; i++) if (num(cel(aba, lin, 2 + i * 2))) return true; return false; });
        if (ehNova && !temValor) { bloco = []; return; }
        const cat = ehNova ? categoriaPorNome('Outros', 'variavel', '📦') : categoriaPorNome(nomeBloco, tipo, iconeBloco);
        bloco.forEach((lin) => {
          const a = String(cel(aba, lin, 0) || '').trim();
          const b = String(cel(aba, lin, 1) || '').trim();
          const sub = vazioOuMarcador(b) ? '' : b;
          const descricao = norm(a) === norm(nomeBloco) || !a ? sub : (norm(a) === norm(sub) ? a : [a, sub].filter(Boolean).join(' — '));
          for (let i = 0; i < 12; i++) {
            const v = num(cel(aba, lin, 2 + i * 2));
            if (!v) continue;
            d.lancamentos.push({ id: STORE.uid('lan'), tipo, mes: mesStr(i), dia: '', descricao, valor: v, categoria: cat.id, forma: forma(cel(aba, lin, 3 + i * 2)), criadoEm: new Date().toISOString() });
          }
        });
        bloco = [];
      });
    }
    lerGastos(acharAba(abas, 'Gastos Fixos'), 'fixo');
    lerGastos(acharAba(abas, 'Gastos Variáveis', 'Gastos Variaveis'), 'variavel');
    /* Categorias padrão que a planilha não tinha continuam disponíveis. */
    STORE.normalizar({}).categorias.forEach(c => categoriaPorNome(c.nome, c.tipo, c.icone));
    /* "Outros" sempre por último. */
    d.categorias.sort((x, y) => (norm(x.nome) === 'outros') - (norm(y.nome) === 'outros'));

    /* --- Reserva --- */
    const abaRes = acharAba(abas, 'Reserva');
    if (abaRes) {
      linhasOrdenadas(abaRes).forEach((l) => {
        for (let c = 0; c < 8; c++) {
          const rot = norm(cel(abaRes, l, c));
          if (rot.startsWith('meta da reserva')) d.reserva.meta = num(cel(abaRes, l, c + 1));
          if (rot.startsWith('rendimento mensal')) d.reserva.rendimento = num(cel(abaRes, l, c + 1));
        }
        const i = STORE.MESES_LONGOS.findIndex(m => norm(m) === norm(cel(abaRes, l, 0)));
        const v = num(cel(abaRes, l, 1));
        if (i >= 0 && v) d.reserva.aportes[mesStr(i)] = v;
      });
    }

    /* --- Metas --- */
    const abaMet = acharAba(abas, 'Metas');
    if (abaMet) {
      const cab = linhasOrdenadas(abaMet).find(l => norm(cel(abaMet, l, 0)) === 'meta');
      if (cab) {
        for (let l = cab + 1; l < cab + 60; l++) {
          const nome = cel(abaMet, l, 0);
          if (nome && (/^total/.test(norm(nome)))) break;
          if (!nome || /^\+/.test(String(nome))) continue;
          const ini = cel(abaMet, l, 5);
          const adicional = num(cel(abaMet, l, 6));
          const catMeta = STORE.CATEGORIAS_META.find(c => norm(c) === norm(cel(abaMet, l, 1))) || 'Outro';
          d.metas.push({
            id: STORE.uid('met'), nome: String(nome), categoria: catMeta,
            valorTotal: num(cel(abaMet, l, 2)), entrada: num(cel(abaMet, l, 3)),
            dataInicio: typeof ini === 'number' ? serialParaData(ini) : '',
            pagamentos: adicional ? [{ id: STORE.uid('pag'), data: '', valor: adicional }] : []
          });
        }
      }
    }

    if (!d.lancamentos.length) avisos.push('Nenhum valor de receita ou gasto foi encontrado.');
    return { dados: d, ano, avisos };
  }

  /* Resumo para mostrar antes de confirmar. */
  function resumo(d) {
    const meses = [...new Set(d.lancamentos.map(l => l.mes))].sort();
    const porMes = meses.map((m) => {
      const lm = d.lancamentos.filter(l => l.mes === m);
      const s = (t) => lm.filter(l => l.tipo === t).reduce((a, l) => a + l.valor, 0);
      return { mes: m, receitas: s('receita'), fixos: s('fixo'), variaveis: s('variavel'), qtd: lm.length };
    });
    return { meses: porMes, pessoas: d.pessoas.length, categorias: d.categorias.length, cartoes: d.cartoes.length, metas: d.metas.length, aportes: Object.keys(d.reserva.aportes).length, lancamentos: d.lancamentos.length };
  }

  return { lerXlsx, converter, resumo };
})();
