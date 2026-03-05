import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Upload, Loader2, X, Download, Ruler, Building2, RotateCcw, Eye, Share2,
  Pencil, Square, ArrowUpRight, Eraser, MousePointer, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useSearchParams } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ===================== CONSTANTS =====================
const GRID = 20, CW = 800, CH = 500;
const TOOLS = [
  { id: 'select', label: 'Избери', icon: MousePointer },
  { id: 'wall',   label: 'Стена',  icon: Square },
  { id: 'line',   label: 'Линия',  icon: Pencil },
  { id: 'rect',   label: 'Правоъгълник', icon: Square },
  { id: 'stairs', label: 'Стълби', icon: ArrowUpRight },
  { id: 'dimension', label: 'Размер', icon: Ruler },
  { id: 'erase',  label: 'Изтрий', icon: Eraser },
];
const OBJ_COLORS = { wall: '#90cdf4', line: '#a0aec0', rect: '#68d391', stairs: '#ffa500', dimension: '#8C56FF' };

// ===================== SNAP =====================
function snap(v) { return Math.round(v / GRID) * GRID; }
function snapEndpoint(x, y, els) {
  let best = null, bd = 12;
  for (const e of els) for (const p of [{ x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 }]) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bd) { bd = d; best = p; }
  }
  return best ? [best.x, best.y] : [snap(x), snap(y)];
}
function distSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, sq = dx * dx + dy * dy;
  if (!sq) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / sq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// ===================== CLASSIFY =====================
function autoType(el) {
  if (el.tool === 'stairs') return 'stairs';
  if (el.tool === 'rect') return 'slab';
  return 'wall';
}
function smartHint(el, sc) {
  if (el.tool === 'stairs') return null;
  if (el.tool === 'rect') {
    const w = Math.abs(el.x2 - el.x1) / GRID * sc, h = Math.abs(el.y2 - el.y1) / GRID * sc;
    if (Math.min(w, h) < 0.4) return `Тесен (${w.toFixed(1)}x${h.toFixed(1)}м) — стена?`;
    return null;
  }
  const lenM = Math.hypot(el.x2 - el.x1, el.y2 - el.y1) / GRID * sc;
  const ang = Math.abs(Math.atan2(el.y2 - el.y1, el.x2 - el.x1) * 180 / Math.PI);
  if (ang > 25 && ang < 65 && lenM > 1.5) return `Диагонална (${lenM.toFixed(1)}м) — стълбище?`;
  return null;
}

// ===================== BUILD 3D =====================
function buildScene(scene, els, sc, selIdx) {
  // Remove old objects (keep lights & ground)
  const toRemove = [];
  scene.traverse(c => { if (c.userData.isObj) toRemove.push(c); });
  toRemove.forEach(c => { c.geometry?.dispose(); c.material?.dispose(); scene.remove(c); });

  els.forEach((el, i) => {
    if (el.tool === 'dimension') return;
    const t = el._type || autoType(el);
    if (t === 'ignore') return;
    const lenPx = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
    const lenM = lenPx / GRID * sc;
    if (lenM < 0.1) return;
    const isSel = i === selIdx;

    if (t === 'wall') {
      const h = el.height ?? 3, th = (el.thickness ?? 30) / 100;
      const sx = el.x1 / GRID * sc, sz = el.y1 / GRID * sc;
      const ex = el.x2 / GRID * sc, ez = el.y2 / GRID * sc;
      const cx = (sx + ex) / 2, cz = (sz + ez) / 2;
      const dx = ex - sx, dz = ez - sz;
      const ang = Math.atan2(dz, dx);
      const actualLen = Math.sqrt(dx * dx + dz * dz) || lenM;
      const geo = new THREE.BoxGeometry(actualLen, h, th);
      const mat = new THREE.MeshStandardMaterial({ color: isSel ? 0xFF8C42 : 0xd4d4d4, roughness: 0.7 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cx, h / 2, cz);
      mesh.rotation.y = -ang;
      mesh.userData.isObj = true;
      scene.add(mesh);
      // Edge highlight
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isSel ? 0xFF8C42 : 0x555555 }));
      line.position.copy(mesh.position); line.rotation.copy(mesh.rotation);
      line.userData.isObj = true;
      scene.add(line);
    } else if (t === 'stairs') {
      const steps = el.steps ?? 8, rise = el.rise ?? 0.17, run = el.run ?? 0.30, w = el.stairWidth ?? 1.2;
      const sx = el.x1 / GRID * sc, sz = el.y1 / GRID * sc;
      for (let s = 0; s < steps; s++) {
        const geo = new THREE.BoxGeometry(run * 0.95, rise, w);
        const mat = new THREE.MeshStandardMaterial({ color: isSel ? 0xFF8C42 : 0xb8a080, roughness: 0.6 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(sx + s * run + run / 2, (s + 0.5) * rise, sz);
        mesh.userData.isObj = true;
        scene.add(mesh);
      }
    } else if (t === 'slab') {
      const x1 = Math.min(el.x1, el.x2) / GRID * sc, z1 = Math.min(el.y1, el.y2) / GRID * sc;
      const w = Math.abs(el.x2 - el.x1) / GRID * sc, d = Math.abs(el.y2 - el.y1) / GRID * sc;
      const th = (el.slabThickness ?? 15) / 100;
      if (w < 0.1 || d < 0.1) return;
      const geo = new THREE.BoxGeometry(w, th, d);
      const mat = new THREE.MeshStandardMaterial({ color: isSel ? 0xFF8C42 : 0xc0c0c0, roughness: 0.8 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x1 + w / 2, -th / 2, z1 + d / 2);
      mesh.userData.isObj = true;
      scene.add(mesh);
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isSel ? 0xFF8C42 : 0x555555 }));
      line.position.copy(mesh.position);
      line.userData.isObj = true;
      scene.add(line);
    }
  });
}

