import React, { useState, useRef, useCallback, Suspense, useEffect, useMemo } from 'react';
import { Upload, Loader2, X, Download, Ruler, Building2, Layers, RotateCcw, Eye, Share2,
  Pencil, Square, ArrowUpRight, Eraser, MousePointer, Type, Plus, Minus, Check, AlertCircle, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useSearchParams } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ========== PARAMETRIC 3D GEOMETRY ==========
const WallMesh = ({ obj }) => {
  const { length, height, thickness } = obj;
  const sx = obj.startX || 0, sz = obj.startZ || 0;
  const ex = obj.endX ?? sx + length, ez = obj.endZ ?? sz;
  const cx = (sx + ex) / 2, cz = (sz + ez) / 2;
  const dx = ex - sx, dz = ez - sz;
  const angle = Math.atan2(dz, dx);
  const actualLen = Math.sqrt(dx * dx + dz * dz) || length;
  return (
    <mesh position={[cx, height / 2, cz]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[actualLen, height, thickness]} />
      <meshStandardMaterial color="#d4d4d4" />
    </mesh>
  );
};

const StairsMesh = ({ obj }) => {
  const { steps, rise, run, width, startX = 0, startZ = 0 } = obj;
  const meshes = [];
  for (let i = 0; i < steps; i++) {
    meshes.push(
      <mesh key={i} position={[startX + (i * run) + run / 2, (i + 0.5) * rise, startZ]}>
        <boxGeometry args={[run * 0.95, rise, width]} />
        <meshStandardMaterial color="#b8a080" />
      </mesh>
    );
  }
  return <group>{meshes}</group>;
};

const SlabMesh = ({ obj }) => {
  const { width, depth, thickness = 0.15, x = 0, z = 0 } = obj;
  return (
    <mesh position={[x + width / 2, -thickness / 2, z + depth / 2]}>
      <boxGeometry args={[width, thickness, depth]} />
      <meshStandardMaterial color="#c0c0c0" />
    </mesh>
  );
};

const ParametricScene = ({ objects }) => {
  return (
    <group>
      {objects.map((obj, i) => {
        if (obj.type === 'wall') return <WallMesh key={i} obj={obj} />;
        if (obj.type === 'stairs') return <StairsMesh key={i} obj={obj} />;
        if (obj.type === 'slab') return <SlabMesh key={i} obj={obj} />;
        return null;
      })}
    </group>
  );
};

// GLB viewer for uploaded sketch results
const GlbViewer = ({ glbBase64 }) => {
  const [scene, setScene] = useState(null);
  useEffect(() => {
    if (!glbBase64) return;
    const binary = atob(glbBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => { setScene(gltf.scene); URL.revokeObjectURL(url); });
  }, [glbBase64]);
  if (!scene) return null;
  return <primitive object={scene} />;
};

// ========== OBJECT TYPES ==========
const OBJECT_TYPES = [
  { id: 'retaining_wall', label: 'Подпорна стена', icon: '|' },
  { id: 'wall', label: 'Стена', icon: '|' },
  { id: 'staircase', label: 'Стълбище', icon: '/' },
  { id: 'slab', label: 'Плоча / Под', icon: '_' },
  { id: 'building', label: 'Сграда', icon: '#' },
];

// ========== CAD CANVAS (HTML Canvas - simpler & more reliable) ==========
const GRID_SIZE = 20;
const CANVAS_W = 800;
const CANVAS_H = 500;

const TOOLS = [
  { id: 'select', label: 'Избери', icon: MousePointer },
  { id: 'wall', label: 'Стена', icon: Square },
  { id: 'line', label: 'Линия', icon: Pencil },
  { id: 'rect', label: 'Правоъгълник', icon: Square },
  { id: 'stairs', label: 'Стълби', icon: ArrowUpRight },
  { id: 'dimension', label: 'Размер', icon: Ruler },
  { id: 'erase', label: 'Изтрий', icon: Eraser },
];

function snapToGrid(x, y) {
  return [Math.round(x / GRID_SIZE) * GRID_SIZE, Math.round(y / GRID_SIZE) * GRID_SIZE];
}

function snapToEndpoint(x, y, elements, threshold = 12) {
  let closest = null, minDist = threshold;
  for (const el of elements) {
    for (const pt of [{ x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }]) {
      const d = Math.hypot(pt.x - x, pt.y - y);
      if (d < minDist) { minDist = d; closest = pt; }
    }
  }
  return closest ? [closest.x, closest.y] : snapToGrid(x, y);
}

