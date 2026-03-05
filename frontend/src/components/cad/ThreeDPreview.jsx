// TemaDom IA CAD v5.1 — Three.js Live 3D Preview
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GRID } from './constants';
import { autoType } from './utils';

function buildMesh(scene, el, i, sc, selIdx) {
  if (el.tool === 'dimension') return;
  const t = el._type || autoType(el);
  if (t === 'ignore') return;
  const isSel = i === selIdx;
  const selColor = 0xFF8C42;

  if (t === 'wall') {
    const h = el.height ?? 3, th = (el.thickness ?? 25) / 100;
    const sx = el.x1 / GRID * sc, sz = el.y1 / GRID * sc;
    const ex = el.x2 / GRID * sc, ez = el.y2 / GRID * sc;
    const dx = ex - sx, dz = ez - sz;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len < 0.1) return;
    const ang = Math.atan2(dz, dx);
    const geo = new THREE.BoxGeometry(len, h, th);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0xd4d4d4, roughness: 0.7 });
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
    mesh.position.set((sx + ex) / 2, h / 2, (sz + ez) / 2);
    mesh.rotation.y = -ang;
    scene.add(mesh);
    addEdges(scene, geo, mesh);
  } else if (t === 'roof') {
    const sx = el.x1 / GRID * sc, sz = el.y1 / GRID * sc;
    const ex = el.x2 / GRID * sc, ez = el.y2 / GRID * sc;
    const len = Math.sqrt((ex - sx) ** 2 + (ez - sz) ** 2);
    if (len < 0.1) return;
    const ang = Math.atan2(ez - sz, ex - sx);
    const roofAngle = (el.roofAngle || 30) * Math.PI / 180;
    const width = 4, peakH = (width / 2) * Math.tan(roofAngle);
    // Triangular prism
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, 0);
    shape.lineTo(0, peakH);
    shape.lineTo(width / 2, 0);
    shape.lineTo(-width / 2, 0);
    const extrudeSettings = { depth: len, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0xcc6633, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
    mesh.position.set(sx, (el.height ?? 3), sz);
    mesh.rotation.y = -ang;
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    addEdges(scene, geo, mesh);
  } else if (t === 'stairs') {
    const steps = el.steps ?? 8, rise = el.rise ?? 0.17, run = el.run ?? 0.30, w = el.stairWidth ?? 1.2;
    const sx = el.x1 / GRID * sc, sz = el.y1 / GRID * sc;
    for (let s = 0; s < steps; s++) {
      const geo = new THREE.BoxGeometry(run * 0.95, rise, w);
      const mat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0xb8a080, roughness: 0.6 });
      const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
      mesh.position.set(sx + s * run + run / 2, (s + 0.5) * rise, sz);
      scene.add(mesh);
    }
  } else if (t === 'slab') {
    const x1m = Math.min(el.x1, el.x2) / GRID * sc, z1m = Math.min(el.y1, el.y2) / GRID * sc;
    const wm = Math.abs(el.x2 - el.x1) / GRID * sc, dm = Math.abs(el.y2 - el.y1) / GRID * sc;
    const th = (el.slabThickness ?? 15) / 100;
    if (wm < 0.1 || dm < 0.1) return;
    const geo = new THREE.BoxGeometry(wm, th, dm);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0xc0c0c0, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
    mesh.position.set(x1m + wm / 2, -th / 2, z1m + dm / 2);
    scene.add(mesh);
    addEdges(scene, geo, mesh);
  } else if (t === 'door') {
    const sx = el.x1 / GRID * sc, sz = el.y1 / GRID * sc;
    const ex = el.x2 / GRID * sc, ez = el.y2 / GRID * sc;
    const len = Math.sqrt((ex - sx) ** 2 + (ez - sz) ** 2);
    if (len < 0.1) return;
    const ang = Math.atan2(ez - sz, ex - sx);
    const dw = el.doorWidth || 0.9, dh = el.doorHeight || 2.1;
    // Door frame
    const geo = new THREE.BoxGeometry(dw, dh, 0.08);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0x8B4513, roughness: 0.4 });
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
    mesh.position.set((sx + ex) / 2, dh / 2, (sz + ez) / 2);
    mesh.rotation.y = -ang;
    scene.add(mesh);
    addEdges(scene, geo, mesh);
  } else if (t === 'window') {
    const sx = el.x1 / GRID * sc, sz = el.y1 / GRID * sc;
    const ex = el.x2 / GRID * sc, ez = el.y2 / GRID * sc;
    const ang = Math.atan2(ez - sz, ex - sx);
    const ww = el.windowWidth || 1.2, wh = el.windowHeight || 1.5, sill = el.windowSill || 0.9;
    // Frame
    const fGeo = new THREE.BoxGeometry(ww, wh, 0.06);
    const fMat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0xffffff, roughness: 0.3 });
    const frame = new THREE.Mesh(fGeo, fMat); frame.userData.isObj = true;
    frame.position.set((sx + ex) / 2, sill + wh / 2, (sz + ez) / 2);
    frame.rotation.y = -ang;
    scene.add(frame);
    // Glass
    const gGeo = new THREE.PlaneGeometry(ww - 0.1, wh - 0.1);
    const gMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const glass = new THREE.Mesh(gGeo, gMat); glass.userData.isObj = true;
    glass.position.copy(frame.position);
    glass.rotation.y = -ang;
    scene.add(glass);
  } else if (t === 'column') {
    const cx = el.x1 / GRID * sc, cz = el.y1 / GRID * sc;
    const r = (el.columnDiameter || 30) / 200, h = el.columnHeight || 3;
    const geo = new THREE.CylinderGeometry(r, r, h, 16);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0x999999, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
    mesh.position.set(cx, h / 2, cz);
    scene.add(mesh);
    addEdges(scene, geo, mesh);
  } else if (t === 'beam') {
    const sx = el.x1 / GRID * sc, sz = el.y1 / GRID * sc;
    const ex = el.x2 / GRID * sc, ez = el.y2 / GRID * sc;
    const len = Math.sqrt((ex - sx) ** 2 + (ez - sz) ** 2);
    if (len < 0.1) return;
    const ang = Math.atan2(ez - sz, ex - sx);
    const bw = (el.beamWidth || 25) / 100, bh = (el.beamHeight || 45) / 100;
    const elev = el.beamElevation || 2.7;
    const geo = new THREE.BoxGeometry(len, bh, bw);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0xaaaaaa, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
    mesh.position.set((sx + ex) / 2, elev + bh / 2, (sz + ez) / 2);
    mesh.rotation.y = -ang;
    scene.add(mesh);
    addEdges(scene, geo, mesh);
  } else if (t === 'circle') {
    const cx = el.cx / GRID * sc, cz = el.cy / GRID * sc;
    const r = (el.r || GRID) / GRID * sc;
    const th = (el.circleThickness || 15) / 100;
    const geo = new THREE.CylinderGeometry(r, r, th, 32);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? selColor : 0x1abc9c, roughness: 0.7 });
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
    mesh.position.set(cx, th / 2, cz);
    scene.add(mesh);
    addEdges(scene, geo, mesh);
  }
}