// ===================== THREE.JS VIEWER HOOK =====================
function useThreeViewer(containerRef, els, scale, selIdx) {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth, h = container.clientHeight;

    // Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0F1923);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(12, 10, 12);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.9);
    dir1.position.set(10, 20, 10);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-5, 8, -5);
    scene.add(dir2);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: 0x1a2332 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    scene.add(ground);

    // Ground grid
    const gridHelper = new THREE.GridHelper(60, 60, 0x253545, 0x1e2e3f);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Animation loop
    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [containerRef]);

  // Update scene when elements change
  useEffect(() => {
    if (sceneRef.current) buildScene(sceneRef.current, els, scale, selIdx);
  }, [els, scale, selIdx]);

  return { sceneRef, rendererRef, cameraRef };
}

// ===================== GLB LOADER =====================
function useGlbViewer(containerRef, glbBase64) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !glbBase64) return;
    const w = container.clientWidth, h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0F1923);
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(15, 12, 15);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dl = new THREE.DirectionalLight(0xffffff, 0.8);
    dl.position.set(10, 20, 10);
    scene.add(dl);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x1a2332 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02;
    scene.add(ground);
    scene.add(new THREE.GridHelper(50, 50, 0x253545, 0x1e2e3f));

    // Load GLB
    const b = atob(glbBase64), u8 = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u8[i] = b.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: 'model/gltf-binary' }));
    new GLTFLoader().load(url, gltf => { scene.add(gltf.scene); URL.revokeObjectURL(url); });

    let raf;
    const animate = () => { raf = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      controls.dispose(); renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [containerRef, glbBase64]);
}

