// TemaDom IA CAD v5.1 — Structure Panel (Object List + Parametric Edit)
import React from 'react';
import { Trash2, Plus, Maximize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GRID, OBJ_COLORS } from './constants';
import { autoType, smartHint } from './utils';

const TYPE_LABELS = {
  wall: 'Стена', roof: 'Покрив', slab: 'Плоча', stairs: 'Стълби',
  door: 'Врата', window: 'Прозорец', column: 'Колона', beam: 'Греда',
  circle: 'Кръг', ignore: 'Скрит',
};

const MANUAL_TYPES = [
  ['wall', 'Стена', '#90cdf4'], ['roof', 'Покрив', '#e67e22'], ['slab', 'Плоча', '#68d391'],
  ['stairs', 'Стълби', '#ffa500'], ['door', 'Врата', '#e74c3c'], ['window', 'Прозорец', '#3498db'],
  ['column', 'Колона', '#9b59b6'], ['beam', 'Греда', '#f39c12'],
];

const DimInput = ({ label, val, onChange, step = 0.1, min, unit = 'м', color = '#FF8C42' }) => (
  <div className="flex-1">
    <Label className="text-[9px] block mb-0.5" style={{ color }}>{label}</Label>
    <div className="relative">
      <Input type="number" step={step} min={min} value={val}
        onChange={e => onChange(+e.target.value)}
        className="h-7 text-xs bg-[#0F1923] border-[#FF8C42]/30 text-white px-1.5 pr-6 font-mono" />
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500">{unit}</span>
    </div>
  </div>
);

const ParamInput = ({ label, val, onChange, step = 1, min, unit = '' }) => (
  <div>
    <Label className="text-slate-600 text-[9px]">{label}</Label>
    <Input type="number" step={step} min={min} value={val} onChange={e => onChange(+e.target.value)}
      className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" />
  </div>
);

function getDimensions(el, scale) {
  const t = el._type || autoType(el);
  if (t === 'circle') {
    const diam = ((el.r || 0) * 2 / GRID * scale);
    return { length: +diam.toFixed(2), height: (el.circleThickness || 15) / 100 };
  }
  if (t === 'column') {
    if (el.columnShape === 'rect') {
      return { shape: 'rect', width: (el.columnWidth || 30), length: (el.columnLength || 30), height: el.columnHeight || 3 };
    }
    return { shape: 'round', diameter: (el.columnDiameter || 30), height: el.columnHeight || 3 };
  }
  if (t === 'slab') {
    const w = Math.abs((el.x2 || 0) - (el.x1 || 0)) / GRID * scale;
    const d = Math.abs((el.y2 || 0) - (el.y1 || 0)) / GRID * scale;
    return { width: +w.toFixed(2), depth: +d.toFixed(2), height: (el.slabThickness || 15) / 100 };
  }
  const len = Math.hypot((el.x2 || 0) - (el.x1 || 0), (el.y2 || 0) - (el.y1 || 0)) / GRID * scale;
  return { length: +len.toFixed(2) };
}

