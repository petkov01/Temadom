// TemaDom IA CAD v5.1 — Structure Panel (Object List + Edit)
import React from 'react';
import { Trash2, Plus } from 'lucide-react';
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

const ParamInput = ({ label, val, onChange, step = 1, min }) => (
  <div>
    <Label className="text-slate-600 text-[9px]">{label}</Label>
    <Input type="number" step={step} min={min} value={val} onChange={e => onChange(+e.target.value)}
      className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" />
  </div>
);

function ObjectCard({ el, i, isSel, scale, onSelect, onDelete, onUpdate, els }) {
  const t = el._type || autoType(el);
  if (t === 'ignore' || el.tool === 'dimension') return null;
  const typeColor = OBJ_COLORS[t] || '#888';
  const hint = smartHint(el, scale);

  const count = els.slice(0, i).filter(e => (e._type || autoType(e)) === t).length + 1;
  let typeLabel = `${TYPE_LABELS[t] || t} #${count}`;
  if (t === 'stairs') typeLabel = `Стълби (${el.steps ?? 8} стъп.)`;
  if (t === 'slab') {
    const w = (Math.abs(el.x2 - el.x1) / GRID * scale).toFixed(1);
    const d = (Math.abs(el.y2 - el.y1) / GRID * scale).toFixed(1);
    typeLabel = `Плоча ${w}x${d}м`;
  }

  return (
    <div onClick={() => onSelect(i)}
      className={`p-2 rounded-lg border cursor-pointer transition-all ${isSel ? 'border-[#FF8C42] bg-[#FF8C42]/5' : 'border-[#2A3A4C] bg-[#1E2A38] hover:border-[#3A4A5C]'}`}
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
      <div className="grid grid-cols-2 gap-1.5">
        {t === 'wall' && (<>
          <ParamInput label="h (м)" val={el.height ?? 3} onChange={v => onUpdate(i, 'height', v)} step={0.1} />
          <ParamInput label="t (см)" val={el.thickness ?? 25} onChange={v => onUpdate(i, 'thickness', Math.max(15, Math.min(40, v)))} min={15} />
        </>)}
        {t === 'roof' && (<>
          <ParamInput label="Ъгъл (°)" val={el.roofAngle ?? 30} onChange={v => onUpdate(i, 'roofAngle', Math.max(15, Math.min(60, v)))} min={15} />
          <ParamInput label="Надвес (м)" val={el.overhang ?? 0.5} onChange={v => onUpdate(i, 'overhang', v)} step={0.1} />
        </>)}
        {t === 'slab' && (
          <ParamInput label="Дебел. (см)" val={el.slabThickness ?? 15} onChange={v => onUpdate(i, 'slabThickness', Math.max(12, Math.min(30, v)))} min={12} />
        )}
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
        {t === 'column' && (<>
          <ParamInput label="Диам. (см)" val={el.columnDiameter ?? 30} onChange={v => onUpdate(i, 'columnDiameter', v)} />
          <ParamInput label="Вис. (м)" val={el.columnHeight ?? 3} onChange={v => onUpdate(i, 'columnHeight', v)} step={0.1} />
        </>)}
        {t === 'beam' && (<>
          <ParamInput label="Шир. (см)" val={el.beamWidth ?? 25} onChange={v => onUpdate(i, 'beamWidth', v)} />
          <ParamInput label="Вис. (см)" val={el.beamHeight ?? 45} onChange={v => onUpdate(i, 'beamHeight', v)} />
          <ParamInput label="Кота (м)" val={el.beamElevation ?? 2.7} onChange={v => onUpdate(i, 'beamElevation', v)} step={0.1} />
        </>)}
      </div>
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

export const StructurePanel = ({ els, selIdx, scale, onSelect, onDelete, onUpdate, onAddManual, onClear }) => {
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
              onSelect={onSelect} onDelete={onDelete} onUpdate={onUpdate} els={els} />
          ))}
        </div>
      )}
    </div>
  );
};