function addEdges(scene, geo, mesh) {
  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x444444 }));
  line.position.copy(mesh.position); line.rotation.copy(mesh.rotation);
  line.userData.isObj = true;
  scene.add(line);
}

function buildScene(scene, els, sc, selIdx) {
  const toRemove = [];
  scene.traverse(c => { if (c.userData.isObj) toRemove.push(c); });
  toRemove.forEach(c => { c.geometry?.dispose(); c.material?.dispose(); scene.remove(c); });
  els.forEach((el, i) => buildMesh(scene, el, i, sc, selIdx));
}

export function useThreeViewer(containerRef, els, scale, selIdx) {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth, h = container.clientHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0F1923);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(12, 10, 12);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = 0.05;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const d1 = new THREE.DirectionalLight(0xffffff, 0.9); d1.position.set(10, 20, 10); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xffffff, 0.3); d2.position.set(-5, 8, -5); scene.add(d2);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x1a2332 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
    scene.add(new THREE.GridHelper(60, 60, 0x253545, 0x1e2e3f));

    let raf;
    const animate = () => { raf = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
    animate();

    const onResize = () => {
      const nw = container.clientWidth, nh = container.clientHeight;
      if (nw > 0 && nh > 0) { camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh); }
    };
    window.addEventListener('resize', onResize);

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); controls.dispose(); renderer.dispose(); if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement); };
  }, [containerRef]);

  useEffect(() => { if (sceneRef.current) buildScene(sceneRef.current, els, scale, selIdx); }, [els, scale, selIdx]);

  return { sceneRef, rendererRef };
}