// ===================== CANVAS RENDER =====================
function renderCAD(ctx, els, draft, selIdx, sc) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#141e2b'; ctx.fillRect(0, 0, w, h);
  // Minor grid
  ctx.strokeStyle = '#1e2e3f'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // Major grid
  ctx.strokeStyle = '#253545'; ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += GRID * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += GRID * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  els.forEach((el, i) => {
    const sel = i === selIdx;
    const col = sel ? '#FF8C42' : OBJ_COLORS[el.tool] || '#888';
    ctx.strokeStyle = col;
    if (el.tool === 'wall' || el.tool === 'line') {
      ctx.lineWidth = el.tool === 'wall' ? 6 : 2;
      ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
    } else if (el.tool === 'rect') {
      ctx.lineWidth = 3;
      ctx.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
    } else if (el.tool === 'stairs') {
      const st = el.steps || 8, dx = (el.x2 - el.x1) / st, dy = (el.y2 - el.y1) / st;
      ctx.lineWidth = 2;
      for (let s = 0; s <= st; s++) { const px = el.x1 + dx * s, py = el.y1 + dy * s; ctx.beginPath(); ctx.moveTo(px - 12, py); ctx.lineTo(px + 12, py); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
    } else if (el.tool === 'dimension') {
      ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
      ctx.setLineDash([]);
    }
    const len = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
    if (len > 15) {
      const m = (len / GRID * sc).toFixed(el.tool === 'dimension' ? 2 : 1);
      ctx.fillStyle = col; ctx.font = `${el.tool === 'dimension' ? 'bold 12' : '11'}px monospace`;
      ctx.fillText(`${m}м`, (el.x1 + el.x2) / 2 + 6, (el.y1 + el.y2) / 2 - 6);
    }
    if (sel) {
      ctx.fillStyle = '#FF8C42';
      for (const p of [{ x: el.x1, y: el.y1 }, { x: el.x2, y: el.y2 }]) { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill(); }
    }
  });
  if (draft) {
    ctx.strokeStyle = '#FF8C42'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
    if (draft.tool === 'rect') ctx.strokeRect(draft.x1, draft.y1, draft.x2 - draft.x1, draft.y2 - draft.y1);
    else { ctx.beginPath(); ctx.moveTo(draft.x1, draft.y1); ctx.lineTo(draft.x2, draft.y2); ctx.stroke(); }
    ctx.setLineDash([]);
    const dl = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
    if (dl > 10) { ctx.fillStyle = '#FF8C42'; ctx.font = 'bold 12px monospace'; ctx.fillText(`${(dl / GRID * sc).toFixed(1)}м`, (draft.x1 + draft.x2) / 2 + 8, (draft.y1 + draft.y2) / 2 - 8); }
  }
}

