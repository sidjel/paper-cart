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

// En dev local, relit le commit Git à chaque rechargement de page (jamais figé sur un vieux commit).
function liveVersionPlugin() {
  return {
    name: 'paper-cart-live-version',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url === '/' || req.url?.startsWith('/?') || req.url?.startsWith('/index.html')) {
          for (const mod of server.moduleGraph.getModulesByFile(server.config.root.replace(/\\/g, '/') + '/src/main.js') ?? []) {
            server.moduleGraph.invalidateModule(mod);
          }
        }
        next();
      });
    },
    transform(code, id) {
      if (!id.replace(/\\/g, '/').endsWith('/src/main.js')) return null;
      const { commit, iso } = gitInfo();
      const label = `${commit} · ${frenchDate(iso)} · dev`;
      return code
        .replace(/\b__VERSION__\b/g, JSON.stringify(label))
        .replace(/\b__COMMIT__\b/g, JSON.stringify(commit));
    },
  };
}

export default defineConfig(({ command }) => {
  const { commit, iso } = gitInfo();
  const dateStr = frenchDate(iso);
  const label = `${commit} · ${dateStr}`;
  const isServe = command === 'serve';
  return {
    // Chemins relatifs : le jeu fonctionne dans le sous-dossier /paper-cart/ de GitHub Pages.
    base: './',
    plugins: isServe ? [liveVersionPlugin()] : [],
    define: isServe ? {} : { __VERSION__: JSON.stringify(label), __COMMIT__: JSON.stringify(commit) },
    server: { host: true },
    preview: { host: true },
    build: { target: 'es2022', assetsInlineLimit: 0 },
    test: { include: ['tests/unit/**/*.test.js'], environment: 'node' },
  };
});
