// Découpe les gros fichiers de contenu (u02-ex.js, ft-01.js…) en une image par fichier : img/<pack>/<clé>.webp
// et met à jour la liste IMGS dans index.html. À relancer après chaque ajout/modification d'un pack :
//   node tools/split-packs.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
global.window = global;
const list = {};
for (const f of fs.readdirSync(root).filter(f => /^(u\d+-[a-z]+|ft-\d+)\.js$/.test(f)).sort()) {
  const name = f.replace('.js', '');
  require(path.join(root, f));
  const pack = PACKS[name], dir = path.join(root, 'img', name);
  fs.mkdirSync(dir, { recursive: true });
  list[name] = [];
  for (const [k, v] of Object.entries(pack)) {
    const m = /^data:image\/webp;base64,(.*)$/.exec(v);
    if (!m) { console.warn('ignoré (pas webp):', name, k); continue; }
    fs.writeFileSync(path.join(dir, k + '.webp'), Buffer.from(m[1], 'base64'));
    list[name].push(k);
  }
  console.log(name, list[name].length, 'images');
}
const idx = path.join(root, 'index.html');
const html = fs.readFileSync(idx, 'utf8');
const re = /\/\*IMGS\*\/[\s\S]*?\/\*\/IMGS\*\//;
if (!re.test(html)) throw new Error('marqueur /*IMGS*/ introuvable dans index.html');
fs.writeFileSync(idx, html.replace(re, '/*IMGS*/' + JSON.stringify(list) + '/*/IMGS*/'));
console.log('index.html mis à jour');
