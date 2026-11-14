// Fond animé : étincelles dorées qui montent doucement
export function startSparkles(canvas) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let w, h, parts;

  const spawn = (y) => ({
    x: Math.random() * w, y: y ?? h + 10,
    r: 0.6 + Math.random() * 1.8,
    vy: 0.15 + Math.random() * 0.45,
    drift: Math.random() * Math.PI * 2,
    hue: Math.random() < 0.8 ? 45 : 195 // or ou bleu ciel
  });

  const resize = () => {
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: Math.round((w * h) / 18000) }, () => spawn(Math.random() * h));
  };

  const tick = (t) => {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.y -= p.vy;
      p.x += Math.sin(t / 1400 + p.drift) * 0.25;
      if (p.y < -10) Object.assign(p, spawn());
      const a = 0.35 + 0.35 * Math.sin(t / 500 + p.drift * 3);
      ctx.fillStyle = `hsla(${p.hue}, 95%, 75%, ${a})`;
      ctx.shadowColor = `hsla(${p.hue}, 95%, 65%, ${a})`;
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!document.hidden) requestAnimationFrame(tick);
  };

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => !document.hidden && requestAnimationFrame(tick));
  resize();
  requestAnimationFrame(tick);
}

// Petite explosion d'étincelles à un point (retour visuel sur action)
export function burst(x, y, n = 14) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'burst';
    s.textContent = '✦';
    const ang = (Math.PI * 2 * i) / n, dist = 30 + Math.random() * 30;
    s.style.cssText = `left:${x}px;top:${y}px;--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist}px`;
    document.body.append(s);
    s.addEventListener('animationend', () => s.remove());
  }
}
