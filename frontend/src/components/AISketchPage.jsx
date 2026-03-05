// TemaDom IA CAD v5.1 — Main Page (Orchestrator)
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Upload, Loader2, X, Download, Ruler, RotateCcw, Eye, Share2,
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
import { snapEndpoint, distSeg, distCircle, autoType, getDefaults, elLength } from './cad/utils';
import { CADCanvas } from './cad/CADCanvas';
import { useThreeViewer } from './cad/ThreeDPreview';
import { StructurePanel } from './cad/StructurePanel';
import { CostEstimate } from './cad/CostEstimate';

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
  const [draft, setDraft] = useState(null);
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

  // Load shared project
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) { setMode('upload'); axios.get(`${API}/ai-sketch/${id}`).then(r => setUploadRes(r.data)).catch(() => toast.error('Не е намерен')); }
  }, [searchParams]);

  // Live 3D
  useThreeViewer(viewerRef, els, scale, selIdx);
  useGlbViewer(glbViewerRef, uploadRes?.glb_base64);

  const objCount = useMemo(() => els.filter(e => e.tool !== 'dimension' && (e._type || autoType(e)) !== 'ignore').length, [els]);

  // ===== DRAWING HANDLERS =====
  const onDown = useCallback((x, y) => {
    if (tool === 'select') {
      let found = -1;
      els.forEach((el, i) => {
        if (el.tool === 'circle') {
          if (distCircle(x, y, el.cx, el.cy, el.r || 0) < 12) found = i;
        } else if (distSeg(x, y, el.x1, el.y1, el.x2, el.y2) < 12) found = i;
      });
      setSelIdx(found);
      return;
    }
    if (tool === 'erase') {
      let found = -1;
      els.forEach((el, i) => {
        if (el.tool === 'circle') {
          if (distCircle(x, y, el.cx, el.cy, el.r || 0) < 12) found = i;
        } else if (distSeg(x, y, el.x1, el.y1, el.x2, el.y2) < 12) found = i;
      });
      if (found >= 0) setEls(p => p.filter((_, i) => i !== found));
      setSelIdx(-1);
      return;
    }
    if (tool === 'column') {
      const newEl = { tool: 'column', x1: x, y1: y, x2: x, y2: y, _type: 'column', floor: currentFloor, ...getDefaults('column') };
      setEls(p => [...p, newEl]);
      return;
    }
    if (tool === 'circle') {
      setDraft({ tool: 'circle', cx: x, cy: y, r: 0, floor: currentFloor });
      return;
    }
    setDraft({ tool, x1: x, y1: y, x2: x, y2: y, floor: currentFloor });
  }, [tool, els, currentFloor]);

  const onMove = useCallback((x, y) => {
    if (!draft) return;
    if (draft.tool === 'circle') {
      setDraft(p => ({ ...p, r: Math.hypot(x - p.cx, y - p.cy) }));
    } else {
      setDraft(p => ({ ...p, x2: x, y2: y }));
    }
  }, [draft]);

  const onUp = useCallback(() => {
    if (!draft) return;
    if (draft.tool === 'circle') {
      if ((draft.r || 0) > 5) {
        const newEl = { ...draft, _type: 'circle', ...getDefaults('circle') };
        setEls(p => [...p, newEl]);
      }
    } else {
      const len = Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1);
      if (len > 10) {
        const newEl = { ...draft, _type: autoType(draft), ...getDefaults(draft.tool) };
        setEls(p => [...p, newEl]);
      }
    }
    setDraft(null);
  }, [draft]);

  const updateEl = (i, f, v) => setEls(p => p.map((e, j) => j === i ? { ...e, [f]: v } : e));
  const deleteEl = (i) => { setEls(p => p.filter((_, j) => j !== i)); setSelIdx(-1); };

  const addManual = (type) => {
    const toolType = ['slab'].includes(type) ? 'rect' : ['circle'].includes(type) ? 'circle' : type;
    if (type === 'circle') {
      const newEl = { tool: 'circle', cx: 400, cy: 300, r: 60, _type: 'circle', floor: currentFloor, ...getDefaults('circle') };
      setEls(p => [...p, newEl]);
      return;
    }
    if (type === 'column') {
      const newEl = { tool: 'column', x1: 300, y1: 300, x2: 300, y2: 300, _type: 'column', floor: currentFloor, ...getDefaults('column') };
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

  const shareProject = () => {
    if (!uploadRes?.id) return;
    navigator.clipboard.writeText(`${window.location.origin}/ai-sketch?id=${uploadRes.id}`).then(() => toast.success('Линк копиран!'));
  };

  return (
    <div className="min-h-screen bg-[#1E2A38] py-3 px-2 md:px-4" data-testid="ai-sketch-page">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">IA CAD v5.1</h1>
            <p className="text-slate-500 text-[10px]">Скица → 3D → Сметка → Договор | Touch</p>
          </div>
          <div className="flex gap-2" data-testid="mode-tabs">
            <button onClick={() => { setMode('draw'); setUploadRes(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'draw' ? 'bg-[#FF8C42] text-white' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C]'}`}
              data-testid="mode-draw">CAD</button>
            <button onClick={() => setMode('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${mode === 'upload' ? 'bg-[#FF8C42] text-white' : 'bg-[#253545] text-slate-400 border border-[#3A4A5C]'}`}
              data-testid="mode-upload"><Upload className="h-3.5 w-3.5 inline mr-1" />Качи</button>
          </div>
        </div>

        {/* ===== DRAW MODE ===== */}
        {mode === 'draw' && (
          <>
            {/* Toolbar */}
            <Card className="bg-[#253545] border-[#3A4A5C] mb-3">
              <CardContent className="py-2 px-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1" data-testid="cad-toolbar">
                    {TOOLS.map(t => {
                      const I = ICON_MAP[t.id];
                      return (
                        <button key={t.id} onClick={() => setTool(t.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                            tool === t.id ? 'bg-[#FF8C42] text-white shadow-lg shadow-[#FF8C42]/20' : 'bg-[#1E2A38] text-slate-400 hover:text-white hover:bg-[#2A3A4C]'
                          }`} data-testid={`tool-${t.id}`}>
                          {I && <I className="h-3 w-3" />}<span className="hidden sm:inline">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[10px]">Ет:</span>
                      <button onClick={() => setCurrentFloor(p => Math.max(0, p - 1))} className="text-slate-400 hover:text-white text-xs px-1 bg-[#1E2A38] rounded">-</button>
                      <span className="text-white text-xs font-bold w-4 text-center" data-testid="floor-indicator">{currentFloor}</span>
                      <button onClick={() => setCurrentFloor(p => p + 1)} className="text-slate-400 hover:text-white text-xs px-1 bg-[#1E2A38] rounded" data-testid="floor-up-btn">+</button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 text-[10px]">м/кв:</span>
                      <Input type="number" value={scale} min={0.1} step={0.1}
                        onChange={e => setScale(Math.max(0.1, +e.target.value || 1))}
                        className="w-14 h-6 text-[10px] bg-[#1E2A38] border-[#3A4A5C] text-white px-1" data-testid="scale-input" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Canvas + 3D side by side */}
            <div className="grid lg:grid-cols-[1fr_1fr] gap-3 mb-3">
              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-[#FF8C42]" /> 2D Чертеж
                    <Badge className="bg-[#28A745]/15 text-[#28A745] text-[9px] ml-auto">Ет. {currentFloor}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <CADCanvas els={els} selIdx={selIdx} tool={tool} scale={scale} draft={draft}
                    onDown={onDown} onMove={onMove} onUp={onUp} onSelect={setSelIdx} />
                </CardContent>
              </Card>

              <Card className="bg-[#253545] border-[#3A4A5C]">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#4DA6FF]" /> 360 Live Preview
                    {objCount > 0 && <Badge className="bg-[#28A745]/15 text-[#28A745] text-[9px] ml-auto">{objCount}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div ref={viewerRef} className="w-full h-[350px] lg:h-[420px] bg-[#0F1923] rounded-lg overflow-hidden border border-[#2A3A4C]" data-testid="3d-viewer" />
                  <p className="text-slate-600 text-[9px] mt-1 text-center">Въртене | Zoom | Преместване</p>
                </CardContent>
              </Card>
            </div>

            {/* Structure Panel */}
            <Card className="bg-[#253545] border-[#3A4A5C] mb-3">
              <CardContent className="px-3 py-3">
                <StructurePanel els={els} selIdx={selIdx} scale={scale}
                  onSelect={setSelIdx} onDelete={deleteEl} onUpdate={updateEl}
                  onAddManual={addManual} onClear={reset} />
              </CardContent>
            </Card>

            {/* Cost Estimate */}
            {objCount > 0 && (
              <Card className="bg-[#253545] border-[#3A4A5C] mb-3">
                <CardContent className="px-3 py-3">
                  <CostEstimate els={els} scale={scale} />
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
