import { describe, it, expect } from 'vitest';
import { check } from '../../.claude/hooks/garde-git.mjs';

describe('garde-fou de Claude Code (.claude/hooks/garde-git.mjs)', () => {
  it('bloque la réécriture de l’historique, où que soit l’option', () => {
    for (const c of [
      'git push --force',
      'git push -u origin HEAD:main --force',
      'git push -f origin main',
      'cd x && git push origin +main',
      'git push --force-with-lease origin main',
      'git reset --hard HEAD~1',
      'git rebase -i HEAD~3',
      'git commit --amend -m x',
      'git filter-branch --tree-filter x',
    ]) expect(check(c)[0], c).toBe('deny');
  });
  it('laisse passer le travail normal', () => {
    for (const c of [
      'git push -u origin HEAD:main',
      'git commit -q -m "Message : force du filtre"',
      'git log --oneline -3',
      'git reset HEAD fichier',
      'npm test',
      'cat docs/VISION.md',
      'grep -n x tests/e2e/comptages-limites.json',
    ]) expect(check(c)[0], c).toBe('allow');
  });
  it('demande l’accord avant d’écrire dans VISION.md ou les limites des comptages', () => {
    for (const c of ["python3 -c \"open('docs/VISION.md','w')\"", 'sed -i s/a/b/ tests/e2e/comptages-limites.json', 'echo x > docs/VISION.md']) {
      expect(check(c)[0], c).toBe('ask');
    }
  });
});
