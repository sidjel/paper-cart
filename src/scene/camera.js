// Caméra : quelle partie du lieu est visible. Elle glisse doucement pour suivre le personnage,
// regarde un peu devant lui, et ne bouge pas tant qu'il reste dans une zone centrale (zone morte).
// Fonctions pures (aucun affichage), testées.

export function createCamera() {
  return { x: 0, y: 0, ready: false };
}

function clamp(v, lo, hi) {
  return hi < lo ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
}

// targetX, targetY : position du personnage sur la scène ; viewW, viewH : taille visible ;
// W, H : taille du lieu ; p : réglages (config.camera) ; dt : temps écoulé (s).
export function updateCamera(cam, p, targetX, targetY, facing, viewW, viewH, W, H, dt) {
  const aimX = targetX + facing * p.lookAhead;
  const center = cam.x + viewW / 2;
  const dz = p.deadZone * viewW;
  let goalX = cam.x;
  if (!cam.ready || Math.abs(aimX - center) > dz) goalX = aimX - viewW / 2 - (cam.ready ? Math.sign(aimX - center) * dz : 0);
  goalX = clamp(goalX, 0, W - viewW);
  // Verticalement : seulement si l'on voit moins que toute la hauteur (zoom), en gardant le sol en vue.
  const goalY = clamp(targetY - viewH * 0.62, 0, H - viewH);
  if (!cam.ready) {
    cam.x = goalX;
    cam.y = goalY;
    cam.ready = true;
    return cam;
  }
  const k = 1 - Math.exp(-p.follow * dt);
  cam.x += (goalX - cam.x) * k;
  cam.y += (goalY - cam.y) * k;
  return cam;
}
