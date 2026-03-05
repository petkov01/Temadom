// TemaDom IA CAD v5.1 — Utility Functions
import { GRID, DEFAULTS, COST_RATES, EUR_TO_BGN } from './constants';

export function snap(v) { return Math.round(v / GRID) * GRID; }

export function snapEndpoint(x, y, els) {
  let best = null, bd = 12;
  for (const e of els) {
    if (e.tool === 'circle') {
      const d = Math.hypot(e.cx - x, e.cy - y);
      if (d < bd) { bd = d; best = { x: e.cx, y: e.cy }; }
      continue;
    }
    for (const p of [{ x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 }]) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < bd) { bd = d; best = p; }
    }
  }
  return best ? [best.x, best.y] : [snap(x), snap(y)];
}

export function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, sq = dx * dx + dy * dy;
  if (!sq) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / sq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function distCircle(px, py, cx, cy, r) {
  return Math.abs(Math.hypot(px - cx, py - cy) - r);
}

export function autoType(el) {
  if (['stairs', 'door', 'window', 'column', 'beam', 'roof', 'circle'].includes(el.tool)) return el.tool;
  if (el.tool === 'rect' || el.tool === 'slab') return 'slab';
  return 'wall';
}

export function getDefaults(tool) {
  return { ...(DEFAULTS[tool] || DEFAULTS[autoType({ tool })] || {}) };
}

export function elLength(el, scale) {
  if (el.tool === 'circle') return (el.r || 0) / GRID * scale * 2 * Math.PI;
  return Math.hypot((el.x2 || 0) - (el.x1 || 0), (el.y2 || 0) - (el.y1 || 0)) / GRID * scale;
}

export function smartHint(el, sc) {
  if (['stairs', 'door', 'window', 'column', 'beam', 'roof', 'circle'].includes(el.tool)) return null;
  if (el.tool === 'rect' || el.tool === 'slab') {
    const w = Math.abs(el.x2 - el.x1) / GRID * sc, h = Math.abs(el.y2 - el.y1) / GRID * sc;
    if (Math.min(w, h) < 0.4) return `Тесен (${w.toFixed(1)}x${h.toFixed(1)}м) - стена?`;
    return null;
  }
  const lenM = Math.hypot(el.x2 - el.x1, el.y2 - el.y1) / GRID * sc;
  const ang = Math.abs(Math.atan2(el.y2 - el.y1, el.x2 - el.x1) * 180 / Math.PI);
  if (ang > 25 && ang < 65 && lenM > 1.5) return `Диагонална (${lenM.toFixed(1)}м) - стълбище?`;
  return null;
}

// Regional price multipliers
export const REGIONS = [
  { id: 'sofia', name: 'София', multiplier: 1.15 },
  { id: 'plovdiv', name: 'Пловдив', multiplier: 1.0 },
  { id: 'varna', name: 'Варна', multiplier: 1.05 },
  { id: 'burgas', name: 'Бургас', multiplier: 1.02 },
  { id: 'stara_zagora', name: 'Стара Загора', multiplier: 0.95 },
  { id: 'ruse', name: 'Русе', multiplier: 0.92 },
  { id: 'pleven', name: 'Плевен', multiplier: 0.90 },
  { id: 'other', name: 'Друг', multiplier: 0.88 },
];

