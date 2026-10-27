# Finanças — sistema financeiro da casa

Controle financeiro pessoal/familiar feito a partir da **PLANILHA.xlsx** (Dashboard, Receitas,
Gastos Fixos, Gastos Variáveis, Cartões de Crédito, Reserva e Poupança, Metas de Longo Prazo e
Educação Financeira). Funciona no computador e no celular.

**HTML, CSS e JavaScript puros** — sem build, sem servidor e sem biblioteca de gráficos (os
gráficos são desenhados em HTML/SVG). Login reaproveitado do Controle WebHub (pasta
`Sistema Pessoal`); a identidade visual é própria: fundo cinza-claro, painéis arredondados,
menu em pílula escura (no celular, uma pílula flutuante embaixo), destaque azul-lavanda e
amarelo, e cartões desenhados como os de verdade (Nubank, Ourocard, Smiles Gold, Azul, Grafite —
escolhidos no cadastro do cartão ou deduzidos pelo nome).

## Onde ficam os dados

No **navegador** (localStorage, chave `sf_dados_v1`). Por isso roda de graça no GitHub Pages.

- Cada navegador/aparelho tem os próprios dados. Para levar do computador para o celular:
  **Configurações → Baixar backup** num aparelho e **Importar backup** no outro.
- Limpar os dados do navegador apaga o sistema — baixe backups de vez em quando.
- Nenhum dado financeiro vai para o repositório: a `PLANILHA.xlsx` e os backups
  (`*.backup.json`) estão no `.gitignore`.

## Entrar

E-mail `ruancardozo97@hotmail.com`, senha inicial **`trocar123`** — troque em Configurações
(a troca vale para o navegador onde foi feita). Como o site é estático, a senha só impede uso
casual por quem tem o link; não é proteção forte.

## Telas

| Tela | O que faz | Aba da planilha |
|---|---|---|
| `index.html` — Painel | Saldo, receitas, despesas e % poupado do mês; gráfico do ano; categorias; cartões e formas de pagamento; receitas por pessoa; resumo anual | Dashboard |
| `lancamentos.html?tipo=receita` | Receitas por pessoa e tipo (salário fixo, variável, freelance…) | Receitas |
| `lancamentos.html?tipo=fixo` | Contas do mês + **Repetir do mês anterior** | Gastos Fixos |
| `lancamentos.html?tipo=variavel` | Gastos do dia a dia | Gastos Variáveis |
| `cartoes.html` | Cartões, limite, vencimento, fatura do mês (automática + ajuste manual), quadro anual com Pix/Dinheiro/Débito | Cartões de Crédito |
| `reserva.html` | Meta, rendimento mensal e aportes; saldo com juros (meses futuros = projeção) | Reserva e Poupança |
| `metas.html` | Metas de longo prazo com entrada, pagamentos, saldo devedor e % concluído | Metas de Longo Prazo |
| `educacao.html` | As 2 calculadoras, dicas e "seus números" (reserva de emergência, % poupado) | Educação Financeira |
| `configuracoes.html` | **Importar a planilha .xlsx**, pessoas, categorias, meta de poupança, tema, backup, senha | — |

O **mês de referência** (o seletor no topo, equivalente à célula K1 do Dashboard) vale para
todas as telas. Nas telas de lançamento, a visão **Ano** mostra a grade da planilha
(categoria × Jan…Dez, Total e Média).

## Diferenças em relação à planilha

- Cada receita/gasto é **um lançamento** (mês, dia opcional, descrição, valor, categoria,
  forma de pagamento) em vez de uma linha numa grade de 12 meses — os totais são calculados.
- **Calculadora 1 corrigida:** a planilha usava `-PMT(taxa; prazo; guardado; meta)`, que trata o
  valor já guardado como dívida. Ex.: meta 20.000, 24 meses, 0,5% a.m., 2.000 guardados — a
  planilha dizia R$ 875,05/mês (que levaria a R$ 24.508); o certo é **R$ 697,77/mês**.
