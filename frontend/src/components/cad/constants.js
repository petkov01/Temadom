// TemaDom IA CAD v5.1 — Constants & Configuration
export const GRID = 20;
export const CW = 900;
export const CH = 600;

export const TOOLS = [
  { id: 'select', label: 'Избери', group: 'basic' },
  { id: 'wall', label: 'Стена', group: 'structure' },
  { id: 'slab', label: 'Плоча', group: 'structure' },
  { id: 'rect', label: 'Правоъгълник', group: 'shape' },
  { id: 'circle', label: 'Кръг', group: 'shape' },
  { id: 'stairs', label: 'Стълби', group: 'structure' },
  { id: 'door', label: 'Врата', group: 'opening' },
  { id: 'window', label: 'Прозорец', group: 'opening' },
  { id: 'column', label: 'Колона', group: 'structure' },
  { id: 'beam', label: 'Греда', group: 'structure' },
  { id: 'dimension', label: 'X/Y/Z', group: 'measure' },
  { id: 'erase', label: 'Изтрий', group: 'basic' },
];

export const TOOL_ICONS = {
  select: 'MousePointer', wall: 'Fence', slab: 'Layers',
  rect: 'Square', circle: 'Circle', stairs: 'ArrowUpRight', door: 'DoorOpen',
  window: 'PanelTop', column: 'Cylinder', beam: 'Minus', dimension: 'Ruler',
  erase: 'Eraser',
};

export const OBJ_COLORS = {
  wall: '#90cdf4', slab: '#68d391', rect: '#68d391',
  stairs: '#ffa500', door: '#e74c3c', window: '#3498db', column: '#9b59b6',
  beam: '#f39c12', circle: '#1abc9c', dimension: '#8C56FF', line: '#a0aec0',
};

export const DEFAULTS = {
  wall: { height: 3, thickness: 25 },
  slab: { slabThickness: 15 },
  stairs: { steps: 8, rise: 0.17, run: 0.30, stairWidth: 1.2 },
  door: { doorWidth: 0.9, doorHeight: 2.1 },
  window: { windowWidth: 1.2, windowHeight: 1.5, windowSill: 0.9 },
  column: { columnShape: 'round', columnDiameter: 30, columnWidth: 30, columnLength: 30, columnHeight: 3 },
  beam: { beamWidth: 25, beamHeight: 45, beamElevation: 2.7 },
  circle: { circleThickness: 15 },
};

export const COST_RATES = {
  concrete:   { label: 'Бетон',         unit: 'м3', price: 90 },
  rebar:      { label: 'Арматура',      unit: 'кг', price: 1.05 },
  tiles:      { label: 'Керемиди',      unit: 'м2', price: 28 },
  formwork:   { label: 'Кофраж',        unit: 'м2', price: 22.5 },
  bricks:     { label: 'Зидария',       unit: 'м2', price: 18 },
  plaster:    { label: 'Мазилка',       unit: 'м2', price: 12 },
  doors:      { label: 'Врата (монт.)', unit: 'бр', price: 280 },
  windows:    { label: 'Прозорец PVC',  unit: 'м2', price: 165 },
  stairStep:  { label: 'Стъпало',       unit: 'бр', price: 45 },
  roofStruct: { label: 'Покрив к-я',    unit: 'м2', price: 55 },
};

export const EUR_TO_BGN = 1.9558;