function drawCAD(ctx, elements, drawing, selectedIdx, scale) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  // Background
  ctx.fillStyle = '#1a2332';
  ctx.fillRect(0, 0, w, h);
  // Grid
  ctx.strokeStyle = '#2a3a4c';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += GRID_SIZE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += GRID_SIZE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Elements
  elements.forEach((el, i) => {
    const isSel = i === selectedIdx;
    if (el.tool === 'wall' || el.tool === 'line') {
      ctx.strokeStyle = isSel ? '#FF8C42' : el.tool === 'wall' ? '#90cdf4' : '#a0aec0';
      ctx.lineWidth = el.tool === 'wall' ? 6 : 2;
      ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
      // Dimension label
      const len = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
      const meters = (len / GRID_SIZE * scale).toFixed(1);
      const mx = (el.x1 + el.x2) / 2, my = (el.y1 + el.y2) / 2;
      ctx.fillStyle = '#FF8C42';
      ctx.font = '11px monospace';
      ctx.fillText(`${meters}м`, mx + 5, my - 5);
    } else if (el.tool === 'rect') {
      ctx.strokeStyle = isSel ? '#FF8C42' : '#68d391';
      ctx.lineWidth = 3;
      ctx.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
      const wm = (Math.abs(el.x2 - el.x1) / GRID_SIZE * scale).toFixed(1);
      const hm = (Math.abs(el.y2 - el.y1) / GRID_SIZE * scale).toFixed(1);
      ctx.fillStyle = '#68d391';
      ctx.font = '10px monospace';
      ctx.fillText(`${wm}x${hm}м`, Math.min(el.x1, el.x2) + 4, Math.min(el.y1, el.y2) - 4);
    } else if (el.tool === 'stairs') {
      const steps = el.steps || 8;
      const dx = (el.x2 - el.x1) / steps, dy = (el.y2 - el.y1) / steps;
      ctx.strokeStyle = isSel ? '#FF8C42' : '#ffa500';
      ctx.lineWidth = 2;
      for (let s = 0; s <= steps; s++) {
        const sx = el.x1 + dx * s, sy = el.y1 + dy * s;
        ctx.beginPath(); ctx.moveTo(sx - 10, sy); ctx.lineTo(sx + 10, sy); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
      ctx.fillStyle = '#ffa500'; ctx.font = '10px monospace';
      ctx.fillText(`${steps} стъпала`, el.x1 + 15, el.y1 - 5);
    } else if (el.tool === 'dimension') {
      ctx.strokeStyle = '#8C56FF';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
      ctx.setLineDash([]);
      const len = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
      const meters = (len / GRID_SIZE * scale).toFixed(2);
      const mx = (el.x1 + el.x2) / 2, my = (el.y1 + el.y2) / 2;
      ctx.fillStyle = '#8C56FF'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`${meters}м`, mx + 5, my - 8);
    }
    // Selection handles
    if (isSel) {
      ctx.fillStyle = '#FF8C42';
      [{ x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }].forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
      });
    }
  });

  // Drawing preview
  if (drawing) {
    ctx.strokeStyle = '#FF8C42'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
    if (drawing.tool === 'rect') {
      ctx.strokeRect(drawing.x1, drawing.y1, drawing.x2 - drawing.x1, drawing.y2 - drawing.y1);
    } else {
      ctx.beginPath(); ctx.moveTo(drawing.x1, drawing.y1); ctx.lineTo(drawing.x2, drawing.y2); ctx.stroke();
    }
    ctx.setLineDash([]);
  }
}