// Cost calculation
export function calculateCosts(els, scale, regionId = 'plovdiv') {
  const region = REGIONS.find(r => r.id === regionId) || REGIONS[1];
  const mult = region.multiplier;
  const items = [];
  let totalEur = 0;

  const walls = els.filter(e => (e._type || autoType(e)) === 'wall');
  const slabs = els.filter(e => (e._type || autoType(e)) === 'slab');
  const roofs = els.filter(e => (e._type || autoType(e)) === 'roof');
  const stairsList = els.filter(e => (e._type || autoType(e)) === 'stairs');
  const doorsList = els.filter(e => (e._type || autoType(e)) === 'door');
  const windowsList = els.filter(e => (e._type || autoType(e)) === 'window');
  const columns = els.filter(e => (e._type || autoType(e)) === 'column');
  const beams = els.filter(e => (e._type || autoType(e)) === 'beam');

  // Walls
  if (walls.length) {
    let wallArea = 0, wallVolume = 0;
    walls.forEach(w => {
      const len = elLength(w, scale);
      const h = w.height || 3;
      const t = (w.thickness || 25) / 100;
      wallArea += len * h;
      wallVolume += len * h * t;
    });
    const formworkArea = wallArea * 2;
    const rebarKg = wallVolume * 80;
    items.push({ ...COST_RATES.concrete, qty: +wallVolume.toFixed(2), total: +(wallVolume * COST_RATES.concrete.price * mult).toFixed(0) });
    items.push({ ...COST_RATES.formwork, qty: +formworkArea.toFixed(1), total: +(formworkArea * COST_RATES.formwork.price * mult).toFixed(0) });
    items.push({ ...COST_RATES.rebar, qty: +rebarKg.toFixed(0), total: +(rebarKg * COST_RATES.rebar.price * mult).toFixed(0) });
    items.push({ ...COST_RATES.plaster, qty: +wallArea.toFixed(1), total: +(wallArea * COST_RATES.plaster.price * mult).toFixed(0) });
  }

  // Slabs
  if (slabs.length) {
    let slabArea = 0, slabVol = 0;
    slabs.forEach(s => {
      const w = Math.abs((s.x2 - s.x1) / GRID * scale);
      const d = Math.abs((s.y2 - s.y1) / GRID * scale);
      const t = (s.slabThickness || 15) / 100;
      slabArea += w * d;
      slabVol += w * d * t;
    });
    items.push({ ...COST_RATES.concrete, label: 'Бетон (плочи)', qty: +slabVol.toFixed(2), total: +(slabVol * COST_RATES.concrete.price * mult).toFixed(0) });
    items.push({ ...COST_RATES.formwork, label: 'Кофраж (плочи)', qty: +slabArea.toFixed(1), total: +(slabArea * COST_RATES.formwork.price * mult).toFixed(0) });
    items.push({ ...COST_RATES.rebar, label: 'Арматура (плочи)', qty: +(slabVol * 100).toFixed(0), total: +(slabVol * 100 * COST_RATES.rebar.price * mult).toFixed(0) });
  }

  // Roofs
  if (roofs.length) {
    let roofArea = 0;
    roofs.forEach(r => {
      const len = elLength(r, scale);
      const w = 4; // default width
      const angle = (r.roofAngle || 30) * Math.PI / 180;
      roofArea += len * (w / Math.cos(angle));
    });
    items.push({ ...COST_RATES.tiles, qty: +roofArea.toFixed(1), total: +(roofArea * COST_RATES.tiles.price * mult).toFixed(0) });
    items.push({ ...COST_RATES.roofStruct, qty: +roofArea.toFixed(1), total: +(roofArea * COST_RATES.roofStruct.price * mult).toFixed(0) });
  }

  // Stairs
  if (stairsList.length) {
    let totalSteps = 0;
    stairsList.forEach(s => { totalSteps += s.steps || 8; });
    items.push({ ...COST_RATES.stairStep, qty: totalSteps, total: +(totalSteps * COST_RATES.stairStep.price * mult).toFixed(0) });
  }

  // Doors
  if (doorsList.length) {
    items.push({ ...COST_RATES.doors, qty: doorsList.length, total: +(doorsList.length * COST_RATES.doors.price * mult).toFixed(0) });
  }

  // Windows
  if (windowsList.length) {
    let winArea = 0;
    windowsList.forEach(w => { winArea += (w.windowWidth || 1.2) * (w.windowHeight || 1.5); });
    items.push({ ...COST_RATES.windows, qty: +winArea.toFixed(1), total: +(winArea * COST_RATES.windows.price * mult).toFixed(0) });
  }

  // Columns
  if (columns.length) {
    let colVol = 0;
    columns.forEach(c => {
      const h = c.columnHeight || 3;
      if (c.columnShape === 'rect') {
        const cw = (c.columnWidth || 30) / 100;
        const cl = (c.columnLength || 30) / 100;
        colVol += cw * cl * h;
      } else {
        const r = (c.columnDiameter || 30) / 200;
        colVol += Math.PI * r * r * h;
      }
    });
    items.push({ ...COST_RATES.concrete, label: 'Бетон (колони)', qty: +colVol.toFixed(2), total: +(colVol * 120 * mult).toFixed(0) });
  }

  // Beams
  if (beams.length) {
    let beamVol = 0;
    beams.forEach(b => {
      const len = elLength(b, scale);
      const w = (b.beamWidth || 25) / 100;
      const h = (b.beamHeight || 45) / 100;
      beamVol += len * w * h;
    });
    items.push({ ...COST_RATES.concrete, label: 'Бетон (греди)', qty: +beamVol.toFixed(2), total: +(beamVol * 110 * mult).toFixed(0) });
  }

  items.forEach(it => { totalEur += it.total; });
  const totalBgn = +(totalEur * EUR_TO_BGN).toFixed(0);

  return { items, totalEur: +totalEur.toFixed(0), totalBgn };
}
