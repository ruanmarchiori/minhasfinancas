/* Gera a pasta "Financas-para-publicar" (ao lado desta pasta) só com os arquivos do app —
   sem a PLANILHA.xlsx, backups, README ou .git. É essa pasta que se arrasta no Netlify Drop
   (ou em qualquer hospedagem). A lista de arquivos é a mesma que o sw.js guarda no aparelho.
   Uso: node ferramentas/preparar-publicacao.js */
const fs = require('fs');
const path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const DEST = path.resolve(RAIZ, '..', 'Financas-para-publicar');
const sw = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
const lista = JSON.parse('[' + /const ARQUIVOS = \[([\s\S]*?)\];/.exec(sw)[1].replace(/'/g, '"') + ']').filter(f => f !== './');
fs.rmSync(DEST, { recursive: true, force: true });
for (const f of [...lista, 'sw.js']) {
  const de = path.join(RAIZ, f);
  if (!fs.existsSync(de)) throw new Error('Arquivo da lista não existe: ' + f);
  fs.mkdirSync(path.dirname(path.join(DEST, f)), { recursive: true });
  fs.copyFileSync(de, path.join(DEST, f));
}
console.log(`${lista.length + 1} arquivos em ${DEST}`);