const SketchCAD = ({ elements, setElements, selectedIdx, setSelectedIdx, scale }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('wall');
  const [drawing, setDrawing] = useState(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawCAD(ctx, elements, drawing, selectedIdx, scale);
  }, [elements, drawing, selectedIdx, scale]);

  const getPos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const rawX = e.clientX - r.left, rawY = e.clientY - r.top;
    return snapToEndpoint(rawX, rawY, elements);
  };

  const onMouseDown = (e) => {
    const [x, y] = getPos(e);
    if (tool === 'select') {
      // Find clicked element
      let found = -1;
      elements.forEach((el, i) => {
        const d = distToSegment(x, y, el.x1, el.y1, el.x2, el.y2);
        if (d < 10) found = i;
      });
      setSelectedIdx(found);
      return;
    }
    if (tool === 'erase') {
      let found = -1;
      elements.forEach((el, i) => {
        const d = distToSegment(x, y, el.x1, el.y1, el.x2, el.y2);
        if (d < 10) found = i;
      });
      if (found >= 0) {
        setElements(prev => prev.filter((_, i) => i !== found));
        setSelectedIdx(-1);
      }
      return;
    }
    setDrawing({ tool, x1: x, y1: y, x2: x, y2: y });
  };

  const onMouseMove = (e) => {
    if (!drawing) return;
    const [x, y] = getPos(e);
    setDrawing(prev => ({ ...prev, x2: x, y2: y }));
  };

  const onMouseUp = () => {
    if (!drawing) return;
    const len = Math.hypot(drawing.x2 - drawing.x1, drawing.y2 - drawing.y1);
    if (len > 10) {
      const newEl = { ...drawing, steps: tool === 'stairs' ? 8 : undefined };
      setElements(prev => [...prev, newEl]);
    }
    setDrawing(null);
  };

  return (
    <div data-testid="cad-canvas-section">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1.5 mb-3" data-testid="cad-toolbar">
        {TOOLS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tool === t.id ? 'bg-[#FF8C42] text-white' : 'bg-[#1E2A38] text-slate-400 hover:text-white border border-[#3A4A5C]'
              }`} data-testid={`tool-${t.id}`}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>
      {/* Canvas */}
      <div className="rounded-xl overflow-hidden border border-[#3A4A5C] bg-[#1a2332]" style={{ cursor: tool === 'select' ? 'default' : tool === 'erase' ? 'crosshair' : 'crosshair' }}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
          className="w-full" style={{ maxHeight: 500 }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
          onMouseLeave={() => drawing && setDrawing(null)}
          data-testid="cad-canvas" />
      </div>
      <p className="text-slate-600 text-[10px] mt-1">Grid: 1 кв = {scale}м | Snap to grid + endpoints</p>
    </div>
  );
};

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ========== AI SHAPE DETECTION ==========
function detectShapes(elements, scale) {
  const suggestions = [];
  elements.forEach((el, i) => {
    if (el.tool === 'wall' || el.tool === 'line') {
      const len = Math.hypot(el.x2 - el.x1, el.y2 - el.y1) / GRID_SIZE * scale;
      const angle = Math.abs(Math.atan2(el.y2 - el.y1, el.x2 - el.x1) * 180 / Math.PI);
      if (angle > 20 && angle < 70 && len > 1) {
        suggestions.push({ index: i, type: 'staircase', msg: `Диагонална линия (${len.toFixed(1)}м) — стълбище?` });
      } else if (len > 0.5) {
        suggestions.push({ index: i, type: 'wall', msg: `Линия ${len.toFixed(1)}м — стена?`, auto: true });
      }
    } else if (el.tool === 'rect') {
      const w = Math.abs(el.x2 - el.x1) / GRID_SIZE * scale;
      const h = Math.abs(el.y2 - el.y1) / GRID_SIZE * scale;
      if (Math.min(w, h) < 0.4) {
        suggestions.push({ index: i, type: 'wall', msg: `Тесен правоъгълник (${w.toFixed(1)}x${h.toFixed(1)}м) — стена?` });
      } else {
        suggestions.push({ index: i, type: 'slab', msg: `Правоъгълник ${w.toFixed(1)}x${h.toFixed(1)}м — плоча?` });
      }
    } else if (el.tool === 'stairs') {
      suggestions.push({ index: i, type: 'staircase', msg: `Стълбище (${el.steps || 8} стъпала)`, auto: true });
    }
  });
  return suggestions;
}

// ========== CONVERT CANVAS TO 3D OBJECTS ==========
function canvasTo3D(elements, scale, confirmedTypes) {
  const objects = [];
  elements.forEach((el, i) => {
    const cType = confirmedTypes[i];
    if (!cType || cType === 'ignore') return;
    const lenPx = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
    const lenM = lenPx / GRID_SIZE * scale;

    if (cType === 'wall' || cType === 'retaining_wall') {
      objects.push({
        type: 'wall',
        length: lenM,
        height: el.height || 3,
        thickness: (el.thickness || 30) / 100,
        startX: el.x1 / GRID_SIZE * scale,
        startZ: el.y1 / GRID_SIZE * scale,
        endX: el.x2 / GRID_SIZE * scale,
        endZ: el.y2 / GRID_SIZE * scale,
        label: `Стена #${objects.filter(o => o.type === 'wall').length + 1}`,
      });
    } else if (cType === 'staircase') {
      const steps = el.steps || 8;
      objects.push({
        type: 'stairs',
        steps,
        rise: el.rise || 0.17,
        run: el.run || 0.30,
        width: el.stairWidth || 1.2,
        startX: el.x1 / GRID_SIZE * scale,
        startZ: el.y1 / GRID_SIZE * scale,
        label: `Стълбище (${steps} стъпала)`,
      });
    } else if (cType === 'slab') {
      const x1 = Math.min(el.x1, el.x2) / GRID_SIZE * scale;
      const z1 = Math.min(el.y1, el.y2) / GRID_SIZE * scale;
      const w = Math.abs(el.x2 - el.x1) / GRID_SIZE * scale;
      const d = Math.abs(el.y2 - el.y1) / GRID_SIZE * scale;
      objects.push({
        type: 'slab',
        width: w,
        depth: d,
        thickness: (el.slabThickness || 15) / 100,
        x: x1,
        z: z1,
        label: `Плоча ${w.toFixed(1)}x${d.toFixed(1)}м`,
      });
    }
  });
  return objects;
}

