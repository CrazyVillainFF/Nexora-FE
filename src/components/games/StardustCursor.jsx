import React, { useEffect, useRef } from 'react';

const StardustCursor = ({ color = '#B497CF', secondColor = '#9a6bff', speed = 1, density = 1, size = 2.4, intensity = 1, trailLength = 50, puffSize = 1, softness = 0.7, drift = 0.5, reducedMotion = false }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const options = { color, secondColor, speed, density, size, intensity, trailLength, puffSize, softness, drift, reducedMotion };
    const canvas = canvasRef.current; const ctx = canvas?.getContext('2d', { alpha: true });
    if (!canvas || !ctx) return undefined;
    let width = 0; let height = 0; let frame = 0; let lastSpawn = 0;
    const motes = [];
    const pointer = { x: -100, y: -100, px: -100, py: -100, vx: 0, vy: 0, active: false, t: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const emit = (x, y, vx, vy, puff = false, radius = null) => {
      if (motes.length >= 1800) motes.splice(0, 80);
      motes.push({ x, y, ox: x, oy: y, vx, vy, age: 0, life: puff ? 58 + Math.random() * 62 : Number(options.trailLength || 50) + Math.random() * 28, radius: radius || (0.45 + Math.random() * Number(options.size || 2.4)), phase: Math.random(), phase2: Math.random() * Math.PI * 2, puff });
    };
    const wake = (x, y, vx, vy, amount) => {
      const d = Math.max(0.01, Math.hypot(vx, vy)); const ux = vx / d; const uy = vy / d; const px = -uy; const py = ux;
      const count = Math.min(12, Math.max(2, Math.ceil(amount * Number(options.density || 1) * 0.32)));
      for (let i = 0; i < count; i += 1) {
        const behind = Math.random() * 20; const spread = (Math.random() - 0.5) * (6 + Math.min(d, 18) * 0.8);
        const breeze = (Math.random() - 0.55) * Number(options.drift || 0.5);
        emit(x - ux * behind + px * spread, y - uy * behind + py * spread,
          -ux * (0.25 + Math.random() * 0.65) * Number(options.speed || 1) + px * breeze,
          -uy * (0.25 + Math.random() * 0.65) * Number(options.speed || 1) + py * breeze - 0.04);
      }
    };
    const mushroomPuff = (x, y) => {
      const scale = Number(options.puffSize || 1); const count = Math.round(145 * Number(options.density || 1));
      for (let i = 0; i < count; i += 1) {
        if (i < count * 0.32) {
          const t = Math.random(); const side = Math.random() > 0.5 ? 1 : -1;
          const stemX = (Math.random() - 0.5) * 10 * scale;
          const stemY = -Math.random() * 57 * scale;
          emit(x + stemX, y + stemY, side * (0.12 + t * 0.62) * scale, -0.5 - Math.random() * 1.15 * scale, true, 0.55 + Math.random() * 1.4);
        } else {
          const a = Math.PI + Math.random() * Math.PI;
          const u = Math.cos(a); const v = Math.sin(a);
          const capWidth = (17 + Math.random() * 26) * scale;
          const capHeight = (9 + Math.random() * 15) * scale;
          const capX = x + u * capWidth;
          const capY = y - (43 * scale) + v * capHeight;
          emit(capX, capY, u * (0.5 + Math.random() * 2.2) * scale, -0.4 - Math.random() * 1.25 * scale, true, 0.55 + Math.random() * 1.75);
        }
      }
      emit(x, y - 4, 0, -0.1, true, 3.2 * scale);
    };

    const paint = (now) => {
      ctx.clearRect(0, 0, width, height);
      if (pointer.active && now - pointer.t < 120) {
        const dist = Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py);
        if (!options.reducedMotion && dist > 1 && now - lastSpawn > 5) {
          const steps = Math.min(8, Math.max(1, Math.ceil(dist / 12)));
          for (let step = 1; step <= steps; step += 1) {
            const t = step / steps;
            wake(pointer.px + (pointer.x - pointer.px) * t, pointer.py + (pointer.y - pointer.py) * t, pointer.vx, pointer.vy, dist / steps);
          }
          lastSpawn = now;
        }
      }
      ctx.globalCompositeOperation = 'lighter';
      for (let i = motes.length - 1; i >= 0; i -= 1) {
        const mote = motes[i]; mote.age += 1;
        const progress = mote.age / mote.life;
        if (progress >= 1) { motes.splice(i, 1); continue; }
        mote.vx = mote.vx * (mote.puff ? 0.982 : 0.968) + Math.sin(mote.age * 0.075 + mote.phase2) * 0.018;
        mote.vy = mote.vy * 0.985 + (mote.puff ? 0.012 : 0.02);
        mote.x += mote.vx; mote.y += mote.vy;
        const twinkle = 0.62 + Math.sin(mote.age * 0.14 + mote.phase2) * 0.28;
        ctx.globalAlpha = Math.min(1, (1 - progress) * Math.min(1, mote.age / 5) * twinkle * Number(options.intensity || 1));
        ctx.fillStyle = mote.phase > 0.55 ? options.secondColor : options.color;
        const radius = mote.radius * (mote.puff ? 1 - progress * 0.28 : 0.58 + progress * 0.38);
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = (mote.puff ? 5 : 3.5) * Number(options.intensity || 1) * Number(options.softness || 0.7);
        ctx.beginPath(); ctx.arc(mote.x, mote.y, Math.max(0.35, radius), 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      frame = requestAnimationFrame(paint);
    };

    const point = (event) => { const rect = canvas.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const move = (event) => {
      const p = point(event); const now = performance.now();
      if (pointer.x < 0 || pointer.y < 0) {
        pointer.px = p.x; pointer.py = p.y; pointer.vx = 0; pointer.vy = 0;
      } else {
        pointer.px = pointer.x; pointer.py = pointer.y;
        const dt = Math.max(8, now - pointer.t); const targetVx = (p.x - pointer.px) / dt * 16; const targetVy = (p.y - pointer.py) / dt * 16;
        pointer.vx += (targetVx - pointer.vx) * 0.42; pointer.vy += (targetVy - pointer.vy) * 0.42;
      }
      pointer.x = p.x; pointer.y = p.y; pointer.t = now; pointer.active = true;
    };
    const down = (event) => { const p = point(event); mushroomPuff(p.x, p.y); pointer.x = p.x; pointer.y = p.y; pointer.t = performance.now(); pointer.active = true; };
    const leave = () => { pointer.active = false; };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize(); paint(performance.now());
    canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointerleave', leave);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointerleave', leave); };
  }, [color, secondColor, speed, density, size, intensity, trailLength, puffSize, softness, drift, reducedMotion]);

  return <div className="satisfied-stardust"><canvas ref={canvasRef} aria-label="Move or touch to stir the stardust; press to create a mushroom-shaped puff" /><span>Move to form a soft, flowing dust wake. Click or tap to bloom a puff.</span></div>;
};

export default StardustCursor;