- **Reserva:** o saldo continua de um ano para o outro (a planilha recomeçava em janeiro).
- **Metas:** cada pagamento fica registrado com data (a planilha tinha um campo só).

### Importação da planilha (`js/planilha.js`)

Lê o .xlsx direto no navegador (nada é enviado para fora) e **substitui** os dados atuais.
Linhas com outro nome na coluna Categoria dentro de um bloco (ex.: "Agropet / Ração" dentro de
Compras Inesperadas) viram a descrição "Agropet — Ração" na categoria do bloco; o bloco
"NOVA CATEGORIA" vira a categoria **Outros**. Blocos "PESSOA 3/4 (renomeie)" vazios são ignorados.

## Estrutura

```
*.html               telas
css/app.css          todo o visual (tema claro e escuro)
js/config.js         conta de acesso
js/auth.js           login (modo local do Controle WebHub, chaves sf_*)
js/store.js          dados + todos os cálculos (totais, faturas, reserva, metas)
js/layout.js         cabeçalho, menu, título com seletor de mês, ícones, modal, formatação,
                     campos de dinheiro e o desenho dos cartões
js/planilha.js       importação da PLANILHA.xlsx
js/<tela>.js         lógica de cada tela
```

As chaves do localStorage começam com `sf_` para não misturar com o Controle WebHub — os
sites do GitHub Pages de uma mesma conta compartilham o mesmo armazenamento no navegador.

## Instalar no iPhone (app, sem GitHub)

O sistema é um **app instalável** (PWA): `manifest.webmanifest` + `sw.js` (guarda todos os
arquivos no aparelho e abre sem internet) + ícones em `icones/`. Os **dados ficam só no
iPhone** — a hospedagem serve apenas o código.

1. `node ferramentas/preparar-publicacao.js` → cria a pasta `../Financas-para-publicar` só com os
   arquivos do app (sem planilha nem backups).
2. Publicar essa pasta em qualquer hospedagem com HTTPS. Sem GitHub: **Netlify Drop**
   (app.netlify.com/drop) — criar conta grátis e arrastar a pasta.
3. No iPhone, abrir o link no **Safari** → Compartilhar → **Adicionar à Tela de Início**.
4. Abrir pelo ícone. A partir daí funciona offline.

Ao mudar o código: subir `VERSAO` no `sw.js` e o `?v=` dos HTML, gerar a pasta de novo e
arrastar outra vez no Netlify (Deploys → arrastar). O app atualiza sozinho na próxima abertura com
internet — os dados não são afetados.

**Cuidado:** se o app for apagado da tela de início, os dados vão junto. Use Configurações →
**Salvar backup** (no iPhone abre "Salvar em Arquivos"/WhatsApp/e-mail).

## Fechar o ano

Configurações → **Fechar o ano** (e um aviso no Painel quando o ano anterior ainda tem
lançamentos): salva `financas-AAAA.backup.json` e só então apaga os **dados mensais** daquele
ano (receitas, gastos fixos/variáveis, ajustes de fatura). Ficam: cartões, metas (com
pagamentos), reserva (aportes e saldo), pessoas e categorias. Importar esse arquivo em Backup
**junta** os lançamentos do ano de volta, sem apagar o ano atual.

## Publicar (GitHub Pages)

App no ar: **https://ruanmarchiori.github.io/minhasfinancas/** (repositório `ruanmarchiori/minhasfinancas`).

- `main`: código-fonte (este repositório).
- `gh-pages`: só os arquivos do app, gerados por `node ferramentas/preparar-publicacao.js`
  (pasta `../Financas-para-publicar`) e enviados com `git push -f` para o ramo `gh-pages`.

Ao mudar o código: subir `VERSAO` no `sw.js` e o `?v=` dos HTML, gerar a pasta e publicar
de novo. O iPhone atualiza sozinho na próxima abertura com internet; os dados não são afetados.
