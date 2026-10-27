/* Dados e cálculos do Sistema Financeiro.

   Tudo fica num único documento JSON no localStorage (chave sf_dados_v1). As telas leem de
   forma síncrona (STORE.dados, STORE.totais(...)) e gravam com STORE.salvar() depois de mudar
   alguma coisa. Para um dia trocar por servidor, só carregar() e salvar() precisam mudar.

   Modelo (equivale às abas da planilha):
   - lancamentos: cada receita ou gasto é UMA linha { tipo: 'receita'|'fixo'|'variavel',
     mes: 'AAAA-MM', dia, descricao, valor, categoria (gastos), pessoa e tipoReceita
     (receitas), forma (pix, dinheiro, debito ou o id de um cartão) }. A planilha guardava
     isso como uma grade de 12 meses; aqui os totais por mês/categoria/cartão são calculados.
   - cartoes, ajustesFatura (o "Ajuste Manual" da aba Cartões), reserva, metas.

   O "mês de referência" (célula K1 do Dashboard) vale para todas as telas e fica salvo no
   aparelho (sf_mes). */
const STORE = (function () {
  const CHAVE = 'sf_dados_v1';
  const CHAVE_MES = 'sf_mes';

  const TIPOS_RECEITA = [
    'Salário Fixo',
    'Renda Variável / Comissões',
    'Freelance / Renda Extra',
    'Bônus / 13º Salário',
    'Rendimentos / Investimentos',
    'Outra receita'
  ];
  /* Renda fixa = salário fixo; todo o resto é renda variável (como no Dashboard da planilha). */
  const RENDA_FIXA = 'Salário Fixo';

  const FORMAS_FIXAS = [
    { id: 'pix', nome: 'Pix' },
    { id: 'dinheiro', nome: 'Dinheiro' },
    { id: 'debito', nome: 'Débito' }
  ];

  const CATEGORIAS_META = ['Carro', 'Moto', 'Casa', 'Terreno', 'Projeto', 'Outro'];

  const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  function uid(prefixo) {
    return (prefixo || 'x') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  /* Estrutura inicial: as categorias e pessoas que a planilha já trazia. */
  function dadosIniciais() {
    const cat = (nome, tipo, icone) => ({ id: uid('cat'), nome, tipo, icone });
    return {
      versao: 1,
      pessoas: [{ id: uid('pes'), nome: 'Ruan' }, { id: uid('pes'), nome: 'Nathália' }],
      categorias: [
        cat('Moradia', 'fixo', '🏠'),
        cat('Utilidades', 'fixo', '💡'),
        cat('Assinaturas', 'fixo', '📺'),
        cat('Alimentação', 'variavel', '🍔'),
        cat('Transporte', 'variavel', '🚗'),
        cat('Compras Inesperadas', 'variavel', '🎲'),
        cat('Saúde', 'variavel', '🏥'),
        cat('Educação', 'variavel', '🎓'),
        cat('Roupas', 'variavel', '👗'),
        cat('Outros', 'variavel', '📦')
      ],
      cartoes: [],
      lancamentos: [],
      ajustesFatura: {},
      reserva: { meta: 20000, rendimento: 0.005, aportes: {} },
      metas: [],
      config: { metaPoupanca: 0.2 }
    };
  }

  /* Garante todos os campos (backup antigo, importação parcial...). */
  function normalizar(d) {
    const base = dadosIniciais();
    const r = d && typeof d === 'object' ? d : {};
    return {
      versao: 1,
      pessoas: Array.isArray(r.pessoas) ? r.pessoas : base.pessoas,
      categorias: Array.isArray(r.categorias) ? r.categorias : base.categorias,
      cartoes: Array.isArray(r.cartoes) ? r.cartoes : [],
      lancamentos: Array.isArray(r.lancamentos) ? r.lancamentos : [],
      ajustesFatura: r.ajustesFatura && typeof r.ajustesFatura === 'object' ? r.ajustesFatura : {},
      reserva: Object.assign({}, base.reserva, r.reserva || {}, { aportes: (r.reserva && r.reserva.aportes) || {} }),
      metas: Array.isArray(r.metas) ? r.metas : [],
      config: Object.assign({}, base.config, r.config || {})
    };
  }

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) return normalizar(JSON.parse(bruto));
    } catch (e) { console.error(e); }
    return dadosIniciais();
  }

  let dados = carregar();

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(dados));
      return true;
    } catch (e) {
      console.error(e);
      if (window.UI) UI.toast('Não foi possível salvar: o navegador bloqueou ou está sem espaço.');
      return false;
    }
  }

  function substituirTudo(novos) {
    dados = normalizar(novos);
    salvar();
  }

  /* ===== Mês de referência ===== */
  function hojeMes() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  function mesRef() {
    const m = localStorage.getItem(CHAVE_MES);
    return /^\d{4}-\d{2}$/.test(m || '') ? m : hojeMes();
  }
  function setMesRef(m) { localStorage.setItem(CHAVE_MES, m); }
  function somarMes(m, n) {
    const [a, mm] = m.split('-').map(Number);
    const d = new Date(a, mm - 1 + n, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const anoDe = (m) => Number(m.slice(0, 4));
  const mesesDoAno = (ano) => MESES_CURTOS.map((_, i) => `${ano}-${String(i + 1).padStart(2, '0')}`);
  const nomeMes = (m, longo) => (longo ? MESES_LONGOS : MESES_CURTOS)[Number(m.slice(5, 7)) - 1] + '/' + m.slice(0, 4);

  /* ===== Consultas ===== */
  const pessoa = (id) => dados.pessoas.find(p => p.id === id) || null;
  const categoria = (id) => dados.categorias.find(c => c.id === id) || null;
  const cartao = (id) => dados.cartoes.find(c => c.id === id) || null;
  function formas() {
    return [...dados.cartoes.map(c => ({ id: c.id, nome: c.nome, cartao: true })), ...FORMAS_FIXAS];
  }
  function nomeForma(id) {
    if (!id) return '—';
    const f = FORMAS_FIXAS.find(x => x.id === id);
    if (f) return f.nome;
    const c = cartao(id);
    return c ? c.nome : '(cartão removido)';
  }

  const soma = (lista) => lista.reduce((s, l) => s + (Number(l.valor) || 0), 0);
  function doMes(m, tipo) {
    return dados.lancamentos.filter(l => l.mes === m && (!tipo || l.tipo === tipo));
  }
  const ehDespesa = (l) => l.tipo === 'fixo' || l.tipo === 'variavel';

  /* Totais de um mês — os 4 cards do Dashboard. */
  function totais(m) {
    const receitas = soma(doMes(m, 'receita'));
    const fixos = soma(doMes(m, 'fixo'));
    const variaveis = soma(doMes(m, 'variavel'));
    const despesas = fixos + variaveis;
    const saldo = receitas - despesas;
    return { receitas, fixos, variaveis, despesas, saldo, poupado: receitas > 0 ? saldo / receitas : 0 };
  }

  /* "Principais categorias" — valor e % das despesas do mês, maior primeiro. */
  function porCategoria(m, tipo) {
    const lista = doMes(m).filter(l => tipo ? l.tipo === tipo : ehDespesa(l));
    const total = soma(lista);
    const mapa = new Map();
    lista.forEach((l) => mapa.set(l.categoria, (mapa.get(l.categoria) || 0) + (Number(l.valor) || 0)));
    return [...mapa.entries()]
      .map(([id, valor]) => {
        const c = categoria(id);
        return { id, nome: c ? c.nome : '(sem categoria)', icone: c ? c.icone : '•', valor, pct: total > 0 ? valor / total : 0 };
      })
      .sort((a, b) => b.valor - a.valor);
  }

  /* "Receitas por pessoa" — renda fixa (salário), variável e total do mês. */
  function porPessoa(m) {
    const lista = doMes(m, 'receita');
    const total = soma(lista);
    return dados.pessoas.map((p) => {
      const dela = lista.filter(l => l.pessoa === p.id);
      const fixa = soma(dela.filter(l => l.tipoReceita === RENDA_FIXA));
      const tot = soma(dela);
      return { id: p.id, nome: p.nome, fixa, variavel: tot - fixa, total: tot, pct: total > 0 ? tot / total : 0 };
    });
  }

  /* Fatura de um cartão no mês: soma automática dos gastos pagos com ele + ajuste manual. */
  function ajusteFatura(cartaoId, m) {
    return Number(((dados.ajustesFatura[cartaoId] || {})[m])) || 0;
  }
  function setAjusteFatura(cartaoId, m, valor) {
    dados.ajustesFatura[cartaoId] = dados.ajustesFatura[cartaoId] || {};
    if (valor) dados.ajustesFatura[cartaoId][m] = valor;
    else delete dados.ajustesFatura[cartaoId][m];
  }
  function gastosNaForma(formaId, m) {
    return soma(doMes(m).filter(l => ehDespesa(l) && l.forma === formaId));
  }
  function fatura(cartaoId, m) {
    return gastosNaForma(cartaoId, m) + ajusteFatura(cartaoId, m);
  }

  /* Série dos 12 meses do ano (base dos gráficos e do resumo anual). */
  function serieAno(ano) {
    let acumulado = 0;
    return mesesDoAno(ano).map((m) => {
      const t = totais(m);
      acumulado += t.saldo;
      return { mes: m, ...t, acumulado };
    });
  }

  /* Resumo anual (coluna J/M do Dashboard). */
  function resumoAno(ano) {
    const doAno = dados.lancamentos.filter(l => anoDe(l.mes) === ano);
    const receitas = soma(doAno.filter(l => l.tipo === 'receita'));
    const salario = soma(doAno.filter(l => l.tipo === 'receita' && l.tipoReceita === RENDA_FIXA));
    const fixos = soma(doAno.filter(l => l.tipo === 'fixo'));
    const variaveis = soma(doAno.filter(l => l.tipo === 'variavel'));
    const metas = totaisMetas();
    return {
      salario, rendaVariavel: receitas - salario, receitas, fixos, variaveis,
      despesas: fixos + variaveis, sobra: receitas - fixos - variaveis,
      totalMetas: metas.total, pagoMetas: metas.pago
    };
  }

  /* ===== Reserva / Poupança =====
     Mesma conta da planilha: rendimento do mês = saldo do mês anterior × taxa; saldo =
     saldo anterior + aporte + rendimento. Aqui o saldo continua de um ano para o outro
     (a planilha recomeçava do zero em janeiro). */
  function tabelaReserva(ano) {
    const r = dados.reserva;
    const taxa = Number(r.rendimento) || 0;
    const meses = Object.keys(r.aportes).filter(m => Number(r.aportes[m])).sort();
    const inicio = meses.length ? Math.min(anoDe(meses[0]), ano) : ano;
    let saldo = 0;
    let linhas = [];
    for (let a = inicio; a <= ano; a++) {
      linhas = mesesDoAno(a).map((m) => {
        const aporte = Number(r.aportes[m]) || 0;
        const rendimento = saldo * taxa;
        saldo = saldo + aporte + rendimento;
        return { mes: m, aporte, rendimento, saldo, pctMeta: r.meta > 0 ? saldo / r.meta : 0 };
      });
    }
    const aportado = linhas.reduce((s, l) => s + l.aporte, 0);
    const rendimentos = linhas.reduce((s, l) => s + l.rendimento, 0);
    return { linhas, aportado, rendimentos, saldoFinal: saldo, pctMeta: r.meta > 0 ? saldo / r.meta : 0 };
  }
  function saldoReservaAte(m) {
    const t = tabelaReserva(anoDe(m));
    const l = t.linhas.find(x => x.mes === m);
    return l ? l.saldo : 0;
  }

  /* ===== Metas de longo prazo ===== */
  function calcMeta(meta) {
    const total = Number(meta.valorTotal) || 0;
    const entrada = Number(meta.entrada) || 0;
    const adicional = (meta.pagamentos || []).reduce((s, p) => s + (Number(p.valor) || 0), 0);
    const pago = entrada + adicional;
    return {
      total, entrada, financiado: total - entrada, adicional, pago,
      saldoDevedor: Math.max(0, total - pago), pct: total > 0 ? Math.min(1, pago / total) : 0
    };
  }
  function totaisMetas() {
    return dados.metas.reduce((acc, m) => {
      const c = calcMeta(m);
      acc.total += c.total; acc.entrada += c.entrada; acc.financiado += c.financiado;
      acc.adicional += c.adicional; acc.pago += c.pago; acc.saldoDevedor += c.saldoDevedor;
      return acc;
    }, { total: 0, entrada: 0, financiado: 0, adicional: 0, pago: 0, saldoDevedor: 0 });
  }

  /* ===== Gravações ===== */
  function salvarLancamento(l) {
    const i = dados.lancamentos.findIndex(x => x.id === l.id);
    if (i >= 0) dados.lancamentos[i] = l; else dados.lancamentos.push(l);
    salvar();
  }
  function removerLancamento(id) {
    dados.lancamentos = dados.lancamentos.filter(l => l.id !== id);
    salvar();
  }
  /* ===== Compras parceladas =====
     Uma compra em N vezes vira N lançamentos, um por mês, ligados pelo mesmo "grupo":
     parcela: { grupo, n (número desta parcela), de (total de parcelas), total (valor da compra) }.
     "inicio" > 1 serve para compras que já estavam rodando: cria só da parcela "inicio" em diante,
     a primeira no mês escolhido. Centavos que sobram da divisão vão para a última parcela. */
  function lancarParcelado(base, de, inicio, valorTotal) {
    const grupo = uid('par');
    const centavos = Math.round(valorTotal * 100);
    const parcela = Math.floor(centavos / de);
    const criados = [];
    for (let n = inicio; n <= de; n++) {
      const valor = (n === de ? centavos - parcela * (de - 1) : parcela) / 100;
      const l = { ...base, id: uid('lan'), mes: somarMes(base.mes, n - inicio), valor, parcela: { grupo, n, de, total: valorTotal }, criadoEm: new Date().toISOString() };
      dados.lancamentos.push(l);
      criados.push(l);
    }
    salvar();
    return criados;
  }
  /* Compras parceladas (um item por compra), com a situação no mês "ref". */
  const chaveCompra = (l) => [l.tipo, (l.descricao || '').trim().toLowerCase(), l.forma || '', l.parcela.de, Math.round(l.parcela.total * 100)].join('|');
  function comprasParceladas(ref) {
    const grupos = new Map();
    dados.lancamentos.filter(l => l.parcela).forEach((l) => {
      if (!grupos.has(l.parcela.grupo)) grupos.set(l.parcela.grupo, []);
      grupos.get(l.parcela.grupo).push(l);
    });
    const lista = [...grupos.values()].map((ps) => {
      ps.sort((a, b) => a.parcela.n - b.parcela.n);
      const p0 = ps[0], ult = ps[ps.length - 1];
      /* mês em que cai a parcela 1 (mesmo que ela não tenha sido lançada) */
      const mes1 = somarMes(p0.mes, 1 - p0.parcela.n);
      const futuras = ps.filter(x => x.mes >= ref);
      return {
        grupo: p0.parcela.grupo, descricao: p0.descricao, forma: p0.forma, tipo: p0.tipo, categoria: p0.categoria,
        de: p0.parcela.de, total: p0.parcela.total, valorParcela: p0.valor, lancadas: ps.length,
        inicio: p0.mes, fim: ult.mes, mes1,
        atual: ps.find(x => x.mes === ref) || null,
        restante: futuras.reduce((s, x) => s + (Number(x.valor) || 0), 0), qtdRestante: futuras.length,
        chave: chaveCompra(p0), mesesSobrepostos: ps.map(x => x.mes)
      };
    });
    /* Duplicada provável: outra compra com mesma descrição, cartão, nº de parcelas e total,
       cobrindo os mesmos meses. */
    lista.forEach((c) => {
      c.duplicadaDe = lista.filter(o => o !== c && o.chave === c.chave && o.mes1 === c.mes1).length;
    });
    return lista.sort((a, b) => (a.forma || '').localeCompare(b.forma || '') || a.inicio.localeCompare(b.inicio) || (a.descricao || '').localeCompare(b.descricao || ''));
  }
  /* Antes de lançar: já existe a mesma compra? */
  function compraParecida(base, de, valorTotal, mesParcela1) {
    return comprasParceladas('0000-00').find(c => c.chave === chaveCompra({ ...base, parcela: { de, total: valorTotal } }) && c.mes1 === mesParcela1) || null;
  }
  function removerCompra(grupo) {
    const antes = dados.lancamentos.length;
    dados.lancamentos = dados.lancamentos.filter(l => !(l.parcela && l.parcela.grupo === grupo));
    salvar();
    return antes - dados.lancamentos.length;
  }
  /* Lançamento simples igual já existente (mesmo mês, valor, descrição, forma). */
  function lancamentoParecido(l) {
    return dados.lancamentos.find(x => x.id !== l.id && !x.parcela && x.tipo === l.tipo && x.mes === l.mes && Math.round(x.valor * 100) === Math.round(l.valor * 100)
      && (x.descricao || '').trim().toLowerCase() === (l.descricao || '').trim().toLowerCase() && (x.forma || '') === (l.forma || '') && (x.pessoa || '') === (l.pessoa || '')) || null;
  }

  function parcelasDoGrupo(grupo) {
    return dados.lancamentos.filter(l => l.parcela && l.parcela.grupo === grupo).sort((a, b) => a.parcela.n - b.parcela.n);
  }
  /* Exclui esta parcela e as seguintes (ex.: compra quitada antes / cancelada). */
  function removerParcelasDesde(l) {
    const antes = dados.lancamentos.length;
    dados.lancamentos = dados.lancamentos.filter(x => !(x.parcela && l.parcela && x.parcela.grupo === l.parcela.grupo && x.parcela.n >= l.parcela.n));
    salvar();
    return antes - dados.lancamentos.length;
  }

  /* "Repetir do mês anterior": copia os lançamentos de um tipo para o mês atual (contas
     fixas, salário). Não duplica o que já foi copiado antes. Parcelas não são copiadas —
     cada mês já tem a sua. */
  function repetirDoMes(tipo, de, para) {
    const origem = doMes(de, tipo).filter(l => !l.parcela);
    const jaTem = new Set(doMes(para, tipo).map(l => l.origem).filter(Boolean));
    let n = 0;
    origem.forEach((l) => {
      if (jaTem.has(l.id)) return;
      dados.lancamentos.push({ ...l, id: uid('lan'), mes: para, origem: l.id, criadoEm: new Date().toISOString() });
      n++;
    });
    if (n) salvar();
    return n;
  }
  /* Ao remover pessoa/categoria/cartão, os lançamentos continuam existindo (só perdem a
     referência e aparecem como "(sem categoria)" etc.). */
  function remover(lista, id) {
    dados[lista] = dados[lista].filter(x => x.id !== id);
    salvar();
  }
  function emUso(campo, id) {
    return dados.lancamentos.filter(l => l[campo] === id).length;
  }

  /* ===== Fechar o ano =====
     Apaga só os dados mensais do ano (receitas, gastos fixos/variáveis e ajustes de fatura).
     Mantém pessoas, categorias, cartões, metas (com pagamentos) e a reserva (aportes e saldo
     continuam correndo no ano novo). O backup do ano é salvo antes, pela tela. */
  function anosComLancamentos() {
    return [...new Set(dados.lancamentos.map(l => anoDe(l.mes)))].sort();
  }
  /* Ano anterior ao atual que ainda tem lançamentos (para o aviso de janeiro). */
  function anoParaFechar() {
    const atual = anoDe(hojeMes());
    const fechados = dados.config.anosFechados || [];
    return anosComLancamentos().filter(a => a < atual && !fechados.includes(a))[0] || null;
  }
  function fecharAno(ano) {
    const antes = dados.lancamentos.length;
    dados.lancamentos = dados.lancamentos.filter(l => anoDe(l.mes) !== ano);
    Object.keys(dados.ajustesFatura).forEach((id) => {
      Object.keys(dados.ajustesFatura[id]).forEach((m) => { if (anoDe(m) === ano) delete dados.ajustesFatura[id][m]; });
    });
    dados.config.anosFechados = [...new Set([...(dados.config.anosFechados || []), ano])].sort();
    salvar();
    return antes - dados.lancamentos.length;
  }

  return {
    get dados() { return dados; },
    anosComLancamentos, anoParaFechar, fecharAno,
    salvar, substituirTudo, normalizar, uid,
    TIPOS_RECEITA, RENDA_FIXA, FORMAS_FIXAS, CATEGORIAS_META, MESES_CURTOS, MESES_LONGOS,
    mesRef, setMesRef, somarMes, anoDe, mesesDoAno, nomeMes, hojeMes,
    pessoa, categoria, cartao, formas, nomeForma, doMes, ehDespesa, soma,
    totais, porCategoria, porPessoa, fatura, ajusteFatura, setAjusteFatura, gastosNaForma,
    serieAno, resumoAno, tabelaReserva, saldoReservaAte, calcMeta, totaisMetas,
    salvarLancamento, removerLancamento, repetirDoMes, remover, emUso,
    lancarParcelado, parcelasDoGrupo, removerParcelasDesde, comprasParceladas, compraParecida, removerCompra, lancamentoParecido
  };
})();
