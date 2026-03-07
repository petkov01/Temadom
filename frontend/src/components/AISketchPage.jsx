// TemaDom IA CAD v5.2 — Main Page (Orchestrator)
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Upload, Loader2, X, Download, Ruler, RotateCcw, Eye, Share2, FileText,
  MousePointer, Square, Triangle, Layers, Circle, ArrowUpRight,
  Minus, Eraser, DoorOpen, PanelTop, Cylinder, Fence } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useSearchParams } from 'react-router-dom';

import { TOOLS, GRID, CW, CH, DEFAULTS } from './cad/constants';
import { snapEndpoint, distSeg, distCircle, autoType, getDefaults, elLength, calculateCosts, REGIONS } from './cad/utils';
import { CADCanvas, detectHandle } from './cad/CADCanvas';
import { useThreeViewer } from './cad/ThreeDPreview';
import { StructurePanel } from './cad/StructurePanel';
import { CostEstimate } from './cad/CostEstimate';

// Handle detection for selected element (used in onDown)
function detectElementHandle(x, y, el) {
  return detectHandle(x, y, el);
}

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ICON_MAP = {
  select: MousePointer, wall: Fence, roof: Triangle, slab: Layers,
  rect: Square, circle: Circle, stairs: ArrowUpRight, door: DoorOpen,
  window: PanelTop, column: Cylinder, beam: Minus, dimension: Ruler, erase: Eraser,
};

// ===== GLB Viewer =====
function useGlbViewer(containerRef, glbBase64) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !glbBase64) return;
    const w = container.clientWidth, h = container.clientHeight;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0F1923);
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000); camera.position.set(15, 12, 15);
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(w, h); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 0.5;
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(10, 20, 10); scene.add(dl);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x1a2332 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
    scene.add(new THREE.GridHelper(50, 50, 0x253545, 0x1e2e3f));
    const b = atob(glbBase64), u8 = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: 'model/gltf-binary' }));
    new GLTFLoader().load(url, gltf => { scene.add(gltf.scene); URL.revokeObjectURL(url); });
    let raf;
    const animate = () => { raf = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();
    return () => { cancelAnimationFrame(raf); controls.dispose(); renderer.dispose(); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement); };
  }, [containerRef, glbBase64]);
}