function ObjectCard({ el, i, isSel, scale, onSelect, onDelete, onUpdate, onUpdateDimension, els }) {
  const t = el._type || autoType(el);
  if (t === 'ignore' || el.tool === 'dimension') return null;
  const typeColor = OBJ_COLORS[t] || '#888';
  const hint = smartHint(el, scale);
  const dims = getDimensions(el, scale);

  const count = els.slice(0, i).filter(e => (e._type || autoType(e)) === t).length + 1;
  let typeLabel = `${TYPE_LABELS[t] || t} #${count}`;
  if (t === 'stairs') typeLabel = `Стълби (${el.steps ?? 8} стъп.)`;

  return (
    <div onClick={() => onSelect(i)}
      className={`p-2 rounded-lg border cursor-pointer transition-all ${isSel ? 'border-[#FF8C42] bg-[#FF8C42]/5 ring-1 ring-[#FF8C42]/30' : 'border-[#2A3A4C] bg-[#1E2A38] hover:border-[#3A4A5C]'}`}
      data-testid={`obj-${i}`}>
      <div className="flex items-center justify-between mb-1.5">
        <Badge className="text-[9px]" style={{ background: `${typeColor}15`, color: typeColor, borderColor: `${typeColor}30` }}>{typeLabel}</Badge>
        <button onClick={e => { e.stopPropagation(); onDelete(i); }} className="text-red-400 hover:text-red-300 p-0.5" data-testid={`delete-obj-${i}`}><Trash2 className="h-3 w-3" /></button>
      </div>

      {hint && (
        <div className="flex items-center gap-1 mb-1.5 bg-[#8C56FF]/10 border border-[#8C56FF]/20 rounded p-1">
          <span className="text-[#8C56FF] text-[9px] flex-1">{hint}</span>
          <button onClick={e => { e.stopPropagation(); onUpdate(i, '_type', 'stairs'); }} className="text-[8px] bg-[#8C56FF] text-white px-1.5 py-0.5 rounded">Приложи</button>
        </div>
      )}

      {/* === PRIMARY DIMENSIONS (L/W/H) === */}
      <div className="bg-[#0F1923]/60 rounded p-1.5 mb-1.5 border border-[#FF8C42]/10" data-testid={`dims-${i}`}>
        <div className="flex items-center gap-1 mb-1">
          <Maximize2 className="h-3 w-3 text-[#FF8C42]" />
          <span className="text-[#FF8C42] text-[9px] font-bold">РАЗМЕРИ</span>
        </div>
        <div className="flex gap-1.5">
          {t === 'column' ? (
            <>
              {/* Shape toggle */}
              <div className="flex-none">
                <Label className="text-[9px] block mb-0.5 text-slate-500">Форма</Label>
                <div className="flex gap-0.5">
                  <button onClick={e => { e.stopPropagation(); onUpdate(i, 'columnShape', 'round'); }}
                    className={`text-[9px] px-2 py-1 rounded border ${(el.columnShape || 'round') === 'round' ? 'border-[#9b59b6] bg-[#9b59b6]/15 text-[#9b59b6]' : 'border-[#2A3A4C] text-slate-600'}`}
                    data-testid={`col-shape-round-${i}`}>O</button>
                  <button onClick={e => { e.stopPropagation(); onUpdate(i, 'columnShape', 'rect'); }}
                    className={`text-[9px] px-2 py-1 rounded border ${el.columnShape === 'rect' ? 'border-[#9b59b6] bg-[#9b59b6]/15 text-[#9b59b6]' : 'border-[#2A3A4C] text-slate-600'}`}
                    data-testid={`col-shape-rect-${i}`}>▭</button>
                </div>
              </div>
              {el.columnShape === 'rect' ? (
                <>
                  <DimInput label="W (ширина)" val={dims.width} unit="см"
                    onChange={v => onUpdate(i, 'columnWidth', Math.max(10, v))} step={1} color="#9b59b6" />
                  <DimInput label="L (дължина)" val={dims.length} unit="см"
                    onChange={v => onUpdate(i, 'columnLength', Math.max(10, v))} step={1} color="#FF8C42" />
                </>
              ) : (
                <DimInput label="D (диаметър)" val={dims.diameter} unit="см"
                  onChange={v => onUpdate(i, 'columnDiameter', Math.max(10, v))} step={1} color="#9b59b6" />
              )}
              <DimInput label="H (височина)" val={dims.height}
                onChange={v => onUpdate(i, 'columnHeight', Math.max(0.5, v))} color="#28A745" />
            </>
          ) : t === 'circle' ? (
            <>
              <DimInput label="D (диаметър)" val={dims.length}
                onChange={v => { const rPx = (v / 2) * GRID / scale; onUpdate(i, 'r', Math.max(5, rPx)); }} color="#1abc9c" />
              <DimInput label="H (дебелина)" val={dims.height}
                onChange={v => onUpdate(i, 'circleThickness', Math.max(5, v * 100))} color="#28A745" />
            </>
          ) : t === 'slab' ? (
            <>
              <DimInput label="X (ширина)" val={dims.width}
                onChange={v => onUpdateDimension(i, 'width', Math.max(0.1, v))} color="#FF8C42" />
              <DimInput label="Y (дълбочина)" val={dims.depth}
                onChange={v => onUpdateDimension(i, 'depth', Math.max(0.1, v))} color="#4DA6FF" />
              <DimInput label="Z (дебелина)" val={(el.slabThickness || 15)} unit="см"
                onChange={v => onUpdate(i, 'slabThickness', Math.max(12, Math.min(30, v)))} step={1} color="#28A745" />
            </>
          ) : (
            <>
              <DimInput label="L (дължина)" val={dims.length}
                onChange={v => onUpdateDimension(i, 'length', Math.max(0.1, v))} color="#FF8C42" />
              {(t === 'wall') && (
                <DimInput label="W (дебелина)" val={(el.thickness || 25)} unit="см"
                  onChange={v => onUpdate(i, 'thickness', Math.max(15, Math.min(40, v)))} step={1} color="#4DA6FF" />
              )}
              {(t === 'wall' || t === 'roof' || t === 'beam') && (
                <DimInput label="H (височина)" val={t === 'beam' ? ((el.beamHeight || 45)) : (el.height ?? 3)} unit={t === 'beam' ? 'см' : 'м'}
                  onChange={v => t === 'beam' ? onUpdate(i, 'beamHeight', v) : onUpdate(i, 'height', v)}
                  step={t === 'beam' ? 1 : 0.1} color="#28A745" />
              )}
            </>
          )}
        </div>
      </div>

      {/* === EXTRA PARAMETERS === */}
      <div className="grid grid-cols-2 gap-1.5">
        {t === 'roof' && (<>
          <ParamInput label="Ъгъл (°)" val={el.roofAngle ?? 30} onChange={v => onUpdate(i, 'roofAngle', Math.max(15, Math.min(60, v)))} />
          <ParamInput label="Надвес (м)" val={el.overhang ?? 0.5} onChange={v => onUpdate(i, 'overhang', v)} step={0.1} />
        </>)}
        {t === 'stairs' && (<>
          <ParamInput label="Стъпала" val={el.steps ?? 8} onChange={v => onUpdate(i, 'steps', Math.max(1, v))} />
          <ParamInput label="Rise (м)" val={el.rise ?? 0.17} onChange={v => onUpdate(i, 'rise', v)} step={0.01} />
          <ParamInput label="Run (м)" val={el.run ?? 0.30} onChange={v => onUpdate(i, 'run', v)} step={0.01} />
          <ParamInput label="Шир. (м)" val={el.stairWidth ?? 1.2} onChange={v => onUpdate(i, 'stairWidth', v)} step={0.1} />
        </>)}
        {t === 'door' && (<>
          <ParamInput label="Шир. (м)" val={el.doorWidth ?? 0.9} onChange={v => onUpdate(i, 'doorWidth', v)} step={0.1} />
          <ParamInput label="Вис. (м)" val={el.doorHeight ?? 2.1} onChange={v => onUpdate(i, 'doorHeight', v)} step={0.1} />
        </>)}
        {t === 'window' && (<>
          <ParamInput label="Шир. (м)" val={el.windowWidth ?? 1.2} onChange={v => onUpdate(i, 'windowWidth', v)} step={0.1} />
          <ParamInput label="Вис. (м)" val={el.windowHeight ?? 1.5} onChange={v => onUpdate(i, 'windowHeight', v)} step={0.1} />
          <ParamInput label="Перваз (м)" val={el.windowSill ?? 0.9} onChange={v => onUpdate(i, 'windowSill', v)} step={0.1} />
        </>)}
        {t === 'beam' && (<>
          <ParamInput label="Шир. (см)" val={el.beamWidth ?? 25} onChange={v => onUpdate(i, 'beamWidth', v)} />
          <ParamInput label="Кота (м)" val={el.beamElevation ?? 2.7} onChange={v => onUpdate(i, 'beamElevation', v)} step={0.1} />
        </>)}
      </div>

      {/* TYPE SWITCH */}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {['wall', 'roof', 'slab', 'stairs', 'door', 'window', 'column', 'beam', 'ignore'].map(tp => (
          <button key={tp} onClick={e => { e.stopPropagation(); onUpdate(i, '_type', tp); }}
            className={`text-[8px] px-1.5 py-0.5 rounded border ${t === tp ? 'border-[#28A745] bg-[#28A745]/10 text-[#28A745]' : 'border-[#2A3A4C] text-slate-600 hover:text-slate-300'}`}>
            {TYPE_LABELS[tp] || tp}
          </button>
        ))}
      </div>
    </div>
  );
}

