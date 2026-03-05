// TemaDom IA CAD v5.2 — Professional 2D Canvas with Handle Manipulation
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GRID, CW, CH, OBJ_COLORS } from './constants';
import { snapEndpoint } from './utils';

const HANDLE_R = 7;

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

function drawHandle(ctx, x, y, color, isActive) {
  const r = isActive ? HANDLE_R + 2 : HANDLE_R;
  // Glow ring
  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, Math.PI * 2);
  ctx.fillStyle = color + '25';
  ctx.fill();
  // Main circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? color : color + 'DD';
  ctx.fill();
  // White center dot
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF';
  ctx.fill();
}

function drawElement(ctx, el, sel, sc) {
  const col = sel ? '#FF8C42' : OBJ_COLORS[el.tool] || '#888';
  ctx.strokeStyle = col; ctx.fillStyle = col;

  if (el.tool === 'circle') {
    ctx.lineWidth = 3; ctx.beginPath();
    ctx.arc(el.cx, el.cy, el.r || 1, 0, Math.PI * 2); ctx.stroke();
    const diam = ((el.r || 0) * 2 / GRID * sc).toFixed(1);
    ctx.font = '11px monospace'; ctx.fillText(`R${diam}м`, el.cx + (el.r || 0) + 6, el.cy - 4);
    return;
  }
  if (el.tool === 'column') {
    if (el.columnShape === 'rect') {
      const cw = ((el.columnWidth || 30) / 100) / sc * GRID;
      const cl = ((el.columnLength || 30) / 100) / sc * GRID;
      const hw = Math.max(cw, 6), hl = Math.max(cl, 6);
      ctx.lineWidth = 2;
      ctx.strokeRect(el.x1 - hw / 2, el.y1 - hl / 2, hw, hl);
      ctx.fillStyle = sel ? '#FF8C4240' : '#9b59b620';
      ctx.fillRect(el.x1 - hw / 2, el.y1 - hl / 2, hw, hl);
      ctx.setLineDash([2, 2]); ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(el.x1 - hw / 2, el.y1 - hl / 2); ctx.lineTo(el.x1 + hw / 2, el.y1 + hl / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(el.x1 + hw / 2, el.y1 - hl / 2); ctx.lineTo(el.x1 - hw / 2, el.y1 + hl / 2); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const r = ((el.columnDiameter || 30) / 100) / sc * GRID / 2;
      ctx.lineWidth = 2; ctx.beginPath();
      ctx.arc(el.x1, el.y1, Math.max(r, 6), 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(el.x1, el.y1, 2, 0, Math.PI * 2); ctx.fill();
      ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(el.x1 - Math.max(r, 6), el.y1); ctx.lineTo(el.x1 + Math.max(r, 6), el.y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(el.x1, el.y1 - Math.max(r, 6)); ctx.lineTo(el.x1, el.y1 + Math.max(r, 6)); ctx.stroke();
      ctx.setLineDash([]);
    }
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
    ctx.font = 'bold 11px monospace'; ctx.fillText(`${el.roofAngle || 30}deg`, mx + 8, my - 8);
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 20) {
      const nx = -(y2 - y1) / len * 15, ny = (x2 - x1) / len * 15;
      ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(mx + nx, my + ny); ctx.lineTo(x2, y2); ctx.stroke();
    }
  } else if (el.tool === 'door') {
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 8) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(x1, y1, len, angle - Math.PI / 2, angle); ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (el.tool === 'window') {
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
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
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 6, y2 - 6); ctx.moveTo(x2, y2); ctx.lineTo(x2 + 6, y2 - 6); ctx.stroke();
  } else if (el.tool === 'dimension') {
    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
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
}

function drawHandlesForSelected(ctx, el, dragMode) {
  if (!el) return;

  if (el.tool === 'circle') {
    drawHandle(ctx, el.cx, el.cy, '#4DA6FF', dragMode === 'whole');
    return;
  }
  if (el.tool === 'column') {
    drawHandle(ctx, el.x1, el.y1, '#4DA6FF', dragMode === 'whole');
    return;
  }

  const x1 = el.x1, y1 = el.y1, x2 = el.x2 ?? el.x1, y2 = el.y2 ?? el.y1;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;

  // Red endpoint handles
  drawHandle(ctx, x1, y1, '#FF4444', dragMode === 'p1');
  drawHandle(ctx, x2, y2, '#FF4444', dragMode === 'p2');

  // Blue center handle
  drawHandle(ctx, cx, cy, '#4DA6FF', dragMode === 'whole');

  // Green rotation handle (perpendicular to element)
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const rotX = cx + (-Math.sin(angle)) * 28;
  const rotY = cy + Math.cos(angle) * 28;
  ctx.strokeStyle = '#28A74560';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(rotX, rotY); ctx.stroke();
  ctx.setLineDash([]);
  drawHandle(ctx, rotX, rotY, '#28A745', dragMode === 'rotate');
}

function renderAll(ctx, els, draft, selIdx, sc, distLines, dragInfo) {
  renderGrid(ctx, ctx.canvas.width, ctx.canvas.height);

  // Ghost of original position during drag
  if (dragInfo && dragInfo.origEl && dragInfo.idx >= 0) {
    ctx.save(); ctx.globalAlpha = 0.2;
    drawElement(ctx, dragInfo.origEl, false, sc);
    ctx.restore();
  }

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

  // Distance lines
  if (distLines?.length) {
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

  // Handles on selected element (drawn LAST = on top)
  if (selIdx >= 0 && els[selIdx]) {
    drawHandlesForSelected(ctx, els[selIdx], dragInfo?.mode || null);
  }

  // Live dimension label during drag
  if (dragInfo?.idx >= 0 && els[dragInfo.idx]) {
    const el = els[dragInfo.idx];
    if (el.x1 != null && el.x2 != null && el.tool !== 'column' && el.tool !== 'circle') {
      const len = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
      const m = (len / GRID * sc).toFixed(2);
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px monospace';
      ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
      ctx.fillText(`${m}м`, (el.x1 + el.x2) / 2 + 12, (el.y1 + el.y2) / 2 - 18);
      ctx.restore();
    }
  }
}

// Detect which handle is at position (exported for use in AISketchPage)
export function detectHandle(x, y, el) {
  if (!el) return null;
  const HR = 14;

  if (el.tool === 'circle') {
    return Math.hypot(x - el.cx, y - el.cy) < HR ? 'center' : null;
  }
  if (el.tool === 'column') {
    return Math.hypot(x - el.x1, y - el.y1) < HR ? 'center' : null;
  }

  const x1 = el.x1, y1 = el.y1, x2 = el.x2 ?? el.x1, y2 = el.y2 ?? el.y1;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;

  // Rotation handle (perpendicular offset)
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const rotX = cx + (-Math.sin(angle)) * 28;
  const rotY = cy + Math.cos(angle) * 28;
  if (Math.hypot(x - rotX, y - rotY) < HR) return 'rotate';

  // Endpoints (higher priority than center)
  if (Math.hypot(x - x1, y - y1) < HR) return 'p1';
  if (Math.hypot(x - x2, y - y2) < HR) return 'p2';

  // Center
  if (Math.hypot(x - cx, y - cy) < HR) return 'center';

  return null;
}

export const CADCanvas = ({ els, selIdx, tool, scale, draft, distLines, dragInfo, onDown, onMove, onUp, onDoubleClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredHandle, setHoveredHandle] = useState(null);

  // Render loop
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let raf;
    const frame = () => {
      renderAll(ctx, els, draft, selIdx, scale, distLines, dragInfo);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [els, draft, selIdx, scale, distLines, dragInfo]);

  // Raw canvas coords (no snapping) — for select/drag
  const getRawPos = useCallback((clientX, clientY) => {
    const r = canvasRef.current.getBoundingClientRect();
    return [
      Math.round((clientX - r.left) * (CW / r.width)),
      Math.round((clientY - r.top) * (CH / r.height))
    ];
  }, []);

  // Snapped coords — for drawing tools
  const getSnappedPos = useCallback((clientX, clientY) => {
    const r = canvasRef.current.getBoundingClientRect();
    const x = (clientX - r.left) * (CW / r.width);
    const y = (clientY - r.top) * (CH / r.height);
    return snapEndpoint(x, y, els);
  }, [els]);

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    const useRaw = tool === 'select' || tool === 'erase';
    const [x, y] = useRaw ? getRawPos(e.clientX, e.clientY) : getSnappedPos(e.clientX, e.clientY);
    onDown(x, y, { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey });
  }, [getRawPos, getSnappedPos, onDown, tool]);

  const handleMouseMove = useCallback((e) => {
    const [rawX, rawY] = getRawPos(e.clientX, e.clientY);

    // Dragging: always raw coords
    if (dragInfo) {
      onMove(rawX, rawY, { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey });
      return;
    }

    // Hover detection for cursor
    if (tool === 'select' && selIdx >= 0 && els[selIdx]) {
      const h = detectHandle(rawX, rawY, els[selIdx]);
      if (h !== hoveredHandle) setHoveredHandle(h);
    } else if (hoveredHandle) {
      setHoveredHandle(null);
    }

    // Drawing mode
    if (draft) {
      const [x, y] = getSnappedPos(e.clientX, e.clientY);
      onMove(x, y, { shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey });
    }
  }, [getRawPos, getSnappedPos, onMove, dragInfo, tool, selIdx, els, draft, hoveredHandle]);

  const handleMouseUp = useCallback(() => { onUp(); }, [onUp]);

  const handleDblClick = useCallback((e) => {
    if (!onDoubleClick) return;
    const [x, y] = getRawPos(e.clientX, e.clientY);
    onDoubleClick(x, y);
  }, [getRawPos, onDoubleClick]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const t = e.touches[0];
    const useRaw = tool === 'select' || tool === 'erase';
    const [x, y] = useRaw ? getRawPos(t.clientX, t.clientY) : getSnappedPos(t.clientX, t.clientY);
    onDown(x, y, { shift: false, ctrl: false });
  }, [getRawPos, getSnappedPos, onDown, tool]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const t = e.touches[0];
    if (dragInfo) {
      const [x, y] = getRawPos(t.clientX, t.clientY);
      onMove(x, y, { shift: false, ctrl: false });
    } else if (draft) {
      const [x, y] = getSnappedPos(t.clientX, t.clientY);
      onMove(x, y, { shift: false, ctrl: false });
    }
  }, [getRawPos, getSnappedPos, onMove, dragInfo, draft]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    onUp();
  }, [onUp]);

  // Cursor logic
  let cursor = 'crosshair';
  if (tool === 'select') {
    if (dragInfo) cursor = 'grabbing';
    else if (hoveredHandle === 'p1' || hoveredHandle === 'p2') cursor = 'grab';
    else if (hoveredHandle === 'center') cursor = 'move';
    else if (hoveredHandle === 'rotate') cursor = 'alias';
    else cursor = 'default';
  } else if (tool === 'erase') cursor = 'not-allowed';

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
          onDoubleClick={handleDblClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          data-testid="cad-canvas"
        />
      </div>
      <p className="text-slate-600 text-[9px] mt-1">
        Grid: 1кв = {scale}м | {els.filter(e => e.tool !== 'dimension').length} обекта | Shift: ортогонално | Ctrl: прецизно (0.1м)
      </p>
    </div>
  );
};
