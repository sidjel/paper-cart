// Garde-fous : des règles de travail (CLAUDE.md, docs/ARCHITECTURE.md) vérifiées à chaque `npm test`,
// donc aussi avant chaque publication. Aucune dépendance : on lit les fichiers.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function files(dir, ext) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p, ext));
    else if (ext.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}
const read = (p) => readFileSync(p, 'utf8');
const noComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

// Exceptions approuvées par l'auteur, datées. Une nouvelle exception ne s'ajoute qu'avec son accord.
const SIZE_LIMIT = 600;
const SIZE_EXCEPTIONS = {
  'src/main.js': "approuvée par l'auteur (séance 52) ; découpé en 3 étapes à la séance 54 (1 370 → 932 lignes) ; la suite du découpage reste à décider avec l'auteur",
  'src/style.css': "approuvée par l'auteur (séance 54) jusqu'au découpage de main.js ; ensuite, découpage du CSS par sujet",
};
// CSS : flou et filtres interdits, sauf ici.
const FILTER_EXCEPTIONS = {
  '.veil-blur': "flou réel optionnel des bords pendant la rencontre, désactivé par défaut (choix A de l'auteur, séance 53)",
};
// Documents cités mais pas encore écrits (prévus), ou sources historiques.
const PLANNED_PATHS = {
  'docs/IMAGES.md': 'cahier des charges des images, à rédiger avant le prototype D',
  'tools/': "outil de conversion des dessins, à créer avant le prototype D",
  'PROMPT_CLAUDE_CODE.md': "texte d'origine de l'auteur, recopié dans PROTOTYPES.md (source historique)",
};

describe('garde-fous : taille des fichiers', () => {
  it(`aucun fichier de src/ ne dépasse ${SIZE_LIMIT} lignes, sauf exception approuvée`, () => {
    const big = [];
    for (const f of files('src', ['.js', '.css', '.json'])) {
      const n = read(f).split('\n').length;
      if (n > SIZE_LIMIT && !SIZE_EXCEPTIONS[f.replaceAll('\\', '/')]) big.push(`${f} : ${n} lignes`);
    }
    expect(big).toEqual([]);
  });
  it('une exception sans objet est retirée (le fichier existe et dépasse encore la limite)', () => {
    for (const f of Object.keys(SIZE_EXCEPTIONS)) {
      expect(existsSync(f), f).toBe(true);
      expect(read(f).split('\n').length, f).toBeGreaterThan(SIZE_LIMIT);
    }
  });
});

describe('garde-fous : règles du code', () => {
  it('src/core/ : pas de setTimeout, setInterval, Math.random, document ni window', () => {
    const bad = [];
    for (const f of files('src/core', ['.js'])) {
      const code = noComments(read(f));
      const rules = [/\bsetTimeout\s*\(/, /\bsetInterval\s*\(/, /\bMath\.random\b/, /(?<![.\w$])document\b/, /(?<![.\w$])window\b/];
      for (const r of rules) if (r.test(code)) bad.push(`${f} : ${r}`);
    }
    expect(bad).toEqual([]);
  });
  it('CSS : pas de filter, backdrop-filter ni blur, sauf exception approuvée', () => {
    const bad = [];
    for (const f of files('src', ['.css'])) {
      const css = noComments(read(f));
      for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const sel = selector.trim();
        if (/(^|[;\s])(-webkit-)?(backdrop-)?filter\s*:|blur\s*\(/.test(body) && !FILTER_EXCEPTIONS[sel]) bad.push(`${f} : ${sel}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('garde-fous : gestes du navigateur (src/input/CLAUDE.md)', () => {
  it("le zoom du navigateur reste bloqué sur toute la page, et tirer l'écran ne recharge pas (choix A de l'auteur, séance 70)", () => {
    expect(read('index.html')).toMatch(/<meta name="viewport"[^>]*user-scalable=no/);
    expect(read('src/style.css')).toMatch(/html, body \{[^}]*overscroll-behavior: none/);
    expect(read('src/style.css')).toMatch(/#game \{[^}]*touch-action: none/);
  });
});

describe('garde-fous : liens entre documents', () => {
  it('l’index « Où sont les règles » de CLAUDE.md cite des fichiers qui existent, et tous les src/*/CLAUDE.md', () => {
    const index = read('CLAUDE.md').split('## Où sont les règles')[1] ?? '';
    expect(index, 'section « Où sont les règles » présente').not.toBe('');
    const cited = [...index.matchAll(/`([\w./-]+\.md)`/g)].map((m) => m[1]);
    expect(cited.filter((p) => !existsSync(p))).toEqual([]);
    const folders = readdirSync('src').map((d) => `src/${d}/CLAUDE.md`).filter((p) => existsSync(p));
    expect(folders.filter((p) => !cited.includes(p))).toEqual([]);
  });
  it('chaque chemin de fichier cité dans docs/, CLAUDE.md et les skills existe (sauf documents prévus)', () => {
    const docs = ['CLAUDE.md', ...readdirSync('src').map((d) => `src/${d}/CLAUDE.md`).filter((f) => existsSync(f))]
      .concat(files('docs', ['.md']).filter((f) => !/docs[\\/](journal|archive)[\\/]/.test(f))) // anciens rapports : historique, tel quel
      .concat(existsSync('.claude/skills') ? files('.claude/skills', ['.md']) : []);
    const path = /(?<![\w./-])((?:docs|src|tests|public|tools|\.claude|\.github)\/[\w./-]*[\w/]|[A-Z][A-Z_]+\.md)/g;
    const missing = [];
    for (const f of docs) {
      for (const [m] of read(f).matchAll(path)) {
        const p = m.replace(/\.$/, '');
        if (PLANNED_PATHS[p] || PLANNED_PATHS[`docs/${p}`] || existsSync(p) || existsSync(`docs/${p}`)) continue;
        missing.push(`${p} (cité dans ${f})`);
      }
    }
    expect([...new Set(missing)]).toEqual([]);
  });
});
