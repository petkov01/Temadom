// TemaDom IA CAD v5.1 — Three.js Live 3D Preview (all element types)
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GRID } from './constants';
import { autoType } from './utils';

const SEL_COLOR = 0xFF8C42;
const FLOOR_H = 3; // default floor height (meters)

function addObj(scene, geo, mat, pos, rot) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.isObj = true;
  mesh.position.set(pos.x, pos.y, pos.z);
  if (rot) { if (rot.x) mesh.rotation.x = rot.x; if (rot.y) mesh.rotation.y = rot.y; if (rot.z) mesh.rotation.z = rot.z; }
  scene.add(mesh);
  // Edge wireframe
  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x444444 }));
  line.userData.isObj = true;
  line.position.copy(mesh.position); line.rotation.copy(mesh.rotation);
  scene.add(line);
  return mesh;
}

function buildMesh(scene, el, i, sc, selIdx) {
  if (el.tool === 'dimension') return;
  const t = el._type || autoType(el);
  if (t === 'ignore') return;
  const isSel = i === selIdx;
  const floorY = (el.floor || 0) * FLOOR_H;

  // Line-based elements: compute world coords
  let sx = 0, sz = 0, ex = 0, ez = 0, len = 0, ang = 0;
  if (t !== 'circle' && el.x1 != null) {
    sx = el.x1 / GRID * sc; sz = el.y1 / GRID * sc;
    ex = (el.x2 ?? el.x1) / GRID * sc; ez = (el.y2 ?? el.y1) / GRID * sc;
    len = Math.sqrt((ex - sx) ** 2 + (ez - sz) ** 2);
    ang = Math.atan2(ez - sz, ex - sx);
  }
  const mx = (sx + ex) / 2, mz = (sz + ez) / 2;

  if (t === 'wall') {
    const h = el.height ?? 3, th = (el.thickness ?? 25) / 100;
    if (len < 0.05) return;
    const geo = new THREE.BoxGeometry(len, h, th);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0xd4d4d4, roughness: 0.7 });
    addObj(scene, geo, mat, { x: mx, y: floorY + h / 2, z: mz }, { y: -ang });
  }

  else if (t === 'roof') {
    if (len < 0.05) return;
    const roofAngle = (el.roofAngle || 30) * Math.PI / 180;
    const roofWidth = 4;
    const peakH = (roofWidth / 2) * Math.tan(roofAngle);
    const shape = new THREE.Shape();
    shape.moveTo(-roofWidth / 2, 0);
    shape.lineTo(0, peakH);
    shape.lineTo(roofWidth / 2, 0);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0xcc6633, roughness: 0.5, side: THREE.DoubleSide });
    // Position roof on top of walls
    const baseH = el.height ?? 3;
    const mesh = new THREE.Mesh(geo, mat); mesh.userData.isObj = true;
    mesh.position.set(sx, floorY + baseH, sz);
    mesh.rotation.set(-Math.PI / 2, 0, -ang);
    scene.add(mesh);
  }

  else if (t === 'slab') {
    const x1m = Math.min(el.x1, el.x2) / GRID * sc, z1m = Math.min(el.y1, el.y2) / GRID * sc;
    const wm = Math.abs(el.x2 - el.x1) / GRID * sc, dm = Math.abs(el.y2 - el.y1) / GRID * sc;
    const th = (el.slabThickness ?? 15) / 100;
    if (wm < 0.05 || dm < 0.05) return;
    const geo = new THREE.BoxGeometry(wm, th, dm);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0xc0c0c0, roughness: 0.8 });
    addObj(scene, geo, mat, { x: x1m + wm / 2, y: floorY - th / 2, z: z1m + dm / 2 });
  }

  else if (t === 'door') {
    if (len < 0.05) return;
    const dw = el.doorWidth || 0.9, dh = el.doorHeight || 2.1;
    // Door frame (thicker for visibility)
    const frameGeo = new THREE.BoxGeometry(dw, dh, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0x8B4513, roughness: 0.4 });
    addObj(scene, frameGeo, frameMat, { x: mx, y: floorY + dh / 2, z: mz }, { y: -ang });
    // Door panel (slightly recessed)
    const panelGeo = new THREE.BoxGeometry(dw - 0.1, dh - 0.15, 0.05);
    const panelMat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0xA0522D, roughness: 0.3 });
    addObj(scene, panelGeo, panelMat, { x: mx, y: floorY + dh / 2, z: mz }, { y: -ang });
  }

  else if (t === 'window') {
    if (len < 0.05) return;
    const ww = el.windowWidth || 1.2, wh = el.windowHeight || 1.5, sill = el.windowSill || 0.9;
    // White frame
    const fGeo = new THREE.BoxGeometry(ww, wh, 0.1);
    const fMat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0xffffff, roughness: 0.3 });
    addObj(scene, fGeo, fMat, { x: mx, y: floorY + sill + wh / 2, z: mz }, { y: -ang });
    // Glass (transparent blue)
    const gGeo = new THREE.PlaneGeometry(ww - 0.1, wh - 0.1);
    const gMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const glass = new THREE.Mesh(gGeo, gMat); glass.userData.isObj = true;
    glass.position.set(mx, floorY + sill + wh / 2, mz);
    glass.rotation.y = -ang;
    scene.add(glass);
  }

  else if (t === 'column') {
    const cx = el.x1 / GRID * sc, cz = el.y1 / GRID * sc;
    const r = (el.columnDiameter || 30) / 200, h = el.columnHeight || 3;
    const geo = new THREE.CylinderGeometry(r, r, h, 16);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0x808080, roughness: 0.5 });
    addObj(scene, geo, mat, { x: cx, y: floorY + h / 2, z: cz });
  }

  else if (t === 'beam') {
    if (len < 0.05) return;
    const bw = (el.beamWidth || 25) / 100, bh = (el.beamHeight || 45) / 100;
    const elev = el.beamElevation || 2.7;
    const geo = new THREE.BoxGeometry(len, bh, bw);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0xaaaaaa, roughness: 0.6 });
    addObj(scene, geo, mat, { x: mx, y: floorY + elev + bh / 2, z: mz }, { y: -ang });
  }

  else if (t === 'stairs') {
    const steps = el.steps ?? 8, rise = el.rise ?? 0.17, run = el.run ?? 0.30, w = el.stairWidth ?? 1.2;
    if (len < 0.05) return;
    const stepDir = Math.atan2(ez - sz, ex - sx);
    for (let s = 0; s < steps; s++) {
      const geo = new THREE.BoxGeometry(run * 0.95, rise, w);
      const mat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0xb8a080, roughness: 0.6 });
      const px = sx + Math.cos(stepDir) * (s * run + run / 2);
      const pz = sz + Math.sin(stepDir) * (s * run + run / 2);
      addObj(scene, geo, mat, { x: px, y: floorY + (s + 0.5) * rise, z: pz }, { y: -stepDir });
    }
  }

  else if (t === 'circle') {
    const cx = el.cx / GRID * sc, cz = el.cy / GRID * sc;
    const r = (el.r || GRID) / GRID * sc;
    const th = (el.circleThickness || 15) / 100;
    const geo = new THREE.CylinderGeometry(r, r, th, 32);
    const mat = new THREE.MeshStandardMaterial({ color: isSel ? SEL_COLOR : 0x1abc9c, roughness: 0.7 });
    addObj(scene, geo, mat, { x: cx, y: floorY + th / 2, z: cz });
  }
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
