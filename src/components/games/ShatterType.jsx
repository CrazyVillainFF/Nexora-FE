import React, { useEffect, useRef, useState } from 'react';

const ShatterType = ({ text = 'Make your mark', frontColor = '#f4f4fb', shardColor = '#9a6bff', size = 68, speed = 1, intensity = 0.8, shardSize = 22, reducedMotion = false }) => {
  const canvasRef = useRef(null);
  const glyphRef = useRef(null);
  const shardsRef = useRef([]);
  const scatterRef = useRef(0);
  const targetRef = useRef(0);
  const [shattered, setShattered] = useState(false);
  const toggle = () => {
    const next = targetRef.current < 0.5;
    targetRef.current = next ? 1 : 0;
    setShattered(next);
  };

  useEffect(() => {
    const options = { text, frontColor, shardColor, size, speed, intensity, shardSize, reducedMotion };
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return undefined;
    let width = 0; let height = 0; let ratio = 1; let frame = 0;
    const pointer = { x: -1000, y: -1000, active: false };

    const buildShards = () => {
      const bounds = canvas.getBoundingClientRect(); width = bounds.width; height = bounds.height;
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const glyph = document.createElement('canvas'); glyph.width = canvas.width; glyph.height = canvas.height;
      const g = glyph.getContext('2d'); g.setTransform(ratio, 0, 0, ratio, 0, 0);
      let fontSize = Math.max(18, Math.min(Number(options.size) || 68, width * 0.145, height * 0.34));
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const headline = options.text || 'Your headline';
      g.font = `800 ${fontSize}px system-ui, sans-serif`;
      while (fontSize > 18 && g.measureText(headline).width > width * 0.9) {
        fontSize -= 1;
        g.font = `800 ${fontSize}px system-ui, sans-serif`;
      }
      g.fillStyle = options.frontColor; g.fillText(headline, width / 2, height / 2, width * 0.92);
      glyphRef.current = glyph;
      const data = g.getImageData(0, 0, glyph.width, glyph.height);
      const cell = Math.max(15, Number(options.shardSize) || 22) * ratio;
      const shards = [];
      for (let y = 0; y < glyph.height; y += cell) {
        for (let x = 0; x < glyph.width; x += cell) {
          const w = Math.min(cell, glyph.width - x); const h = Math.min(cell, glyph.height - y);
          const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
          const diagonals = Math.random() > 0.5 ? [[0, 1, 2], [0, 2, 3]] : [[0, 1, 3], [1, 2, 3]];
          for (const indices of diagonals) {
            const points = indices.map((index) => corners[index]);
            let covered = false;
            const [pointA, pointB, pointC] = points;
            for (let u = 0; u <= 12 && !covered; u += 1) {
              for (let v = 0; v <= 12 - u; v += 1) {
                const fu = u / 12; const fv = v / 12;
                const px = Math.max(0, Math.min(glyph.width - 1, Math.floor(pointA[0] + (pointB[0] - pointA[0]) * fu + (pointC[0] - pointA[0]) * fv)));
                const py = Math.max(0, Math.min(glyph.height - 1, Math.floor(pointA[1] + (pointB[1] - pointA[1]) * fu + (pointC[1] - pointA[1]) * fv)));
                if (data.data[(py * glyph.width + px) * 4 + 3] > 20) { covered = true; break; }
              }
            }
            if (!covered) continue;
            const minX = Math.min(...points.map(([px]) => px)); const minY = Math.min(...points.map(([, py]) => py));
            const maxX = Math.max(...points.map(([px]) => px)); const maxY = Math.max(...points.map(([, py]) => py));
            const bitmap = document.createElement('canvas'); bitmap.width = Math.max(1, Math.ceil(maxX - minX)); bitmap.height = Math.max(1, Math.ceil(maxY - minY));
            const b = bitmap.getContext('2d');
            b.beginPath(); points.forEach(([px, py], index) => { const bx = px - minX; const by = py - minY; if (index === 0) b.moveTo(bx, by); else b.lineTo(bx, by); }); b.closePath(); b.clip(); b.drawImage(glyph, -minX, -minY);
            const cx = (minX + maxX) / 2 / ratio; const cy = (minY + maxY) / 2 / ratio;
            const vx = cx - width / 2; const vy = cy - height / 2; const theta = Math.atan2(vy, vx) + (Math.random() - 0.5) * 0.6;
            shards.push({ bitmap, x: minX / ratio, y: minY / ratio, w: bitmap.width / ratio, h: bitmap.height / ratio, cx, cy, distance: 34 + Math.random() * 78, direction: theta, rotation: (Math.random() - 0.5) * 1.05, depth: Math.random(), tint: Math.random() > 0.72 });
          }
        }
      }
      shardsRef.current = shards;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const motion = reducedMotion ? (targetRef.current ? 1 : 0) : scatterRef.current + (targetRef.current - scatterRef.current) * Math.min(0.24, 0.045 * Number(options.speed || 1));
      scatterRef.current = Math.abs(targetRef.current - motion) < 0.001 ? targetRef.current : motion;
      const baseAlpha = Math.max(0, 1 - scatterRef.current * 5) * (pointer.active ? 0.08 : 1);
      if (glyphRef.current && baseAlpha > 0) {
        ctx.globalAlpha = baseAlpha; ctx.drawImage(glyphRef.current, 0, 0, width, height); ctx.globalAlpha = 1;
      }
      for (const shard of shardsRef.current) {
        if (scatterRef.current < 0.002 && !pointer.active) continue;
        const distance = Math.hypot(shard.cx - pointer.x, shard.cy - pointer.y);
        const cursorPush = pointer.active && distance < 94 ? (1 - distance / 94) * 13 * Number(options.intensity || 0.8) : 0;
        const ease = scatterRef.current * scatterRef.current * (3 - 2 * scatterRef.current);
        const dx = Math.cos(shard.direction) * shard.distance * ease + (distance ? (shard.cx - pointer.x) / distance * cursorPush : 0);
        const dy = Math.sin(shard.direction) * shard.distance * ease + (distance ? (shard.cy - pointer.y) / distance * cursorPush : 0) + shard.depth * 65 * ease * ease - shard.depth * 12 * ease;
        const rotation = shard.rotation * ease;
        ctx.save(); ctx.translate(shard.cx + dx, shard.cy + dy); ctx.rotate(rotation);
        ctx.globalAlpha = 1 - ease * (0.22 + shard.depth * 0.25);
        if (shard.tint) { ctx.shadowColor = options.shardColor; ctx.shadowBlur = 3 + ease * Number(options.intensity || 0.8) * 12; }
        ctx.drawImage(shard.bitmap, -shard.w / 2 - 0.35, -shard.h / 2 - 0.35, shard.w + 0.7, shard.h + 0.7);
        if (ease > 0.02 && shard.tint) {
          ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = ease * 0.65;
          ctx.fillStyle = options.shardColor; ctx.beginPath(); ctx.moveTo(-shard.w / 2, -shard.h / 2); ctx.lineTo(shard.w / 2, -shard.h / 2); ctx.lineTo(-shard.w / 2, shard.h / 2); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      frame = requestAnimationFrame(draw);
    };

    const move = (event) => { const rect = canvas.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; pointer.active = true; };
    const leave = () => { pointer.active = false; };
    const hit = (event) => { if (event.target.closest('button')) return; toggle(); };
    const observer = new ResizeObserver(buildShards); observer.observe(canvas); buildShards(); draw();
    canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('pointerdown', hit);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('pointerdown', hit); };
  }, [text, frontColor, shardColor, size, speed, intensity, shardSize, reducedMotion]);

  return <div className="satisfied-shatter-wrap"><canvas ref={canvasRef} aria-label={`Interactive glass-shard headline: ${text}`} /><span className="satisfied-shatter__full-text">{text}</span><button type="button" className="satisfied-shatter__toggle" onClick={toggle} aria-label={shattered ? 'Reassemble headline' : 'Shatter headline'}>{shattered ? 'Reassemble' : 'Shatter'}</button></div>;
};

export default ShatterType;
