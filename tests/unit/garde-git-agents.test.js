import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { checkCommand, checkFileEdit, evaluatePayload } from '../../.agents/hooks/garde-git.mjs';

const HOOK_SCRIPT = resolve('.agents/hooks/garde-git.mjs');

function runHookStdin(payload) {
  const res = spawnSync(process.execPath, [HOOK_SCRIPT], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
  });
  expect(res.status, res.stderr).toBe(0);
  return JSON.parse(res.stdout);
}

describe('garde-fou Antigravity (.agents/hooks/garde-git.mjs)', () => {
  it('bloque la réécriture de l’historique Git, quelles que soient les options', () => {
    for (const c of [
      'git push --force',
      'git push --force --dry-run',
      'git push origin main --force --dry-run',
      'git push origin +main --dry-run',
      'git push -u origin HEAD:main --force',
      'git push -f origin main',
      'git push -uf origin main',
      'cd x && git push origin +main',
      'git push --force-with-lease origin main',
      'git push --force-if-includes origin main',
      'git reset --hard HEAD~1',
      'git rebase -i HEAD~3',
      'git commit --amend -m x',
      'git filter-branch --tree-filter x',
      'git filter-repo --path foo',
      'git replace HEAD HEAD~1',
    ]) {
      expect(checkCommand(c).decision, c).toBe('deny');
    }
  });

  it('demande l’accord avant git clean (peut effacer _assets_stock/)', () => {
    for (const c of ['git clean -fd', 'git clean -fdx', 'git clean -n']) {
      expect(checkCommand(c).decision, c).toBe('force_ask');
    }
  });

  it('laisse passer le travail normal et les lectures', () => {
    for (const c of [
      'git push origin main',
      'git push -u origin HEAD:main',
      'git commit -q -m "Message : force du filtre"',
      'git log --oneline -3',
      'git reset HEAD fichier',
      'npm test',
      'cat docs/VISION.md',
      'Get-Content docs/VISION.md',
      'grep -n x tests/e2e/comptages-limites.json',
      'Select-String rayon tests/e2e/comptages-limites.json',
    ]) {
      expect(checkCommand(c).decision, c).toBe('allow');
    }
  });

  it('demande l’accord avant toute commande (Unix ou PowerShell) écrivant dans un fichier protégé', () => {
    for (const c of [
      "python3 -c \"open('docs/VISION.md','w')\"",
      'sed -i s/a/b/ tests/e2e/comptages-limites.json',
      'echo x > docs/VISION.md',
      'Set-Content docs/VISION.md "test"',
      'Add-Content docs/VISION.md "ligne"',
      '"x" | Out-File tests/e2e/comptages-limites.json',
      'Copy-Item tmp.json tests/e2e/comptages-limites.json',
      'Move-Item a.md docs/VISION.md',
      'Remove-Item .agents/hooks.json',
      'New-Item -Force .agents/hooks/garde-git.mjs',
    ]) {
      expect(checkCommand(c).decision, c).toBe('force_ask');
    }
  });

  it('demande l’accord sur édition directe de VISION.md, comptages-limites.json et .agents/hooks/*', () => {
    for (const p of [
      'c:/Paper Cart - krita-codex-mcp/docs/VISION.md',
      'C:\\Paper Cart - krita-codex-mcp\\tests\\e2e\\comptages-limites.json',
      'c:/Paper Cart - krita-codex-mcp/.agents/hooks.json',
      'C:\\Paper Cart - krita-codex-mcp\\.agents\\hooks\\garde-git.mjs',
    ]) {
      expect(checkFileEdit(p).decision, p).toBe('force_ask');
    }
    for (const p of [
      'c:/Paper Cart - krita-codex-mcp/src/main.js',
      'c:/Paper Cart - krita-codex-mcp/docs/JOURNAL.md',
    ]) {
      expect(checkFileEdit(p).decision, p).toBe('allow');
    }
  });

  it('traite un payload JSON officiel PreToolUse envoyé sur stdin', () => {
    const denyRes = runHookStdin({
      conversationId: 'ec33ebf9-0cba-4100-8142-c61503f6c587',
      hookEventName: 'PreToolUse',
      stepIdx: 19,
      toolCall: {
        id: 'toolu_01',
        name: 'run_command',
        args: { CommandLine: 'git push origin main --force --dry-run' },
      },
    });
    expect(denyRes.decision).toBe('deny');

    const askEditRes = runHookStdin({
      conversationId: 'ec33ebf9-0cba-4100-8142-c61503f6c587',
      hookEventName: 'PreToolUse',
      stepIdx: 20,
      toolCall: {
        id: 'toolu_02',
        name: 'edit_file',
        args: { Path: 'c:/Paper Cart - krita-codex-mcp/docs/VISION.md' },
      },
    });
    expect(askEditRes.decision).toBe('force_ask');

    const allowRes = evaluatePayload({
      hookEventName: 'PreToolUse',
      toolCall: {
        id: 'toolu_03',
        name: 'run_command',
        args: { CommandLine: 'npm test' },
      },
    });
    expect(allowRes.decision).toBe('allow');
  });
});
