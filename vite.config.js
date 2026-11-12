import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

// Numéro de version affiché dans le jeu : identifiant court du commit + date.
function gitInfo() {
  try {
    const commit = execSync('git rev-parse --short HEAD').toString().trim();
    const iso = execSync('git log -1 --format=%cI').toString().trim();
    return { commit, iso };
  } catch {
    return { commit: (process.env.GITHUB_SHA || 'local').slice(0, 7), iso: new Date().toISOString() };
  }
}

function frenchDate(iso) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export default defineConfig(({ command }) => {
  const { commit, iso } = gitInfo();
  const label = command === 'serve' ? `${commit} · dev` : `${commit} · ${frenchDate(iso)}`;
  return {
    // Chemins relatifs : le jeu fonctionne dans le sous-dossier /paper-cart/ de GitHub Pages.
    base: './',
    define: { __VERSION__: JSON.stringify(label) },
    server: { host: true },
    preview: { host: true },
    build: { target: 'es2022', assetsInlineLimit: 0 },
    test: { include: ['tests/unit/**/*.test.js'], environment: 'node' },
  };
});
