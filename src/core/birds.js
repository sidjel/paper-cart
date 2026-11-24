// Vol et marche déterministes d'oiseaux origami dehors (logique pure : aucun DOM, aucun hasard, aucun timer).
// - mode par défaut (vol) : boucle à travers `span` [xMin, xMax] selon `dir`, ondule verticalement, bat des ailes.
// - mode 'walk' (oiseau posé sur le rebord d'une verrière) : marche irrégulière par petits à-coups vifs
//   entrecoupés de micro-arrêts variés (façon passereau / merle), puis demi-tour aux extrémités de `walkSpan`.

// Séquence déterministe mais irrégulière (aller ≠ retour) : [part de distance, facteur vitesse, pause (s)].
const OUTWARD_BURSTS = [
  [0.18, 1.15, 0.42],
  [0.31, 0.94, 1.25],
  [0.14, 1.32, 0.24],
  [0.22, 1.02, 0.88],
  [0.15, 1.12, 1.48],
];
const RETURN_BURSTS = [
  [0.26, 1.08, 0.62],
  [0.13, 1.28, 0.28],
  [0.34, 0.92, 1.42],
  [0.12, 1.24, 0.36],
  [0.15, 1.04, 1.12],
];

function walkState(bird, t, [wMin, wMax], reduceMotion) {
  const dist = Math.max(1, wMax - wMin);
  const baseSpeed = Math.max(1, bird.speed ?? 34);
  const pauseMul = Math.max(0, bird.pause ?? 1);

  // Construit les segments d'un cycle complet aller + retour (10 petits à-coups + 10 pauses variées).
  let totalDur = 0;
  const segs = [];
  let cursor = wMin;
  for (const [frac, spdMul, basePause] of OUTWARD_BURSTS) {
    const next = Math.min(wMax, cursor + frac * dist);
    const moveDur = Math.abs(next - cursor) / (baseSpeed * spdMul);
    const pauseDur = basePause * pauseMul;
    segs.push({ x0: cursor, x1: next, dir: 1, moveDur, pauseDur, tStart: totalDur });
    totalDur += moveDur + pauseDur;
    cursor = next;
  }
  cursor = wMax;
  for (const [frac, spdMul, basePause] of RETURN_BURSTS) {
    const next = Math.max(wMin, cursor - frac * dist);
    const moveDur = Math.abs(next - cursor) / (baseSpeed * spdMul);
    const pauseDur = basePause * pauseMul;
    segs.push({ x0: cursor, x1: next, dir: -1, moveDur, pauseDur, tStart: totalDur });
    totalDur += moveDur + pauseDur;
    cursor = next;
  }

  const phaseOffset = (bird.phase ?? 0) * totalDur;
  const u = reduceMotion ? phaseOffset % totalDur : (((t + phaseOffset) % totalDur) + totalDur) % totalDur;

  for (const s of segs) {
    const segEnd = s.tStart + s.moveDur + s.pauseDur;
    if (u < segEnd || s === segs[segs.length - 1]) {
      const localT = Math.max(0, u - s.tStart);
      if (!reduceMotion && localT < s.moveDur && s.moveDur > 0) {
        const p = localT / s.moveDur;
        // Démarrage et arrêt secs (petit à-coup naturel d'oiseau) + légère saccade à chaque pas.
        const eased = p * p * (3 - 2 * p);
        const jerk = Math.sin(p * Math.PI * 6) * 0.014 * Math.sin(p * Math.PI);
        const progress = Math.max(0, Math.min(1, eased + jerk));
        return {
          x: s.x0 + (s.x1 - s.x0) * progress,
          dir: s.dir,
          walking: true,
          localT,
        };
      }
      return {
        x: reduceMotion && localT < s.moveDur ? s.x0 : s.x1,
        dir: s.dir,
        walking: false,
        localT: 0,
      };
    }
  }
  return { x: wMin, dir: 1, walking: false, localT: 0 };
}

function walkGroundY(bird, x) {
  const pts = bird.walkPoints;
  if (!pts || pts.length < 2) return bird.y;
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (x <= x1) {
      const span = Math.max(1e-6, x1 - x0);
      return y0 + ((x - x0) / span) * (y1 - y0);
    }
  }
  return pts[pts.length - 1][1];
}

export function birdPose(bird, time, [xMin, xMax], cycle, reduceMotion = false) {
  const t = reduceMotion ? 0 : Math.max(0, time);
  if (bird.mode === 'walk') {
    const walkSpan = bird.walkSpan ?? [xMin, xMax];
    const walkCycle = bird.cycle ?? cycle;
    const { x, dir, walking, localT } = walkState(bird, t, walkSpan, reduceMotion);
    const stepRate = bird.flap ?? 6.4;
    const bob = walking ? Math.abs(Math.sin(localT * stepRate * Math.PI)) * (bird.bob ?? 2.2) : 0;
    const rawIndex = walking ? Math.floor(localT * stepRate) % walkCycle.length : 0;
    const frame = walkCycle[((rawIndex % walkCycle.length) + walkCycle.length) % walkCycle.length];
    return { x, y: walkGroundY(bird, x) - bob, frame, dir, scale: bird.scale, anchorToStage: true };
  }

  const width = Math.max(1, xMax - xMin);
  const u = (((bird.phase * width + bird.speed * t) % width) + width) % width;
  const x = bird.dir < 0 ? xMax - u : xMin + u;
  const y = reduceMotion ? bird.y : bird.y + Math.sin(t * 2.4 + bird.phase * 12) * bird.bob;
  const birdCycle = bird.cycle ?? cycle;
  const rawIndex = reduceMotion ? 0 : Math.floor((t * bird.flap + bird.phase * birdCycle.length) % birdCycle.length);
  const frame = birdCycle[((rawIndex % birdCycle.length) + birdCycle.length) % birdCycle.length];
  return { x, y, frame, dir: bird.dir, scale: bird.scale, anchorToStage: false };
}

// Rythme déterministe des cris de corbeaux dehors (Accueil, Rayon 1) : aucun hasard, aucun timer réel.
const CROW_INTERVALS = [4.5, 9.5, 13.0, 8.0, 15.5, 10.5];

export function createCrowCalls(intervals = CROW_INTERVALS) {
  return { intervals, idx: 0, timer: intervals[0] };
}

export function resetCrowCalls(state) {
  state.idx = 0;
  state.timer = state.intervals[0];
}

export function stepCrowCalls(state, dt) {
  if (dt <= 0) return false;
  state.timer -= dt;
  if (state.timer > 0) return false;
  state.idx = (state.idx + 1) % state.intervals.length;
  state.timer = state.intervals[state.idx];
  return true;
}
