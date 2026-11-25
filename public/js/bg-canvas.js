(function initInteractiveBackground() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const mouse = { x: width / 2, y: height / 2, active: false };
  const PARTICLE_COUNT = Math.min(55, Math.floor((width * height) / 24000));
  const COLORS = ['rgba(56, 189, 248, ', 'rgba(129, 140, 248, ', 'rgba(244, 114, 182, '];

  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    radius: 1.5 + Math.random() * 2.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: 0.35 + Math.random() * 0.45,
  }));

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  let angle = 0;

  function drawOpticalRings() {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const baseR = Math.min(width, height) * 0.34;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([12, 18]);
    ctx.beginPath();
    ctx.arc(0, 0, baseR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(-angle * 1.8);
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
    ctx.setLineDash([6, 24]);
    ctx.beginPath();
    ctx.arc(0, 0, baseR * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    angle += 0.0012;
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    drawOpticalRings();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      // Gentle cursor repulsion/attraction shimmer
      if (mouse.active) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160 && dist > 1) {
          p.x -= (dx / dist) * 0.35;
          p.y -= (dy / dist) * 0.35;
        }
      }

      // Draw glowing node
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha})`;
      ctx.fill();

      // Connect nearby nodes
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(148, 163, 184, ${(1 - dist / 130) * 0.12})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
})();
