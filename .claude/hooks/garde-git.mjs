// Garde-fou de Claude Code (demande de l'auteur, séance 53), lancé avant chaque commande du terminal.
// - BLOQUE la réécriture de l'historique Git : push forcé, reset --hard, rebase, amend, filter-branch.
// - DEMANDE l'accord de l'auteur avant toute commande qui écrit dans docs/VISION.md ou
//   tests/e2e/comptages-limites.json (les modifications par l'outil d'édition sont gérées par settings.json).
// Entrée : JSON sur stdin ({ tool_input: { command } }). Sortie : code 2 + message = bloqué ;
// JSON « ask » = demander ; rien = autorisé.
import { readFileSync } from 'node:fs';

export function check(command) {
  const c = ` ${command.replace(/\s+/g, ' ')} `;
  const git = /(^|[;&|(\s])git\s/.test(c);
  if (git) {
    if (/\bgit\s(?:-\S+\s)*push\b[^;&|]*(\s--force\b|\s--force-with-lease\b|\s-f\b|\s-\w*f\w*\b|\s\+\S+)/.test(c)) return ['deny', 'push forcé interdit (réécrit l’historique publié)'];
    if (/\bgit\s(?:-\S+\s)*reset\b[^;&|]*\s--hard\b/.test(c)) return ['deny', 'git reset --hard interdit (corriger par un nouveau commit ou git revert)'];
    if (/\bgit\s(?:-\S+\s)*rebase\b/.test(c)) return ['deny', 'git rebase interdit (réécrit l’historique)'];
    if (/\bgit\s(?:-\S+\s)*commit\b[^;&|]*\s--amend\b/.test(c)) return ['deny', 'git commit --amend interdit (réécrit l’historique)'];
    if (/\bgit\s(?:-\S+\s)*(filter-branch|filter-repo|replace)\b/.test(c)) return ['deny', 'réécriture de l’historique interdite'];
  }
  if (/VISION\.md|comptages-limites\.json/.test(c) && /(>|\bsed\s+-i|\btee\b|\bpython3?\b|\bnode\b|\bperl\b|\bmv\b|\bcp\b|\brm\b|\btruncate\b|\bgit\s+(checkout|restore)\b)/.test(c)) {
    return ['ask', 'cette commande peut modifier docs/VISION.md ou tests/e2e/comptages-limites.json : accord de l’auteur requis'];
  }
  return ['allow', ''];
}

if (process.argv[1]?.endsWith('garde-git.mjs')) {
  let command = '';
  try {
    command = JSON.parse(readFileSync(0, 'utf8')).tool_input?.command ?? '';
  } catch {
    process.exit(0);
  }
  const [decision, reason] = check(command);
  if (decision === 'deny') {
    process.stderr.write(`Bloqué par .claude/hooks/garde-git.mjs : ${reason}.`);
    process.exit(2);
  }
  if (decision === 'ask') {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: reason } }));
  }
  process.exit(0);
}