// ===================== MAIN COMPONENT =====================
export const AISketchPage = () => {
  const [mode, setMode] = useState('draw');
  const [scale, setScale] = useState(1);

  // CAD state
  const [els, setEls] = useState([]);
  const [selIdx, setSelIdx] = useState(-1);
  const [tool, setTool] = useState('wall');
  const [draft, setDraft] = useState(null);
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);

  // Upload state
  const [sketches, setSketches] = useState([null, null, null]);
  const [previews, setPreviews] = useState([null, null, null]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadRes, setUploadRes] = useState(null);
  const [searchParams] = useSearchParams();
  const fileRefs = [useRef(null), useRef(null), useRef(null)];
  const glbViewerRef = useRef(null);

  // Shared project load
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) { setMode('upload'); axios.get(`${API}/ai-sketch/${id}`).then(r => setUploadRes(r.data)).catch(() => toast.error('Не е намерен')); }
  }, [searchParams]);

  // Live 3D preview
  useThreeViewer(viewerRef, els, scale, selIdx);
  useGlbViewer(glbViewerRef, uploadRes?.glb_base64);

  // Objects count
  const objCount = useMemo(() => els.filter(e => e.tool !== 'dimension' && (e._type || autoType(e)) !== 'ignore').length, [els]);

  // CAD canvas rendering
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let raf;
    const frame = () => { renderCAD(ctx, els, draft, selIdx, scale); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [els, draft, selIdx, scale]);

  // Canvas mouse handlers
  const getPos = useCallback((e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return snapEndpoint((e.clientX - r.left) * (CW / r.width), (e.clientY - r.top) * (CH / r.height), els);
  }, [els]);

  const onDown = useCallback((e) => {
    const [x, y] = getPos(e);
    if (tool === 'select') {
      let found = -1;
      els.forEach((el, i) => { if (distSeg(x, y, el.x1, el.y1, el.x2, el.y2) < 12) found = i; });
      setSelIdx(found);
      return;
    }
    if (tool === 'erase') {
      let found = -1;
      els.forEach((el, i) => { if (distSeg(x, y, el.x1, el.y1, el.x2, el.y2) < 12) found = i; });
      if (found >= 0) setEls(p => p.filter((_, i) => i !== found));
      setSelIdx(-1);
      return;
    }
    setDraft({ tool, x1: x, y1: y, x2: x, y2: y });
  }, [tool, els, getPos]);

  const onMove = useCallback((e) => {
    if (!draft) return;
    const [x, y] = getPos(e);
    setDraft(p => ({ ...p, x2: x, y2: y }));
  }, [draft, getPos]);

  const onUp = useCallback(() => {
    if (!draft) return;
    const len = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
    if (len > 10) {
      const newEl = { ...draft, _type: autoType(draft) };
      if (draft.tool === 'stairs') Object.assign(newEl, { steps: 8, rise: 0.17, run: 0.30, stairWidth: 1.2 });
      setEls(p => [...p, newEl]);
    }
    setDraft(null);
  }, [draft]);

  const updateEl = (i, f, v) => setEls(p => p.map((e, j) => j === i ? { ...e, [f]: v } : e));
  const deleteEl = (i) => { setEls(p => p.filter((_, j) => j !== i)); setSelIdx(-1); };
  const addManual = (type) => {
    const t = type === 'stairs' ? 'stairs' : type === 'slab' ? 'rect' : 'wall';
    const x2 = type === 'slab' ? 300 : 400, y2 = type === 'slab' ? 300 : type === 'stairs' ? 350 : 200;
    const newEl = { tool: t, x1: 100, y1: 200, x2, y2, _type: type };
    if (type === 'stairs') Object.assign(newEl, { steps: 8, rise: 0.17, run: 0.30, stairWidth: 1.2 });
    setEls(p => [...p, newEl]);
  };

  // Upload
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

  const shareProject = () => {
    if (!uploadRes?.id) return;
    navigator.clipboard.writeText(`${window.location.origin}/ai-sketch?id=${uploadRes.id}`).then(() => toast.success('Линк копиран!'));
  };

  const reset = () => {
    setEls([]); setSelIdx(-1); setDraft(null); setUploadRes(null);
    setSketches([null, null, null]); setPreviews([null, null, null]); setNotes('');
  };

  return (
    <div className="min-h-screen bg-[#1E2A38] py-4" data-testid="ai-sketch-page">
      <div className="max-w-[1400px] mx-auto px-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">AI CAD Sketch &rarr; 3D</h1>
            <p className="text-slate-500 text-xs">Рисувай или качи скица. 3D се обновява в реално време.</p>
          </div>
          <div className="flex gap-2" data-testid="mode-tabs">
            <button onClick={() => { setMode('draw'); setUploadRes(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium ${mode === 'draw' ? 'bg-[#FF8C42] text-white' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C]'}`}
              data-testid="mode-draw"><Pencil className="h-3.5 w-3.5 inline mr-1.5" />CAD</button>
            <button onClick={() => setMode('upload')}
              className={`px-4 py-2 rounded-lg text-xs font-medium ${mode === 'upload' ? 'bg-[#FF8C42] text-white' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C]'}`}
              data-testid="mode-upload"><Upload className="h-3.5 w-3.5 inline mr-1.5" />Качи скица</button>
          </div>
        </div>

        {/* ===== DRAW MODE ===== */}
        {mode === 'draw' && (
          <>
            <div className="grid lg:grid-cols-[1fr_1fr] gap-3 mb-3">
              {/* LEFT: Canvas */}
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap gap-1" data-testid="cad-toolbar">
                      {TOOLS.map(t => {
                        const I = t.icon;
                        return (
                          <button key={t.id} onClick={() => setTool(t.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium ${
                              tool === t.id ? 'bg-[#FF8C42] text-white' : 'bg-[#1E2A38] text-slate-400 hover:text-white'
                            }`} data-testid={`tool-${t.id}`}><I className="h-3 w-3" />{t.label}</button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px]">м/кв:</span>
                      <Input type="number" value={scale} min={0.1} step={0.1}
                        onChange={e => setScale(Math.max(0.1, +e.target.value || 1))}
                        className="w-14 h-6 text-[10px] bg-[#1E2A38] border-[#3A4A5C] text-white px-1" data-testid="scale-input" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="rounded-lg overflow-hidden border border-[#2A3A4C]" style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}>
                    <canvas ref={canvasRef} width={CW} height={CH} className="w-full block"
                      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
                      onMouseLeave={() => draft && setDraft(null)} data-testid="cad-canvas" />
                  </div>
                  <p className="text-slate-600 text-[9px] mt-1">Grid: 1кв = {scale}м | {els.filter(e => e.tool !== 'dimension').length} обекта</p>
                </CardContent>
              </Card>

              {/* RIGHT: Live 3D */}
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader className="pb-2 pt-3 px-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#4DA6FF]" /> 360 Live Preview
                    {objCount > 0 && <Badge className="bg-[#28A745]/15 text-[#28A745] text-[10px] ml-auto">{objCount}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div ref={viewerRef} className="w-full h-[370px] bg-[#0F1923] rounded-lg overflow-hidden border border-[#2A3A4C]" data-testid="3d-viewer" />
                  <p className="text-slate-600 text-[9px] mt-1 text-center">Въртене | Zoom | Преместване</p>
                </CardContent>
              </Card>
            </div>

            {/* Structure Panel */}
            <Card className="bg-[#253545] border-[#3A4A5C] mb-4">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">Обекти</CardTitle>
                  <div className="flex gap-1.5">
                    {[['wall', 'Стена', '#90cdf4'], ['stairs', 'Стълби', '#ffa500'], ['slab', 'Плоча', '#68d391']].map(([t, l, c]) => (
                      <button key={t} onClick={() => addManual(t)} data-testid={`add-${t}-btn`}
                        className="text-[10px] px-2 py-0.5 rounded border hover:opacity-80"
                        style={{ borderColor: `${c}50`, color: c, background: `${c}15` }}>
                        <Plus className="h-3 w-3 inline mr-0.5" />{l}
                      </button>
                    ))}
                    {els.length > 0 && <button onClick={reset} className="text-[10px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">Изчисти</button>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0" data-testid="structure-panel">
                {objCount === 0 ? (
                  <p className="text-slate-600 text-xs py-3 text-center">Нарисувайте обекти или добавете ръчно.</p>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                    {els.map((el, i) => {
                      if (el.tool === 'dimension') return null;
                      const t = el._type || autoType(el);
                      if (t === 'ignore') return null;
                      const isSel = i === selIdx;
                      const lenM = (Math.hypot(el.x2 - el.x1, el.y2 - el.y1) / GRID * scale).toFixed(1);
                      const hint = smartHint(el, scale);
                      const typeColor = t === 'wall' ? '#90cdf4' : t === 'stairs' ? '#ffa500' : '#68d391';
                      const typeLabel = t === 'wall' ? `Стена #${els.slice(0, i).filter(e => (e._type || autoType(e)) === 'wall').length + 1}` :
                                        t === 'stairs' ? `Стълби (${el.steps ?? 8} стъп.)` :
                                        `Плоча ${(Math.abs(el.x2 - el.x1) / GRID * scale).toFixed(1)}x${(Math.abs(el.y2 - el.y1) / GRID * scale).toFixed(1)}м`;
                      return (
                        <div key={i} onClick={() => setSelIdx(i)}
                          className={`p-2 rounded-lg border cursor-pointer transition-all ${isSel ? 'border-[#FF8C42] bg-[#FF8C42]/5' : 'border-[#2A3A4C] bg-[#1E2A38] hover:border-[#3A4A5C]'}`}
                          data-testid={`obj-${i}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <Badge className="text-[9px]" style={{ background: `${typeColor}15`, color: typeColor, borderColor: `${typeColor}30` }}>{typeLabel}</Badge>
                            <button onClick={e => { e.stopPropagation(); deleteEl(i); }} className="text-red-400 hover:text-red-300 p-0.5" data-testid={`delete-obj-${i}`}><Trash2 className="h-3 w-3" /></button>
                          </div>
                          {hint && (
                            <div className="flex items-center gap-1 mb-1.5 bg-[#8C56FF]/10 border border-[#8C56FF]/20 rounded p-1">
                              <AlertCircle className="h-3 w-3 text-[#8C56FF] flex-shrink-0" />
                              <span className="text-[#8C56FF] text-[9px] flex-1">{hint}</span>
                              <button onClick={e => { e.stopPropagation(); updateEl(i, '_type', 'stairs'); }} className="text-[8px] bg-[#8C56FF] text-white px-1.5 py-0.5 rounded">Приложи</button>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-1.5">
                            {t === 'wall' && (
                              <>
                                <div><Label className="text-slate-600 text-[9px]">h (м)</Label>
                                  <Input type="number" step={0.1} value={el.height ?? 3} onChange={e => updateEl(i, 'height', +e.target.value)}
                                    className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" /></div>
                                <div><Label className="text-slate-600 text-[9px]">t (см)</Label>
                                  <Input type="number" step={1} value={el.thickness ?? 30} onChange={e => updateEl(i, 'thickness', +e.target.value)}
                                    className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" /></div>
                              </>
                            )}
                            {t === 'stairs' && (
                              <>
                                <div><Label className="text-slate-600 text-[9px]">Стъпала</Label>
                                  <Input type="number" value={el.steps ?? 8} onChange={e => updateEl(i, 'steps', Math.max(1, +e.target.value))}
                                    className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" /></div>
                                <div><Label className="text-slate-600 text-[9px]">Rise (м)</Label>
                                  <Input type="number" step={0.01} value={el.rise ?? 0.17} onChange={e => updateEl(i, 'rise', +e.target.value)}
                                    className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" /></div>
                                <div><Label className="text-slate-600 text-[9px]">Run (м)</Label>
                                  <Input type="number" step={0.01} value={el.run ?? 0.30} onChange={e => updateEl(i, 'run', +e.target.value)}
                                    className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" /></div>
                                <div><Label className="text-slate-600 text-[9px]">Шир. (м)</Label>
                                  <Input type="number" step={0.1} value={el.stairWidth ?? 1.2} onChange={e => updateEl(i, 'stairWidth', +e.target.value)}
                                    className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" /></div>
                              </>
                            )}
                            {t === 'slab' && (
                              <div className="col-span-2"><Label className="text-slate-600 text-[9px]">Дебел. (см)</Label>
                                <Input type="number" step={1} value={el.slabThickness ?? 15} onChange={e => updateEl(i, 'slabThickness', +e.target.value)}
                                  className="h-6 text-[10px] bg-[#0F1923] border-[#2A3A4C] text-white px-1" /></div>
                            )}
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            {['wall', 'stairs', 'slab', 'ignore'].map(tp => (
                              <button key={tp} onClick={e => { e.stopPropagation(); updateEl(i, '_type', tp); }}
                                className={`text-[8px] px-1.5 py-0.5 rounded border ${t === tp ? 'border-[#28A745] bg-[#28A745]/10 text-[#28A745]' : 'border-[#2A3A4C] text-slate-600 hover:text-slate-300'}`}>
                                {tp === 'wall' ? 'Стена' : tp === 'stairs' ? 'Стълби' : tp === 'slab' ? 'Плоча' : 'Скрий'}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* ===== UPLOAD MODE ===== */}
        {mode === 'upload' && (
          <div className="space-y-4">
            {!uploadRes ? (
              <>
                <Card className="bg-[#253545] border-[#3A4A5C]">
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
                              className="aspect-square w-full rounded-lg border-2 border-dashed border-[#3A4A5C] hover:border-[#FF8C42]/50 flex flex-col items-center justify-center gap-1 bg-[#1E2A38]/50"
                              data-testid={`sketch-upload-btn-${idx}`}><Upload className="h-5 w-5 text-slate-500" /><span className="text-slate-500 text-[10px]">{idx + 1}</span></button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Бележки..."
                      className="bg-[#1E2A38] border-[#3A4A5C] text-white min-h-[60px] text-sm mt-3" data-testid="sketch-notes" />
                  </CardContent>
                </Card>
                <Button className="w-full bg-[#FF8C42] hover:bg-[#e67a30] text-white h-11" onClick={handleAnalyze}
                  disabled={!sketches.filter(Boolean).length || loading} data-testid="analyze-btn">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />CV анализира...</> : <><Ruler className="mr-2 h-4 w-4" />Генерирай 3D</>}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <Card className="bg-[#253545] border-[#3A4A5C]">
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
                    <div ref={glbViewerRef} className="w-full h-[400px] bg-[#0F1923] rounded-lg overflow-hidden border border-[#2A3A4C]" data-testid="3d-viewer" />
                  </CardContent>
                </Card>
                {uploadRes.summary && (
                  <Card className="bg-[#253545] border-[#3A4A5C]">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-4 gap-3">
                        {[{ v: uploadRes.summary.walls_detected, l: 'Стени', c: '#FF8C42' }, { v: uploadRes.summary.stairs_detected, l: 'Стълби', c: '#4DA6FF' }, { v: uploadRes.summary.dimensions_found, l: 'OCR', c: '#28A745' }, { v: uploadRes.summary.floor_area_sqm || '-', l: 'м2', c: '#8C56FF' }].map((s, i) => (
                          <div key={i} className="bg-[#1E2A38] rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p><p className="text-slate-500 text-[9px]">{s.l}</p>
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