// ===== MAIN COMPONENT =====
export const AISketchPage = () => {
  const [mode, setMode] = useState('draw');
  const [scale, setScale] = useState(1);
  const [currentFloor, setCurrentFloor] = useState(0);

  // CAD state
  const [els, setEls] = useState([]);
  const [selIdx, setSelIdx] = useState(-1);
  const [tool, setTool] = useState('wall');
  const [colShape, setColShape] = useState('round');
  const [region, setRegion] = useState('plovdiv');
  const [draft, setDraft] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [distLines, setDistLines] = useState([]);
  const [sketches, setSketches] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const viewerRef = useRef(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadRes, setUploadRes] = useState(null);
  const [searchParams] = useSearchParams();
  const fileRefs = [useRef(null), useRef(null), useRef(null)];
  const glbViewerRef = useRef(null);

  // Undo/Redo
  const historyRef = useRef([]);
  const historyPosRef = useRef(-1);
  const saveSnapshot = useCallback((snapshot) => {
    historyRef.current = historyRef.current.slice(0, historyPosRef.current + 1);
    historyRef.current.push(snapshot.map(e => ({ ...e })));
    historyPosRef.current = historyRef.current.length - 1;
  }, []);
  const undo = useCallback(() => {
    if (historyPosRef.current > 0) {
      historyPosRef.current--;
      setEls(historyRef.current[historyPosRef.current].map(e => ({ ...e })));
      setSelIdx(-1);
    }
  }, []);
  const redo = useCallback(() => {
    if (historyPosRef.current < historyRef.current.length - 1) {
      historyPosRef.current++;
      setEls(historyRef.current[historyPosRef.current].map(e => ({ ...e })));
      setSelIdx(-1);
    }
  }, []);

  // Keyboard shortcuts (Ctrl+Z/Y, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Load shared project
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) { setMode('upload'); axios.get(`${API}/ai-sketch/${id}`).then(r => setUploadRes(r.data)).catch(() => toast.error('Не е намерен')); }
  }, [searchParams]);

  // Live 3D + GLB viewer
  useThreeViewer(viewerRef, els, scale, selIdx);
  useGlbViewer(glbViewerRef, uploadRes?.glb_base64);

  const objCount = useMemo(() => els.filter(e => e.tool !== 'dimension' && (e._type || autoType(e)) !== 'ignore').length, [els]);

  // ===== DRAWING HANDLERS =====
  // Calculate distance from a point to nearest wall/column edges
  const calcDistances = useCallback((el, allEls) => {
    const lines = [];
    const cx = el.tool === 'circle' ? el.cx : (el.x1 + (el.x2 || el.x1)) / 2;
    const cy = el.tool === 'circle' ? el.cy : (el.y1 + (el.y2 || el.y1)) / 2;
    allEls.forEach((other, oi) => {
      if (other === el || other.tool === 'dimension') return;
      const t = other._type || autoType(other);
      if (!['wall', 'column', 'slab'].includes(t)) return;
      const ox = other.tool === 'circle' ? other.cx : (other.x1 + (other.x2 || other.x1)) / 2;
      const oy = other.tool === 'circle' ? other.cy : (other.y1 + (other.y2 || other.y1)) / 2;
      const d = Math.hypot(cx - ox, cy - oy);
      if (d < 400 && d > 5) {
        lines.push({ x1: cx, y1: cy, x2: ox, y2: oy, dist: (d / GRID * scale).toFixed(2) });
      }
    });
    return lines.slice(0, 3);
  }, [scale]);

  const onDown = useCallback((x, y, mods = {}) => {
    if (tool === 'select') {
      // Priority 1: Check handles on currently selected element
      if (selIdx >= 0 && els[selIdx]) {
        const handle = detectElementHandle(x, y, els[selIdx]);
        if (handle) {
          const mode = handle === 'center' ? 'whole' : handle;
          setDragInfo({ idx: selIdx, startX: x, startY: y, origEl: { ...els[selIdx] }, mode });
          setDistLines(calcDistances(els[selIdx], els));
          return;
        }
      }
      // Priority 2: Find element under cursor (top-first order)
      let found = -1;
      let dragMode = 'whole';
      for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i];
        if (el.tool === 'circle') {
          if (distCircle(x, y, el.cx, el.cy, el.r || 0) < 12) { found = i; break; }
        } else if (el.tool === 'column') {
          if (el.columnShape === 'rect') {
            const hw = Math.max((el.columnWidth || 30) / 100 / scale * GRID, 6) / 2 + 6;
            const hl = Math.max((el.columnLength || 30) / 100 / scale * GRID, 6) / 2 + 6;
            if (Math.abs(x - el.x1) < hw && Math.abs(y - el.y1) < hl) { found = i; break; }
          } else {
            if (Math.hypot(x - el.x1, y - el.y1) < 15) { found = i; break; }
          }
        } else {
          const d1 = Math.hypot(x - el.x1, y - el.y1);
          const d2 = Math.hypot(x - (el.x2 || el.x1), y - (el.y2 || el.y1));
          if (d1 < 14) { found = i; dragMode = 'p1'; break; }
          else if (d2 < 14) { found = i; dragMode = 'p2'; break; }
          else if (distSeg(x, y, el.x1, el.y1, el.x2, el.y2) < 12) { found = i; dragMode = 'whole'; break; }
        }
      }
      setSelIdx(found);
      if (found >= 0) {
        const el = els[found];
        setDragInfo({ idx: found, startX: x, startY: y, origEl: { ...el }, mode: dragMode });
        setDistLines(calcDistances(el, els));
      }
      return;
    }
    if (tool === 'erase') {
      let found = -1;
      els.forEach((el, i) => {
        if (el.tool === 'circle') {
          if (distCircle(x, y, el.cx, el.cy, el.r || 0) < 12) found = i;
        } else if (el.tool === 'column') {
          if (el.columnShape === 'rect') {
            const hw = Math.max((el.columnWidth || 30) / 100 / scale * GRID, 6) / 2 + 6;
            const hl = Math.max((el.columnLength || 30) / 100 / scale * GRID, 6) / 2 + 6;
            if (Math.abs(x - el.x1) < hw && Math.abs(y - el.y1) < hl) found = i;
          } else {
            if (Math.hypot(x - el.x1, y - el.y1) < 15) found = i;
          }
        } else if (distSeg(x, y, el.x1, el.y1, el.x2, el.y2) < 12) found = i;
      });
      if (found >= 0) setEls(p => p.filter((_, i) => i !== found));
      setSelIdx(-1);
      return;
    }
    if (tool === 'column') {
      const defs = getDefaults('column');
      const newEl = { tool: 'column', x1: x, y1: y, x2: x, y2: y, _type: 'column', floor: currentFloor, ...defs, columnShape: colShape };
      setEls(p => [...p, newEl]);
      return;
    }
    if (tool === 'circle') {
      setDraft({ tool: 'circle', cx: x, cy: y, r: 0, floor: currentFloor });
      return;
    }
    setDraft({ tool, x1: x, y1: y, x2: x, y2: y, floor: currentFloor });
  }, [tool, els, currentFloor, selIdx, colShape, scale, calcDistances]);

  const onMove = useCallback((x, y, mods = {}) => {
    // Dragging element in select mode
    if (dragInfo) {
      let dx = x - dragInfo.startX, dy = y - dragInfo.startY;
      const orig = dragInfo.origEl;
      const mode = dragInfo.mode || 'whole';

      // Shift: orthogonal constraint
      if (mods.shift) {
        if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0;
      }
      // Ctrl: precision snap (0.1m steps)
      if (mods.ctrl) {
        const step = GRID * 0.1 / scale;
        if (step > 0) { dx = Math.round(dx / step) * step; dy = Math.round(dy / step) * step; }
      }

      setEls(p => p.map((e, j) => {
        if (j !== dragInfo.idx) return e;

        // Endpoint P1 only
        if (mode === 'p1') {
          return { ...e, x1: orig.x1 + dx, y1: orig.y1 + dy };
        }
        // Endpoint P2 only
        if (mode === 'p2') {
          return { ...e, x2: (orig.x2 || orig.x1) + dx, y2: (orig.y2 || orig.y1) + dy };
        }
        // Rotation around center
        if (mode === 'rotate') {
          const cx = (orig.x1 + (orig.x2 || orig.x1)) / 2;
          const cy = (orig.y1 + (orig.y2 || orig.y1)) / 2;
          const origAngle = Math.atan2(dragInfo.startY - cy, dragInfo.startX - cx);
          const newAngle = Math.atan2(y - cy, x - cx);
          const da = newAngle - origAngle;
          const cos = Math.cos(da), sin = Math.sin(da);
          const rp = (px, py) => ({ x: cx + (px - cx) * cos - (py - cy) * sin, y: cy + (px - cx) * sin + (py - cy) * cos });
          const np1 = rp(orig.x1, orig.y1), np2 = rp(orig.x2 || orig.x1, orig.y2 || orig.y1);
          return { ...e, x1: np1.x, y1: np1.y, x2: np2.x, y2: np2.y };
        }

        // Whole element
        if (e.tool === 'circle') return { ...e, cx: orig.cx + dx, cy: orig.cy + dy };
        if (e.tool === 'column') return { ...e, x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x1 + dx, y2: orig.y1 + dy };
        return { ...e, x1: orig.x1 + dx, y1: orig.y1 + dy, x2: (orig.x2 || orig.x1) + dx, y2: (orig.y2 || orig.y1) + dy };
      }));

      // Recalc distances
      const movedEl = { ...orig };
      if (mode === 'p1') { movedEl.x1 += dx; movedEl.y1 += dy; }
      else if (mode === 'p2') { movedEl.x2 = (movedEl.x2 || movedEl.x1) + dx; movedEl.y2 = (movedEl.y2 || movedEl.y1) + dy; }
      else if (mode !== 'rotate') {
        if (movedEl.tool === 'circle') { movedEl.cx += dx; movedEl.cy += dy; }
        else { movedEl.x1 += dx; movedEl.y1 += dy; movedEl.x2 = (movedEl.x2 || movedEl.x1) + dx; movedEl.y2 = (movedEl.y2 || movedEl.y1) + dy; }
      }
      setDistLines(calcDistances(movedEl, els));
      return;
    }
    if (!draft) return;
    if (draft.tool === 'circle') {
      setDraft(p => ({ ...p, r: Math.hypot(x - p.cx, y - p.cy) }));
    } else {
      let nx = x, ny = y;
      if (mods.shift) {
        if (Math.abs(x - draft.x1) > Math.abs(y - draft.y1)) ny = draft.y1; else nx = draft.x1;
      }
      setDraft(p => ({ ...p, x2: nx, y2: ny }));
    }
  }, [draft, dragInfo, els, calcDistances, scale]);

  const onUp = useCallback(() => {
    if (dragInfo) {
      setEls(cur => { saveSnapshot(cur); return cur; });
      setDragInfo(null); setDistLines([]); return;
    }
    if (!draft) return;
    if (draft.tool === 'circle') {
      if ((draft.r || 0) > 5) {
        const newEl = { ...draft, _type: 'circle', ...getDefaults('circle') };
        setEls(p => { const next = [...p, newEl]; saveSnapshot(next); setSelIdx(next.length - 1); return next; });
      }
    } else {
      const len = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
      if (len > 10) {
        const newEl = { ...draft, _type: autoType(draft), ...getDefaults(draft.tool) };
        setEls(p => { const next = [...p, newEl]; saveSnapshot(next); setSelIdx(next.length - 1); return next; });
      }
    }
    setDraft(null);
  }, [draft, dragInfo, saveSnapshot]);

  const updateEl = useCallback((i, f, v) => setEls(p => p.map((e, j) => j === i ? { ...e, [f]: v } : e)), []);

  // Parametric dimension update: change length keeps angle, recalcs x2/y2
  const updateDimension = useCallback((i, dim, val) => {
    setEls(p => p.map((e, j) => {
      if (j !== i) return e;
      const el = { ...e };
      if (dim === 'length') {
        const canvasDist = val * GRID / scale;
        const angle = Math.atan2((el.y2 || 0) - (el.y1 || 0), (el.x2 || 0) - (el.x1 || 0));
        el.x2 = el.x1 + Math.cos(angle) * canvasDist;
        el.y2 = el.y1 + Math.sin(angle) * canvasDist;
      } else if (dim === 'width') {
        if (el.tool === 'rect' || el._type === 'slab') {
          const canvasDist = val * GRID / scale;
          el.x2 = el.x1 + canvasDist;
        }
      } else if (dim === 'depth') {
        if (el.tool === 'rect' || el._type === 'slab') {
          const canvasDist = val * GRID / scale;
          el.y2 = el.y1 + canvasDist;
        }
      }
      return el;
    }));
  }, [scale]);

  const deleteEl = (i) => { setEls(p => { const next = p.filter((_, j) => j !== i); saveSnapshot(next); return next; }); setSelIdx(-1); };

  const addManual = (type) => {
    const toolType = ['slab'].includes(type) ? 'rect' : ['circle'].includes(type) ? 'circle' : type;
    if (type === 'circle') {
      const newEl = { tool: 'circle', cx: 400, cy: 300, r: 60, _type: 'circle', floor: currentFloor, ...getDefaults('circle') };
      setEls(p => [...p, newEl]);
      return;
    }
    if (type === 'column') {
      const newEl = { tool: 'column', x1: 300, y1: 300, x2: 300, y2: 300, _type: 'column', floor: currentFloor, ...getDefaults('column'), columnShape: colShape };
      setEls(p => [...p, newEl]);
      return;
    }
    const x2 = type === 'slab' ? 300 : type === 'door' ? 140 : type === 'window' ? 160 : 400;
    const y2 = type === 'slab' ? 300 : type === 'stairs' ? 350 : 200;
    const newEl = { tool: toolType, x1: 100, y1: 200, x2, y2, _type: type, floor: currentFloor, ...getDefaults(type) };
    setEls(p => [...p, newEl]);
  };

  const reset = () => {
    setEls([]); setSelIdx(-1); setDraft(null); setUploadRes(null);
    setSketches([null, null, null]); setPreviews([null, null, null]); setNotes('');
  };

  // Upload handlers
  const handleUpload = useCallback((idx, e) => {
    const f = e.target.files?.[0];
    if (!f || f.size > 15e6) return;
    const r = new FileReader();
    r.onload = ev => {
      setSketches(p => { const n = [...p]; n[idx] = ev.target.result; return n; });
      setPreviews(p => { const n = [...p]; n[idx] = ev.target.result; return n; });
    };
    r.readAsDataURL(f);
  }, []);

  const handleAnalyze = async () => {
    const v = sketches.filter(Boolean);
    if (!v.length) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/ai-sketch/analyze`, { sketches: v, building_type: 'residential', notes }, { timeout: 300000 });
      setUploadRes(res.data);
      toast.success('3D модел генериран!');
    } catch (err) { toast.error(err.response?.data?.detail || 'Грешка'); }
    setLoading(false);
  };

  const downloadGlb = () => {
    if (!uploadRes?.glb_base64) return;
    const b = atob(uploadRes.glb_base64), u8 = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: 'model/gltf-binary' }));
    const a = document.createElement('a'); a.href = url; a.download = `temadom-${uploadRes.id || 'model'}.glb`; a.click(); URL.revokeObjectURL(url);
  };

  const downloadAsImage = useCallback(() => {
    const canvasEl = document.querySelector('[data-testid="cad-canvas"]');
    if (!canvasEl) { toast.error('Няма чертеж за сваляне'); return; }
    try {
      const dataUrl = canvasEl.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `temadom-plan-${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Изображението е свалено!');
    } catch (err) {
      toast.error('Грешка при сваляне на изображение');
    }
  }, []);

  const shareProject = () => {
    if (!uploadRes?.id) return;
    navigator.clipboard.writeText(`${window.location.origin}/ai-sketch?id=${uploadRes.id}`).then(() => toast.success('Линк копиран!'));
  };

  // PDF Export: Plan + Cost Estimate
  const exportPlanPdf = async () => {
    const costs = calculateCosts(els, scale, region);
    const regionObj = REGIONS.find(r => r.id === region) || REGIONS[1];
    try {
      const res = await axios.post(`${API}/ai-sketch/export-pdf`, {
        elements: els, scale, costs, region_name: regionObj.name
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = 'temadom-plan.pdf'; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF план изтеглен!');
    } catch { toast.error('Грешка при генериране на PDF'); }
  };

  // PDF Export: Contract
  const [showContract, setShowContract] = useState(false);
  const [contractData, setContractData] = useState({
    company_name: '', company_bulstat: '', client_name: '', client_egn: '', address: '', description: '',
    deadline_days: '', payment_terms: '30% аванс, 40% при 50% готовност, 30% при приемане',
    warranty_years: '5'
  });

  const exportContract = async () => {
    const costs = calculateCosts(els, scale, region);
    try {
      const res = await axios.post(`${API}/ai-sketch/export-contract`, {
        ...contractData,
        total_eur: costs.totalEur,
        total_bgn: costs.totalBgn,
        description: contractData.description || 'Изпълнение на строително-монтажни работи съгласно приложена количествена сметка.'
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = 'temadom-contract.pdf'; a.click();
      URL.revokeObjectURL(url);
      setShowContract(false);
      toast.success('Договор изтеглен!');
    } catch { toast.error('Грешка при генериране на договор'); }
  };

  return (
    <div className="min-h-screen  py-3 px-2 md:px-4" data-testid="ai-sketch-page">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">IA CAD v5.2</h1>
            <p className="theme-text-subtle text-[10px]">Handles: Drag Край/Център/Ротация | Shift: Орт | Ctrl+Z/Y</p>
          </div>
          <div className="flex gap-2" data-testid="mode-tabs">
            <button onClick={() => { setMode('draw'); setUploadRes(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'draw' ? 'bg-[#FF8C42] text-white' : ' theme-text-muted border '}`}
              data-testid="mode-draw">CAD</button>
            <button onClick={() => setMode('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'upload' ? 'bg-[#FF8C42] text-white' : ' theme-text-muted border '}`}
              data-testid="mode-upload"><Upload className="h-3.5 w-3.5 inline mr-1" />Качи</button>
          </div>
        </div>

        {/* ===== DRAW MODE ===== */}
        {mode === 'draw' && (
          <>
            {/* Toolbar */}
            <Card className="  mb-3">
              <CardContent className="py-2 px-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1" data-testid="cad-toolbar">
                    {TOOLS.map(t => {
                      const I = ICON_MAP[t.id];
                      return (
                        <button key={t.id} onClick={() => setTool(t.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                            tool === t.id ? 'bg-[#FF8C42] text-white shadow-lg shadow-[#FF8C42]/20' : ' theme-text-muted hover:text-white hover:bg-[#2A3A4C]'
                          }`} data-testid={`tool-${t.id}`}>
                          {I && <I className="h-3 w-3" />}<span className="hidden sm:inline">{t.label}</span>
                        </button>
                      );
                    })}
                    {tool === 'column' && (
                      <div className="flex items-center gap-1 ml-1 pl-2 border-l ">
                        <button onClick={() => setColShape('round')}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${colShape === 'round' ? 'bg-[#9b59b6] text-white' : ' theme-text-muted'}`}
                          data-testid="col-shape-round" title="Кръгла колона">O</button>
                        <button onClick={() => setColShape('rect')}
                          className={`px-2 py-1 rounded text-[10px] font-bold ${colShape === 'rect' ? 'bg-[#9b59b6] text-white' : ' theme-text-muted'}`}
                          data-testid="col-shape-rect" title="Правоъгълна колона">&#9645;</button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={undo} className="px-2 py-1 rounded text-[10px] font-medium  theme-text-muted hover:text-white hover:bg-[#2A3A4C]" data-testid="undo-btn" title="Ctrl+Z">&#8630;</button>
                    <button onClick={redo} className="px-2 py-1 rounded text-[10px] font-medium  theme-text-muted hover:text-white hover:bg-[#2A3A4C]" data-testid="redo-btn" title="Ctrl+Y">&#8631;</button>
                    <div className="flex items-center gap-1.5">
                      <span className="theme-text-subtle text-[10px]">Ет:</span>
                      <button onClick={() => setCurrentFloor(p => Math.max(0, p - 1))} className="theme-text-muted hover:text-white text-xs px-1  rounded">-</button>
                      <span className="text-white text-xs font-bold w-4 text-center" data-testid="floor-indicator">{currentFloor}</span>
                      <button onClick={() => setCurrentFloor(p => p + 1)} className="theme-text-muted hover:text-white text-xs px-1  rounded" data-testid="floor-up-btn">+</button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="theme-text-subtle text-[10px]">м/кв:</span>
                      <Input type="number" value={scale} min={0.1} step={0.1}
                        onChange={e => setScale(Math.max(0.1, +e.target.value || 1))}
                        className="w-14 h-6 text-[10px]   text-white px-1" data-testid="scale-input" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Canvas + 3D side by side */}
            <div className="grid lg:grid-cols-[1fr_1fr] gap-3 mb-3">
              <Card className=" ">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-[#FF8C42]" /> 2D Чертеж
                    <Badge className="bg-[#28A745]/15 text-[#28A745] text-[9px] ml-auto">Ет. {currentFloor}</Badge>
                    {objCount > 0 && <Badge className="bg-[#FF8C42]/15 text-[#FF8C42] text-[9px]">{objCount} обекта</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <CADCanvas els={els} selIdx={selIdx} tool={tool} scale={scale} draft={draft}
                    distLines={distLines} dragInfo={dragInfo}
                    onDown={onDown} onMove={onMove} onUp={onUp}
                    onDoubleClick={(x, y) => {
                      for (let i = els.length - 1; i >= 0; i--) {
                        const el = els[i];
                        if (el.tool === 'circle') { if (distCircle(x, y, el.cx, el.cy, el.r || 0) < 15) { setSelIdx(i); return; } }
                        else if (el.tool === 'column') { if (Math.hypot(x - el.x1, y - el.y1) < 15) { setSelIdx(i); return; } }
                        else if (distSeg(x, y, el.x1, el.y1, el.x2 || el.x1, el.y2 || el.y1) < 15) { setSelIdx(i); return; }
                      }
                    }} />
                </CardContent>
              </Card>

              <Card className=" ">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#4DA6FF]" /> 360° Live Preview
                    {objCount > 0 && <Badge className="bg-[#28A745]/15 text-[#28A745] text-[9px] ml-auto">{objCount}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div ref={viewerRef} className="w-full h-[350px] lg:h-[420px]  rounded-lg overflow-hidden border " data-testid="3d-viewer" />
                  <p className="text-slate-600 text-[9px] mt-1 text-center">Ляв бутон: Въртене | Десен бутон: Местене | Скрол: Zoom</p>
                </CardContent>
              </Card>
            </div>

            {/* Structure Panel */}
            <Card className="  mb-3">
              <CardContent className="px-3 py-3">
                <StructurePanel els={els} selIdx={selIdx} scale={scale}
                  onSelect={setSelIdx} onDelete={deleteEl} onUpdate={updateEl}
                  onUpdateDimension={updateDimension}
                  onAddManual={addManual} onClear={reset} />
              </CardContent>
            </Card>

            {/* Cost Estimate */}
            {objCount > 0 && (
              <Card className="  mb-3">
                <CardContent className="px-3 py-3">
                  <CostEstimate els={els} scale={scale} region={region} onRegionChange={setRegion} />
                </CardContent>
              </Card>
            )}

            {/* Export Buttons — always visible */}
            <Card className="  mb-3">
              <CardContent className="px-3 py-3 space-y-2">
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-[#FF8C42] hover:bg-[#e67a30] text-white text-xs h-10 font-bold"
                    onClick={exportPlanPdf} data-testid="export-plan-pdf">
                    <FileText className="mr-1.5 h-4 w-4" /> PDF План + Сметка
                  </Button>
                  <Button size="sm" className="flex-1 bg-[#4DA6FF] hover:bg-[#3B8FE0] text-white text-xs h-10 font-bold"
                    onClick={() => setShowContract(true)} data-testid="export-contract-btn">
                    <FileText className="mr-1.5 h-4 w-4" /> PDF Договор
                  </Button>
                </div>
                <Button size="sm" className="w-full bg-[#28A745] hover:bg-[#22943e] text-white text-xs h-10 font-bold"
                  onClick={downloadAsImage} data-testid="download-cad-image">
                  <Download className="mr-1.5 h-4 w-4" /> Свали като изображение (PNG)
                </Button>
              </CardContent>
            </Card>

            {/* Contract Dialog */}
            {showContract && (
              <Card className=" border-[#FF8C42]/30 mb-3">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-white text-sm flex items-center justify-between">
                    <span>Договор за строителство</span>
                    <button onClick={() => setShowContract(false)} className="theme-text-subtle hover:text-white"><X className="h-4 w-4" /></button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[9px] theme-text-subtle block mb-0.5">Изпълнител (фирма)</label>
                      <Input value={contractData.company_name} onChange={e => setContractData(p => ({ ...p, company_name: e.target.value }))}
                        placeholder="Име на фирма" className="h-7 text-xs" data-testid="contract-company" />
                    </div>
                    <div>
                      <label className="text-[9px] theme-text-subtle block mb-0.5">БУЛСТАТ</label>
                      <Input value={contractData.company_bulstat} onChange={e => setContractData(p => ({ ...p, company_bulstat: e.target.value }))}
                        placeholder="БУЛСТАТ" className="h-7 text-xs" data-testid="contract-bulstat" />
                    </div>
                    <div>
                      <label className="text-[9px] theme-text-subtle block mb-0.5">Възложител (клиент)</label>
                      <Input value={contractData.client_name} onChange={e => setContractData(p => ({ ...p, client_name: e.target.value }))}
                        placeholder="Име на клиент" className="h-7 text-xs" data-testid="contract-client" />
                    </div>
                    <div>
                      <label className="text-[9px] theme-text-subtle block mb-0.5">ЕГН/БУЛСТАТ</label>
                      <Input value={contractData.client_egn} onChange={e => setContractData(p => ({ ...p, client_egn: e.target.value }))}
                        placeholder="ЕГН/БУЛСТАТ" className="h-7 text-xs" data-testid="contract-egn" />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="text-[9px] theme-text-subtle block mb-0.5">Адрес на обекта</label>
                    <Input value={contractData.address} onChange={e => setContractData(p => ({ ...p, address: e.target.value }))}
                      placeholder="Адрес на обекта" className="h-7 text-xs" data-testid="contract-address" />
                  </div>
                  <div className="mb-2">
                    <label className="text-[9px] theme-text-subtle block mb-0.5">Описание на работите</label>
                    <textarea value={contractData.description} onChange={e => setContractData(p => ({ ...p, description: e.target.value }))}
                      placeholder="Опишете дейностите по договора..."
                      className="w-full h-14 text-xs rounded-md border px-2 py-1 resize-none" style={{ background: 'var(--theme-bg-surface)', borderColor: 'var(--theme-border)', color: 'var(--theme-text)' }}
                      data-testid="contract-description" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="text-[9px] theme-text-subtle block mb-0.5">Срок (работни дни)</label>
                      <Input value={contractData.deadline_days} onChange={e => setContractData(p => ({ ...p, deadline_days: e.target.value }))}
                        placeholder="напр. 30" className="h-7 text-xs" data-testid="contract-deadline" />
                    </div>
                    <div>
                      <label className="text-[9px] theme-text-subtle block mb-0.5">Гаранция (години)</label>
                      <Input value={contractData.warranty_years} onChange={e => setContractData(p => ({ ...p, warranty_years: e.target.value }))}
                        placeholder="5" className="h-7 text-xs" data-testid="contract-warranty" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="text-[9px] theme-text-subtle block mb-0.5">Условия за плащане</label>
                    <Input value={contractData.payment_terms} onChange={e => setContractData(p => ({ ...p, payment_terms: e.target.value }))}
                      placeholder="30% аванс, 40% при 50% готовност, 30% при приемане" className="h-7 text-xs" data-testid="contract-payment" />
                  </div>
                  <Button className="w-full bg-[#4DA6FF] hover:bg-[#3B8FE0] text-white h-8 text-xs"
                    onClick={exportContract} data-testid="generate-contract-pdf">
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Генерирай PDF договор
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ===== UPLOAD MODE ===== */}
        {mode === 'upload' && (
          <div className="space-y-4">
            {!uploadRes ? (
              <>
                <Card className=" ">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map(idx => (
                        <div key={idx}>
                          <input ref={fileRefs[idx]} type="file" accept="image/*" className="hidden"
                            onChange={e => handleUpload(idx, e)} data-testid={`sketch-upload-${idx}`} />
                          {previews[idx] ? (
                            <div className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border-2 border-[#FF8C42]/30">
                                <img src={previews[idx]} alt="" className="w-full h-full object-cover" /></div>
                              <button onClick={() => { setSketches(p => { const n = [...p]; n[idx] = null; return n; }); setPreviews(p => { const n = [...p]; n[idx] = null; return n; }); }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                            </div>
                          ) : (
                            <button onClick={() => fileRefs[idx].current?.click()}
                              className="aspect-square w-full rounded-lg border-2 border-dashed  hover:border-[#FF8C42]/50 flex flex-col items-center justify-center gap-1 /50"
                              data-testid={`sketch-upload-btn-${idx}`}><Upload className="h-5 w-5 theme-text-subtle" /><span className="theme-text-subtle text-[10px]">{idx + 1}</span></button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Бележки..."
                      className="  text-white min-h-[60px] text-sm mt-3" data-testid="sketch-notes" />
                  </CardContent>
                </Card>
                <Button className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white h-11" onClick={handleAnalyze}
                  disabled={!sketches.filter(Boolean).length || loading} data-testid="analyze-btn">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />CV анализира...</> : <><Ruler className="mr-2 h-4 w-4" />Генерирай 3D</>}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <Card className=" ">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-[#4DA6FF]" />360 3D</CardTitle>
                      <div className="flex gap-2">
                        {uploadRes.glb_base64 && <Button size="sm" onClick={downloadGlb} className="bg-[#28A745] text-white h-7 text-xs" data-testid="download-glb-btn"><Download className="mr-1 h-3 w-3" />.glb</Button>}
                        {uploadRes.id && <Button size="sm" onClick={shareProject} className="bg-[#4DA6FF] text-white h-7 text-xs" data-testid="share-project-btn"><Share2 className="mr-1 h-3 w-3" />Сподели</Button>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div ref={glbViewerRef} className="w-full h-[400px]  rounded-lg overflow-hidden border " data-testid="3d-viewer" />
                  </CardContent>
                </Card>
                {uploadRes.summary && (
                  <Card className=" ">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-4 gap-3">
                        {[{ v: uploadRes.summary.walls_detected, l: 'Стени', c: '#FF8C42' }, { v: uploadRes.summary.stairs_detected, l: 'Стълби', c: '#4DA6FF' }, { v: uploadRes.summary.dimensions_found, l: 'OCR', c: '#28A745' }, { v: uploadRes.summary.floor_area_sqm || '-', l: 'м2', c: '#8C56FF' }].map((s, i) => (
                          <div key={i} className=" rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p><p className="theme-text-subtle text-[9px]">{s.l}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                <div className="flex justify-center"><Button className="bg-[#FF8C42] text-white" onClick={reset} data-testid="new-sketch-btn"><RotateCcw className="mr-2 h-4 w-4" />Нов проект</Button></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AISketchPage;