export const StructurePanel = ({ els, selIdx, scale, onSelect, onDelete, onUpdate, onUpdateDimension, onAddManual, onClear }) => {
  const objCount = els.filter(e => e.tool !== 'dimension' && (e._type || autoType(e)) !== 'ignore').length;
  return (
    <div data-testid="structure-panel">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm font-medium">Обекти ({objCount})</span>
        <div className="flex flex-wrap gap-1.5">
          {MANUAL_TYPES.map(([t, l, c]) => (
            <button key={t} onClick={() => onAddManual(t)} data-testid={`add-${t}-btn`}
              className="text-[10px] px-2 py-0.5 rounded border hover:opacity-80"
              style={{ borderColor: `${c}50`, color: c, background: `${c}15` }}>
              <Plus className="h-3 w-3 inline mr-0.5" />{l}
            </button>
          ))}
          {els.length > 0 && <button onClick={onClear} className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30" data-testid="clear-all-btn">Изчисти</button>}
        </div>
      </div>
      {objCount === 0 ? (
        <p className="text-slate-600 text-xs py-3 text-center">Нарисувайте обекти или добавете ръчно</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
          {els.map((el, i) => (
            <ObjectCard key={i} el={el} i={i} isSel={i === selIdx} scale={scale}
              onSelect={onSelect} onDelete={onDelete} onUpdate={onUpdate}
              onUpdateDimension={onUpdateDimension} els={els} />
          ))}
        </div>
      )}
    </div>
  );
};
