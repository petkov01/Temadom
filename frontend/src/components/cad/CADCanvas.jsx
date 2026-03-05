// TemaDom IA CAD v5.1 — 2D CAD Canvas with Touch Support
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GRID, CW, CH, OBJ_COLORS } from './constants';
import { snapEndpoint } from './utils';

function renderGrid(ctx, w, h) {
  ctx.fillStyle = '#141e2b';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#1e2e3f'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = '#253545'; ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += GRID * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += GRID * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

function drawElement(ctx, el, sel, sc) {
  const col = sel ? '#FF8C42' : OBJ_COLORS[el.tool] || '#888';
  ctx.strokeStyle = col; ctx.fillStyle = col;

  if (el.tool === 'circle') {
    ctx.lineWidth = 3; ctx.beginPath();
    ctx.arc(el.cx, el.cy, el.r || 1, 0, Math.PI * 2); ctx.stroke();
    if (sel) { ctx.beginPath(); ctx.arc(el.cx, el.cy, 4, 0, Math.PI * 2); ctx.fill(); }
    const diam = ((el.r || 0) * 2 / GRID * sc).toFixed(1);
    ctx.font = '11px monospace'; ctx.fillText(`R${diam}м`, el.cx + (el.r || 0) + 6, el.cy - 4);
    return;
  }
  if (el.tool === 'column') {
    const r = ((el.columnDiameter || 30) / 100) / sc * GRID / 2;
    ctx.lineWidth = 2; ctx.beginPath();
    ctx.arc(el.x1, el.y1, Math.max(r, 6), 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(el.x1, el.y1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(el.x1 - Math.max(r, 6), el.y1); ctx.lineTo(el.x1 + Math.max(r, 6), el.y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(el.x1, el.y1 - Math.max(r, 6)); ctx.lineTo(el.x1, el.y1 + Math.max(r, 6)); ctx.stroke();
    ctx.setLineDash([]);
    return;
  }

  const { x1, y1, x2, y2 } = el;
  if (el.tool === 'wall') {
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = sel ? '#FF8C42CC' : '#90cdf4AA';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  } else if (el.tool === 'roof') {
    ctx.lineWidth = 4; ctx.setLineDash([8, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const ang = (el.roofAngle || 30);
    ctx.font = 'bold 11px monospace'; ctx.fillText(`${ang}deg`, mx + 8, my - 8);
    // Triangle indicator
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 20) {
      const nx = -(y2 - y1) / len * 15, ny = (x2 - x1) / len * 15;
      ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(mx + nx, my + ny); ctx.lineTo(x2, y2); ctx.stroke();
    }
  } else if (el.tool === 'door') {
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // Door arc
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 8) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(x1, y1, len, angle - Math.PI / 2, angle); ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (el.tool === 'window') {
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // Double line for window
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 8) {
      const nx = -(y2 - y1) / len * 4, ny = (x2 - x1) / len * 4;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1 + nx, y1 + ny); ctx.lineTo(x2 + nx, y2 + ny); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1 - nx, y1 - ny); ctx.lineTo(x2 - nx, y2 - ny); ctx.stroke();
    }
  } else if (el.tool === 'beam') {
    ctx.lineWidth = 5; ctx.setLineDash([6, 3]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
  } else if (el.tool === 'rect' || el.tool === 'slab') {
    ctx.lineWidth = 3; ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    // Diagonal cross for slab
    if (el._type === 'slab' || el.tool === 'slab') {
      ctx.lineWidth = 0.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x2, y1); ctx.lineTo(x1, y2); ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (el.tool === 'stairs') {
    const st = el.steps || 8, dx = (x2 - x1) / st, dy = (y2 - y1) / st;
    ctx.lineWidth = 2;
    for (let s = 0; s <= st; s++) {
      const px = x1 + dx * s, py = y1 + dy * s;
      ctx.beginPath(); ctx.moveTo(px - 12, py); ctx.lineTo(px + 12, py); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    // Arrow
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 6, y2 - 6); ctx.moveTo(x2, y2); ctx.lineTo(x2 + 6, y2 - 6); ctx.stroke();
  } else if (el.tool === 'dimension') {
    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    // Endpoints
    ctx.lineWidth = 1;
    [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(p => {
      ctx.beginPath(); ctx.moveTo(p.x - 5, p.y - 5); ctx.lineTo(p.x + 5, p.y + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x + 5, p.y - 5); ctx.lineTo(p.x - 5, p.y + 5); ctx.stroke();
    });
  } else {
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  // Measurement label
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len > 15 && el.tool !== 'column') {
    const m = (len / GRID * sc).toFixed(el.tool === 'dimension' ? 2 : 1);
    ctx.fillStyle = col;
    ctx.font = `${el.tool === 'dimension' ? 'bold 12' : '11'}px monospace`;
    ctx.fillText(`${m}м`, (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 6);
  }
  // Selection handles
  if (sel) {
    ctx.fillStyle = '#FF8C42';
    [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    });
  }
}

function renderAll(ctx, els, draft, selIdx, sc, distLines) {
  renderGrid(ctx, ctx.canvas.width, ctx.canvas.height);
  els.forEach((el, i) => drawElement(ctx, el, i === selIdx, sc));
  if (draft) {
    ctx.save(); ctx.globalAlpha = 0.7;
    if (draft.tool === 'circle' && draft.cx != null) {
      ctx.strokeStyle = '#FF8C42'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
      ctx.beginPath(); ctx.arc(draft.cx, draft.cy, draft.r || 1, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    } else if (draft.x1 != null) {
      drawElement(ctx, draft, false, sc);
    }
    ctx.restore();
  }
  // Distance indicator lines
  if (distLines && distLines.length) {
    ctx.save();
    distLines.forEach(dl => {
      ctx.strokeStyle = '#FF4444'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(dl.x1, dl.y1); ctx.lineTo(dl.x2, dl.y2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#FF4444'; ctx.font = 'bold 11px monospace';
      ctx.fillText(`${dl.dist}м`, (dl.x1 + dl.x2) / 2 + 4, (dl.y1 + dl.y2) / 2 - 6);
    });
    ctx.restore();
  }
}

export const CADCanvas = ({ els, selIdx, tool, scale, draft, distLines, onDown, onMove, onUp, onSelect }) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: CW, h: CH });
  const containerRef = useRef(null);

  // Responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      const ratio = CH / CW;
      setCanvasSize({ w: Math.min(cw, CW), h: Math.min(cw * ratio, CH) });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Render loop
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let raf;
    const frame = () => { renderAll(ctx, els, draft, selIdx, scale, distLines); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [els, draft, selIdx, scale, distLines]);

  const getPos = useCallback((clientX, clientY) => {
    const r = canvasRef.current.getBoundingClientRect();
    const x = (clientX - r.left) * (CW / r.width);
    const y = (clientY - r.top) * (CH / r.height);
    return snapEndpoint(x, y, els);
  }, [els]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    const [x, y] = getPos(e.clientX, e.clientY);
    onDown(x, y);
  }, [getPos, onDown]);

  const handleMouseMove = useCallback((e) => {
    const [x, y] = getPos(e.clientX, e.clientY);
    onMove(x, y);
  }, [getPos, onMove]);

  const handleMouseUp = useCallback(() => { onUp(); }, [onUp]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const t = e.touches[0];
    const [x, y] = getPos(t.clientX, t.clientY);
    onDown(x, y);
  }, [getPos, onDown]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const t = e.touches[0];
    const [x, y] = getPos(t.clientX, t.clientY);
    onMove(x, y);
  }, [getPos, onMove]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    onUp();
  }, [onUp]);

  const cursor = tool === 'select' ? 'default' : tool === 'erase' ? 'not-allowed' : 'crosshair';

  return (
    <div ref={containerRef} className="w-full">
      <div className="rounded-lg overflow-hidden border border-[#2A3A4C]" style={{ cursor, touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={CW} height={CH}
          className="w-full block"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          data-testid="cad-canvas"
        />
      </div>
      <p className="text-slate-600 text-[9px] mt-1">
        Grid: 1кв = {scale}м | {els.filter(e => e.tool !== 'dimension').length} обекта | Touch: да
      </p>
    </div>
  );
};
