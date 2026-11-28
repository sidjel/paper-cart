// Garde-fou PreToolUse pour Antigravity Desktop (.agents/hooks.json).
// - BLOQUE (deny) la réécriture de l'historique Git : push forcé (+branche, -f, -uf, --force*),
//   reset --hard, rebase, commit --amend, filter-branch, filter-repo, replace.
// - DEMANDE L'ACCORD (force_ask) pour :
//   * git clean (peut supprimer des fichiers ignorés par Git, dont _assets_stock/) ;
//   * toute modification (outil d'édition ou commande shell/PowerShell) de :
//     - docs/VISION.md
//     - tests/e2e/comptages-limites.json
//     - .agents/hooks.json et .agents/hooks/* (auto-protection du garde-fou).
// Contrat officiel PreToolUse : JSON sur stdin ({ toolCall: { name, args } }),
// JSON sur stdout ({ decision: "allow" | "deny" | "force_ask", reason? }).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PROTECTED_CMD_PATH = /VISION\.md|comptages-limites\.json|\.agents[\\/]hooks(?:\.json|[\\/]|$)/i;
const SHELL_WRITER =
  /(>|>>|\bsed\s+-i|\btee\b|\bpython3?\b|\bnode\b|\bperl\b|\bmv\b|\bcp\b|\brm\b|\btruncate\b|\bgit(?:\.exe)?\s+(?:checkout|restore|rm|mv)\b|\b(?:set-content|add-content|out-file|copy-item|move-item|remove-item|new-item|clear-content|rename-item|sc|ac|ri|mi|cpi|ni|del|erase|rd|rmdir)\b)/i;

const EDIT_TOOLS = /^(?:edit_file|write_file|replace_file_content|multi_replace_file_content|write_to_file)$/i;

export function checkCommand(command) {
  const full = String(command ?? '');
  const segments = full.split(/[;&|\r\n]+/);

  for (const raw of segments) {
    const seg = ` ${raw.replace(/\s+/g, ' ').trim()} `;
    if (!/\bgit(?:\.exe)?\s/i.test(seg)) continue;

    if (/\bgit(?:\.exe)?\s+(?:-\S+\s+)*push\b.*(?:\s--force\b|\s--force-with-lease\b|\s--force-if-includes\b|\s-[a-zA-Z]*f[a-zA-Z]*\b|\s\+\S+)/i.test(seg)) {
      return { decision: 'deny', reason: "push forcé interdit (réécrit l'historique publié)" };
    }
    if (/\bgit(?:\.exe)?\s+(?:-\S+\s+)*reset\b.*\s--hard\b/i.test(seg)) {
      return { decision: 'deny', reason: 'git reset --hard interdit (corriger par un nouveau commit ou git revert)' };
    }
    if (/\bgit(?:\.exe)?\s+(?:-\S+\s+)*rebase\b/i.test(seg)) {
      return { decision: 'deny', reason: "git rebase interdit (réécrit l'historique)" };
    }
    if (/\bgit(?:\.exe)?\s+(?:-\S+\s+)*commit\b.*\s--amend\b/i.test(seg)) {
      return { decision: 'deny', reason: "git commit --amend interdit (réécrit l'historique)" };
    }
    if (/\bgit(?:\.exe)?\s+(?:-\S+\s+)*(?:filter-branch|filter-repo|replace)\b/i.test(seg)) {
      return { decision: 'deny', reason: "réécriture de l'historique Git interdite" };
    }
    if (/\bgit(?:\.exe)?\s+(?:-\S+\s+)*clean\b/i.test(seg)) {
      return { decision: 'force_ask', reason: "git clean peut effacer des fichiers non suivis ou ignorés (dont _assets_stock/) : accord de l'auteur requis" };
    }
  }

  const normalized = ` ${full.replace(/\s+/g, ' ')} `;
  if (PROTECTED_CMD_PATH.test(normalized) && SHELL_WRITER.test(normalized)) {
    return {
      decision: 'force_ask',
      reason: "cette commande peut modifier un fichier protégé (docs/VISION.md, tests/e2e/comptages-limites.json ou .agents/hooks) : accord de l'auteur requis",
    };
  }

  return { decision: 'allow' };
}

export function checkFileEdit(filePath) {
  const norm = String(filePath ?? '').replace(/\\/g, '/');
  if (/(?:^|\/)docs\/VISION\.md$/i.test(norm)) {
    return { decision: 'force_ask', reason: "modification de docs/VISION.md : accord explicite de l'auteur requis" };
  }
  if (/(?:^|\/)tests\/e2e\/comptages-limites\.json$/i.test(norm)) {
    return { decision: 'force_ask', reason: "modification de tests/e2e/comptages-limites.json : accord explicite de l'auteur requis" };
  }
  if (/(?:^|\/)\.agents\/hooks\.json$/i.test(norm) || /(?:^|\/)\.agents\/hooks\/.+$/i.test(norm)) {
    return { decision: 'force_ask', reason: "modification du garde-fou .agents/hooks : accord explicite de l'auteur requis" };
  }
  return { decision: 'allow' };
}

export function evaluatePayload(payload) {
  const name = payload?.toolCall?.name ?? '';
  const args = payload?.toolCall?.args ?? {};
  if (name === 'run_command') {
    return checkCommand(args.CommandLine ?? args.command ?? '');
  }
  if (EDIT_TOOLS.test(name)) {
    return checkFileEdit(args.Path ?? args.TargetFile ?? args.path ?? '');
  }
  return { decision: 'allow' };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].replace(/\//g, '\\').toLowerCase()
  || process.argv[1]?.replace(/\\/g, '/').endsWith('/.agents/hooks/garde-git.mjs');

if (isMain) {
  let payload = null;
  try {
    payload = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }
  const result = evaluatePayload(payload);
  process.stdout.write(JSON.stringify(result));
  process.exit(0);
}