// ========== MAIN PAGE ==========
export const AISketchPage = () => {
  // Mode: 'draw' (CAD) or 'upload' (image → CV/OCR)
  const [mode, setMode] = useState('draw');
  const [step, setStep] = useState(1); // 1=draw, 2=dimensions, 3=description, 4=review, 5=3d
  const [scale, setScale] = useState(1); // meters per grid cell

  // CAD state
  const [elements, setElements] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [confirmedTypes, setConfirmedTypes] = useState({});
  const [description, setDescription] = useState('');
  const [objects3D, setObjects3D] = useState([]);

  // Upload state (existing)
  const [sketches, setSketches] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const [buildingType, setBuildingType] = useState('residential');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [searchParams] = useSearchParams();
  const fileRefs = [useRef(null), useRef(null), useRef(null)];

  // Load shared project
  useEffect(() => {
    const sharedId = searchParams.get('id');
    if (sharedId) {
      setMode('upload');
      axios.get(`${API}/ai-sketch/${sharedId}`).then(res => {
        setUploadResults(res.data);
        setStep(5);
        toast.success('Проект зареден');
      }).catch(() => toast.error('Проектът не е намерен'));
    }
  }, [searchParams]);

  const shareProject = () => {
    if (!uploadResults?.id) return;
    const url = `${window.location.origin}/ai-sketch?id=${uploadResults.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Линк копиран!')).catch(() => {});
  };

  // Upload handlers
  const handleUpload = useCallback(async (index, e) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 15 * 1024 * 1024) { toast.error('Макс. 15MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSketches(prev => { const n = [...prev]; n[index] = ev.target.result; return n; });
      setPreviews(prev => { const n = [...prev]; n[index] = ev.target.result; return n; });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = async () => {
    const valid = sketches.filter(Boolean);
    if (!valid.length) { toast.error('Качете поне 1 скица'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/ai-sketch/analyze`, { sketches: valid, building_type: buildingType, notes }, { timeout: 300000 });
      setUploadResults(res.data);
      setStep(5);
      toast.success('3D модел генериран!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Грешка при анализ');
    }
    setLoading(false);
  };

  // CAD handlers
  const suggestions = useMemo(() => detectShapes(elements, scale), [elements, scale]);

  const applySuggestion = (idx, type) => {
    setConfirmedTypes(prev => ({ ...prev, [idx]: type }));
  };

  const generate3D = () => {
    // Auto-confirm unconfirmed with auto suggestions
    const types = { ...confirmedTypes };
    suggestions.forEach(s => {
      if (s.auto && !types[s.index]) types[s.index] = s.type;
    });
    setConfirmedTypes(types);
    const objs = canvasTo3D(elements, scale, types);
    if (!objs.length) { toast.error('Няма потвърдени обекти. Потвърдете поне 1.'); return; }
    setObjects3D(objs);
    setStep(5);
    toast.success(`3D модел с ${objs.length} обекта!`);
  };

  const updateElement = (idx, field, value) => {
    setElements(prev => prev.map((el, i) => i === idx ? { ...el, [field]: value } : el));
  };

  const reset = () => {
    setElements([]); setSelectedIdx(-1); setConfirmedTypes({});
    setDescription(''); setObjects3D([]); setUploadResults(null);
    setSketches([null, null, null]); setPreviews([null, null, null]);
    setStep(1); setNotes('');
  };

  const downloadGlb = () => {
    if (!uploadResults?.glb_base64) return;
    const binary = atob(uploadResults.glb_base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `temadom-${uploadResults.id || 'model'}.glb`; a.click();
    URL.revokeObjectURL(url);
  };

  const show3D = step === 5 && (objects3D.length > 0 || uploadResults);

  return (
    <div className="min-h-screen bg-[#1E2A38] py-6" data-testid="ai-sketch-page">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#FF8C42]/15 border border-[#FF8C42]/30 rounded-full px-4 py-1.5 mb-3">
            <Ruler className="h-4 w-4 text-[#FF8C42]" />
            <span className="font-medium text-xs text-[#FF8C42]">AI CAD SKETCH — Параметрично 3D</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Скица &rarr; 3D модел</h1>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Нарисувайте или качете скица. AI разпознава обекти и генерира точен 3D модел от вашите параметри.
          </p>
        </div>

        {/* Mode Tabs */}
        {step < 5 && (
          <div className="flex justify-center gap-3 mb-6" data-testid="mode-tabs">
            <button onClick={() => { setMode('draw'); setStep(1); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'draw' ? 'bg-[#FF8C42] text-white shadow-lg' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C] hover:text-white'}`}
              data-testid="mode-draw">
              <Pencil className="h-4 w-4 inline mr-2" /> Нарисувай (CAD)
            </button>
            <button onClick={() => { setMode('upload'); setStep(1); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'upload' ? 'bg-[#FF8C42] text-white shadow-lg' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C] hover:text-white'}`}
              data-testid="mode-upload">
              <Upload className="h-4 w-4 inline mr-2" /> Качи скица (CV/OCR)
            </button>
          </div>
        )}

        {/* Step Indicator */}
        {mode === 'draw' && step < 5 && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[
              { n: 1, label: 'Рисуване' },
              { n: 2, label: 'Размери' },
              { n: 3, label: 'Описание' },
              { n: 4, label: 'Преглед' },
            ].map((s, i) => (
              <React.Fragment key={s.n}>
                {i > 0 && <div className={`w-8 h-0.5 ${step >= s.n ? 'bg-[#FF8C42]' : 'bg-[#3A4A5C]'}`} />}
                <button onClick={() => step >= s.n && setStep(s.n)}
                  className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    step === s.n ? 'bg-[#FF8C42] text-white' : step > s.n ? 'bg-[#28A745] text-white' : 'bg-[#3A4A5C] text-slate-500'
                  }`}>{step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}</button>
                <span className={`text-[10px] ${step >= s.n ? 'text-white' : 'text-slate-600'}`}>{s.label}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ===== DRAW MODE ===== */}
        {mode === 'draw' && !show3D && (
          <div className="space-y-5">
            {/* Step 1: CAD Canvas */}
            {step === 1 && (
              <>
                <Card className="bg-[#253545] border-[#3A4A5C]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-[#FF8C42]" /> CAD Рисуване
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Label className="text-slate-400 text-xs">Мащаб (м/кв):</Label>
                        <Input type="number" value={scale} onChange={e => setScale(Math.max(0.1, +e.target.value || 1))}
                          className="w-16 h-7 text-xs bg-[#1E2A38] border-[#3A4A5C] text-white" data-testid="scale-input" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SketchCAD elements={elements} setElements={setElements}
                      selectedIdx={selectedIdx} setSelectedIdx={setSelectedIdx} scale={scale} />
                  </CardContent>
                </Card>
                {elements.length > 0 && (
                  <Button className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white h-12"
                    onClick={() => setStep(2)} data-testid="next-step-2">
                    Напред: Размери &rarr; ({elements.length} елемента)
                  </Button>
                )}
              </>
            )}

            {/* Step 2: Dimension Editing + Structure Panel */}
            {step === 2 && (
              <>
                <Card className="bg-[#253545] border-[#3A4A5C]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-[#FF8C42]" /> Размери и класификация
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3" data-testid="dimension-panel">
                    {elements.map((el, i) => {
                      const lenPx = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
                      const lenM = (lenPx / GRID_SIZE * scale).toFixed(2);
                      const suggestion = suggestions.find(s => s.index === i);
                      const confirmed = confirmedTypes[i];
                      return (
                        <div key={i} className={`p-3 rounded-lg border ${selectedIdx === i ? 'border-[#FF8C42] bg-[#FF8C42]/5' : 'border-[#3A4A5C] bg-[#1E2A38]'}`}
                          onClick={() => setSelectedIdx(i)} data-testid={`element-${i}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-xs font-medium">
                              {el.tool === 'wall' ? 'Стена' : el.tool === 'rect' ? 'Правоъгълник' : el.tool === 'stairs' ? 'Стълби' : el.tool === 'line' ? 'Линия' : 'Размер'} #{i + 1}
                            </span>
                            <Badge className="bg-[#FF8C42]/15 text-[#FF8C42] border-[#FF8C42]/30 text-[10px]">{lenM}м</Badge>
                          </div>
                          {/* AI Suggestion */}
                          {suggestion && !confirmed && (
                            <div className="flex items-center gap-2 mb-2 bg-[#8C56FF]/10 border border-[#8C56FF]/30 rounded-lg p-2">
                              <AlertCircle className="h-3.5 w-3.5 text-[#8C56FF] flex-shrink-0" />
                              <span className="text-[#8C56FF] text-[10px] flex-1">{suggestion.msg}</span>
                              <button onClick={() => applySuggestion(i, suggestion.type)} className="text-[10px] bg-[#8C56FF] text-white px-2 py-0.5 rounded" data-testid={`apply-suggestion-${i}`}>Приложи</button>
                              <button onClick={() => applySuggestion(i, 'ignore')} className="text-[10px] bg-[#3A4A5C] text-slate-300 px-2 py-0.5 rounded">Пропусни</button>
                            </div>
                          )}
                          {confirmed && confirmed !== 'ignore' && (
                            <Badge className="bg-[#28A745]/15 text-[#28A745] border-[#28A745]/30 text-[10px] mb-2">
                              {OBJECT_TYPES.find(t => t.id === confirmed)?.label || confirmed}
                            </Badge>
                          )}
                          {/* Dimension fields */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-slate-500 text-[10px]">Височина (м)</Label>
                              <Input type="number" step="0.1" value={el.height || 3}
                                onChange={e => updateElement(i, 'height', +e.target.value)}
                                className="h-7 text-xs bg-[#0F1923] border-[#3A4A5C] text-white" />
                            </div>
                            <div>
                              <Label className="text-slate-500 text-[10px]">Дебелина (см)</Label>
                              <Input type="number" step="1" value={el.thickness || 30}
                                onChange={e => updateElement(i, 'thickness', +e.target.value)}
                                className="h-7 text-xs bg-[#0F1923] border-[#3A4A5C] text-white" />
                            </div>
                            {(el.tool === 'stairs' || confirmed === 'staircase') && (
                              <>
                                <div>
                                  <Label className="text-slate-500 text-[10px]">Стъпала</Label>
                                  <Input type="number" value={el.steps || 8}
                                    onChange={e => updateElement(i, 'steps', +e.target.value)}
                                    className="h-7 text-xs bg-[#0F1923] border-[#3A4A5C] text-white" />
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-[10px]">Стъпка h (м)</Label>
                                  <Input type="number" step="0.01" value={el.rise || 0.17}
                                    onChange={e => updateElement(i, 'rise', +e.target.value)}
                                    className="h-7 text-xs bg-[#0F1923] border-[#3A4A5C] text-white" />
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-[10px]">Стъпка d (м)</Label>
                                  <Input type="number" step="0.01" value={el.run || 0.30}
                                    onChange={e => updateElement(i, 'run', +e.target.value)}
                                    className="h-7 text-xs bg-[#0F1923] border-[#3A4A5C] text-white" />
                                </div>
                              </>
                            )}
                            {(el.tool === 'rect' && (confirmed === 'slab' || !confirmed)) && (
                              <div>
                                <Label className="text-slate-500 text-[10px]">Дебелина (см)</Label>
                                <Input type="number" step="1" value={el.slabThickness || 15}
                                  onChange={e => updateElement(i, 'slabThickness', +e.target.value)}
                                  className="h-7 text-xs bg-[#0F1923] border-[#3A4A5C] text-white" />
                              </div>
                            )}
                          </div>
                          {/* Object type selector */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {OBJECT_TYPES.map(ot => (
                              <button key={ot.id} onClick={() => applySuggestion(i, ot.id)}
                                className={`text-[9px] px-2 py-0.5 rounded border ${confirmed === ot.id ? 'border-[#28A745] bg-[#28A745]/10 text-[#28A745]' : 'border-[#3A4A5C] text-slate-500 hover:text-white'}`}>
                                {ot.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-[#3A4A5C] text-slate-300" onClick={() => setStep(1)}>
                    &larr; Обратно
                  </Button>
                  <Button className="flex-1 bg-[#FF8C42] hover:bg-[#e67a30] text-white h-12" onClick={() => setStep(3)} data-testid="next-step-3">
                    Напред: Описание &rarr;
                  </Button>
                </div>
              </>
            )}

            {/* Step 3: Description */}
            {step === 3 && (
              <>
                <Card className="bg-[#253545] border-[#3A4A5C]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Type className="h-4 w-4 text-[#FF8C42]" /> Описание на конструкцията
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)}
                      placeholder="Пример: Подпорна стена от стоманобетон с височина 10м. Стълбище от дясната страна с 12 стъпала."
                      className="bg-[#1E2A38] border-[#3A4A5C] text-white min-h-[120px]" data-testid="description-input" />
                    <p className="text-slate-500 text-[10px] mt-2">Описанието помага на AI да разбере контекста. Не е задължително.</p>
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-[#3A4A5C] text-slate-300" onClick={() => setStep(2)}>
                    &larr; Обратно
                  </Button>
                  <Button className="flex-1 bg-[#FF8C42] hover:bg-[#e67a30] text-white h-12" onClick={() => setStep(4)} data-testid="next-step-4">
                    Напред: Преглед &rarr;
                  </Button>
                </div>
              </>
            )}

            {/* Step 4: Review + Generate */}
            {step === 4 && (
              <>
                <Card className="bg-[#253545] border-[#3A4A5C]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4 text-[#28A745]" /> Преглед преди генериране
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3" data-testid="review-panel">
                    {elements.map((el, i) => {
                      const t = confirmedTypes[i];
                      if (!t || t === 'ignore') {
                        const sug = suggestions.find(s => s.index === i);
                        if (sug?.auto) return (
                          <div key={i} className="text-xs text-slate-400 bg-[#1E2A38] rounded-lg p-2">
                            {sug.msg} — <span className="text-[#28A745]">авто-потвърден</span>
                          </div>
                        );
                        return (
                          <div key={i} className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                            Елемент #{i + 1} — <span className="font-bold">Непотвърден</span> (ще бъде пропуснат)
                          </div>
                        );
                      }
                      const label = OBJECT_TYPES.find(o => o.id === t)?.label || t;
                      const lenM = (Math.hypot(el.x2 - el.x1, el.y2 - el.y1) / GRID_SIZE * scale).toFixed(1);
                      return (
                        <div key={i} className="flex items-center justify-between bg-[#1E2A38] rounded-lg p-2.5">
                          <div>
                            <span className="text-white text-xs font-medium">{label}</span>
                            <span className="text-slate-500 text-[10px] ml-2">{lenM}м, h={el.height || 3}м</span>
                          </div>
                          <Badge className="bg-[#28A745]/15 text-[#28A745] border-[#28A745]/30 text-[10px]">Потвърден</Badge>
                        </div>
                      );
                    })}
                    {description && (
                      <div className="text-xs text-slate-300 bg-[#1E2A38] rounded-lg p-2.5">
                        <span className="text-slate-500">Описание:</span> {description}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-[#3A4A5C] text-slate-300" onClick={() => setStep(3)}>
                    &larr; Обратно
                  </Button>
                  <Button className="flex-1 bg-[#28A745] hover:bg-[#22943e] text-white h-12 text-lg shadow-lg shadow-[#28A745]/20"
                    onClick={generate3D} data-testid="generate-3d-btn">
                    <Eye className="mr-2 h-5 w-5" /> Генерирай 3D модел
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== UPLOAD MODE ===== */}
        {mode === 'upload' && !show3D && (
          <div className="space-y-5">
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#FF8C42]" /> Качете скици/чертежи (1-3)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map(idx => (
                    <div key={idx}>
                      <input ref={fileRefs[idx]} type="file" accept="image/*" className="hidden"
                        onChange={e => handleUpload(idx, e)} data-testid={`sketch-upload-${idx}`} />
                      {previews[idx] ? (
                        <div className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-[#FF8C42]/30">
                            <img src={previews[idx]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <button onClick={() => { setSketches(p => { const n = [...p]; n[idx] = null; return n; }); setPreviews(p => { const n = [...p]; n[idx] = null; return n; }); }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <button onClick={() => fileRefs[idx].current?.click()}
                          className="aspect-square w-full rounded-xl border-2 border-dashed border-[#3A4A5C] hover:border-[#FF8C42]/50 flex flex-col items-center justify-center gap-2 bg-[#1E2A38]/50"
                          data-testid={`sketch-upload-btn-${idx}`}>
                          <Upload className="h-6 w-6 text-slate-500" /><span className="text-slate-500 text-xs">Файл {idx + 1}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#253545] border-[#3A4A5C]">
              <CardContent className="pt-5">
                <Label className="text-slate-300 text-sm mb-2 block">Бележки</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Размери, бележки..." className="bg-[#1E2A38] border-[#3A4A5C] text-white min-h-[80px]" data-testid="sketch-notes" />
              </CardContent>
            </Card>
            <Button className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white h-12" onClick={handleAnalyze}
              disabled={!sketches.filter(Boolean).length || loading} data-testid="analyze-btn">
              {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />CV анализира...</> : <><Ruler className="mr-2 h-5 w-5" />Генерирай 3D модел</>}
            </Button>
          </div>
        )}

        {/* ===== 3D RESULTS (shared by both modes) ===== */}
        {show3D && (
          <div className="space-y-5">
            <Card className="bg-[#253545] border-[#3A4A5C] overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="h-5 w-5 text-[#4DA6FF]" /> 360 3D модел
                  </CardTitle>
                  <div className="flex gap-2">
                    {uploadResults?.glb_base64 && (
                      <Button size="sm" onClick={downloadGlb} className="bg-[#28A745] hover:bg-[#22943e] text-white" data-testid="download-glb-btn">
                        <Download className="mr-1 h-3.5 w-3.5" /> .glb
                      </Button>
                    )}
                    {uploadResults?.id && (
                      <Button size="sm" onClick={shareProject} className="bg-[#4DA6FF] hover:bg-[#3a8fe0] text-white" data-testid="share-project-btn">
                        <Share2 className="mr-1 h-3.5 w-3.5" /> Сподели
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[400px] md:h-[500px] bg-[#0F1923] rounded-xl overflow-hidden border border-[#3A4A5C]" data-testid="3d-viewer">
                  <Canvas camera={{ position: [15, 12, 15], fov: 50 }}>
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 20, 10]} intensity={0.8} />
                    <directionalLight position={[-5, 10, -5]} intensity={0.3} />
                    <Suspense fallback={null}>
                      {objects3D.length > 0 && <ParametricScene objects={objects3D} />}
                      {uploadResults?.glb_base64 && <GlbViewer glbBase64={uploadResults.glb_base64} />}
                      {/* Ground plane */}
                      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                        <planeGeometry args={[50, 50]} />
                        <meshStandardMaterial color="#1a2332" />
                      </mesh>
                    </Suspense>
                    <OrbitControls enablePan enableZoom enableRotate autoRotate autoRotateSpeed={0.5} />
                  </Canvas>
                </div>
                <p className="text-slate-500 text-xs mt-2 text-center">Въртене | Zoom | Преместване</p>
              </CardContent>
            </Card>

            {/* Structure Panel */}
            {objects3D.length > 0 && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Обекти в сцената ({objects3D.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2" data-testid="structure-panel">
                  {objects3D.map((obj, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#1E2A38] rounded-lg p-2.5">
                      <div>
                        <span className="text-white text-xs font-medium">{obj.label}</span>
                        {obj.type === 'wall' && <span className="text-slate-500 text-[10px] ml-2">L={obj.length.toFixed(1)}м H={obj.height}м T={(obj.thickness * 100).toFixed(0)}см</span>}
                        {obj.type === 'stairs' && <span className="text-slate-500 text-[10px] ml-2">{obj.steps} стъпала, rise={obj.rise}м</span>}
                        {obj.type === 'slab' && <span className="text-slate-500 text-[10px] ml-2">{obj.width.toFixed(1)}x{obj.depth.toFixed(1)}м</span>}
                      </div>
                      <Badge className={`text-[10px] ${obj.type === 'wall' ? 'bg-[#4DA6FF]/15 text-[#4DA6FF]' : obj.type === 'stairs' ? 'bg-[#ffa500]/15 text-[#ffa500]' : 'bg-[#28A745]/15 text-[#28A745]'}`}>
                        {obj.type === 'wall' ? 'Стена' : obj.type === 'stairs' ? 'Стълби' : 'Плоча'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Summary for upload results */}
            {uploadResults?.summary && (
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader><CardTitle className="text-white text-sm">CV/OCR Анализ</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { val: uploadResults.summary.walls_detected, label: 'Стени', color: '#FF8C42' },
                      { val: uploadResults.summary.stairs_detected, label: 'Стълби', color: '#4DA6FF' },
                      { val: uploadResults.summary.dimensions_found, label: 'Размери', color: '#28A745' },
                      { val: uploadResults.summary.floor_area_sqm || '-', label: 'Площ м2', color: '#8C56FF' },
                    ].map((s, i) => (
                      <div key={i} className="bg-[#1E2A38] rounded-lg p-3 text-center">
                        <p className="text-xl font-bold" style={{ color: s.color }}>{s.val}</p>
                        <p className="text-slate-400 text-[10px]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-3 justify-center">
              <Button className="bg-[#FF8C42] hover:bg-[#e67a30] text-white" onClick={reset} data-testid="new-sketch-btn">
                <RotateCcw className="mr-2 h-4 w-4" /> Нов проект
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISketchPage;
