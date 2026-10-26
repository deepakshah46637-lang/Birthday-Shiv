/* =========================================
   Easy customization
========================================= */
const birthdayName = "Shiv Kumar Paswan";  // Change this to the birthday person's name

/* =========================================
   Element references
========================================= */
const book = document.getElementById('book');
const pages = Array.from(document.querySelectorAll('.page'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const currentPageText = document.getElementById('currentPageText');
const dotsContainer = document.getElementById('dots');
const wishBtn = document.getElementById('wishBtn');
const wishMessage = document.getElementById('wishMessage');
const cakeNote = document.getElementById('cakeNote');
const surpriseBtn = document.getElementById('surpriseBtn');
const celebrationLayer = document.getElementById('celebrationLayer');
const celebrationTitle = document.getElementById('celebrationTitle');
const closeOverlayBtn = document.getElementById('closeOverlayBtn');
const particlesContainer = document.getElementById('particles');
const heartsContainer = document.getElementById('floatingHearts');
const canvas = document.getElementById('celebrationCanvas');
const ctx = canvas.getContext('2d');

/* =========================================
   State
========================================= */
let currentPage = 0;
let wishMade = false;
let animationFrameId = null;
let confettiPieces = [];
let fireworks = [];
let overlayHearts = [];
let audioContext = null;
let musicGainNode = null;
let musicOscillators = [];
let musicTimer = null;
let fireworkTimer = null;

const lastPage = pages.length - 1;
const confettiColors = ['#ffd166', '#ff8fab', '#ffcad4', '#f4eac2', '#d94f70', '#fff5e8'];

/* =========================================
   Name injection
========================================= */
document.querySelectorAll('.birthday-name').forEach((el) => { el.textContent = birthdayName; });
celebrationTitle.textContent = `Happy Birthday, ${birthdayName} ❤️`;

/* =========================================
   Book navigation
========================================= */
pages.forEach((_, i) => {
  const dot = document.createElement('span');
  dot.className = 'dot';
  dotsContainer.appendChild(dot);
});
const dots = Array.from(dotsContainer.children);

function render() {
  pages.forEach((page, i) => {
    page.classList.toggle('is-active', i === currentPage);
    page.classList.toggle('is-before', i < currentPage);
    page.classList.toggle('is-after', i > currentPage);
    page.inert = i !== currentPage;
    page.setAttribute('aria-hidden', String(i !== currentPage));
  });

  dots.forEach((dot, i) => dot.classList.toggle('active', i === currentPage));
  document.body.classList.toggle('opened', currentPage > 0);

  currentPageText.textContent = currentPage === 0 ? 'Cover' : `Page ${currentPage} of ${lastPage}`;
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage === lastPage;
  nextBtn.textContent = currentPage === 0 ? 'Open ❯' : 'Next ❯';

  const content = pages[currentPage].querySelector('.page-content');
  if (content) content.scrollTop = 0;
}

function goTo(index) {
  const target = Math.max(0, Math.min(index, lastPage));
  if (target === currentPage) return;
  currentPage = target;
  render();
}

const nextPage = () => goTo(currentPage + 1);
const prevPage = () => goTo(currentPage - 1);

/* Cover: click or Enter/Space to open */
const cover = pages[0];
cover.addEventListener('click', () => { if (currentPage === 0) nextPage(); });
cover.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && currentPage === 0) {
    e.preventDefault();
    nextPage();
  }
});

/* Tap a non-interactive page to turn forward (pages 1-3 only) */
pages.forEach((page, index) => {
  if (index < 1 || index > 3) return;
  page.addEventListener('click', (e) => {
    if (e.target.closest('button, a')) return;
    if (window.getSelection && String(window.getSelection())) return;
    if (currentPage === index) nextPage();
  });
});

prevBtn.addEventListener('click', prevPage);
nextBtn.addEventListener('click', nextPage);

/* Swipe support */
let touchStartX = 0;
let touchStartY = 0;
book.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
  touchStartY = e.changedTouches[0].clientY;
}, { passive: true });
book.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0) nextPage(); else prevPage();
  }
}, { passive: true });

/* =========================================
   Realistic 3-tier cake (inline SVG)
========================================= */
function cakeSVG(uid, candleCount, isMain) {
  const id = (s) => `${uid}-${s}`;
  const f = (v) => v.toFixed(1);
  const sponge = ['#f48aa8', '#f7a1b9', '#fabccd'];
  const tiers = [
    { x: 38, w: 224, top: 205, bot: 292, lines: [0.28] },
    { x: 74, w: 152, top: 140, bot: 205, lines: [0.22, 0.85] },
    { x: 106, w: 88, top: 90, bot: 140, lines: [0.3] }
  ];
  const edgeY = (t, px) => t.top + (t.w * 0.1) * Math.sqrt(Math.max(0, 1 - ((px - 150) / (t.w / 2)) ** 2));

  const berry = (x, y, sc = 1) => `
    <g transform="translate(${f(x)} ${f(y)}) scale(${sc})">
      <path d="M0 -8 C-10 -8 -10 3 0 11 C10 3 10 -8 0 -8Z" fill="url(#${id('berry')})"/>
      <path d="M-6 -8 L0 -13 L6 -8 L2.5 -7 L0 -10 L-2.5 -7Z" fill="#3f9a4a"/>
      <circle cx="-3" cy="-2" r="0.9" fill="#ffe7a0"/><circle cx="3" cy="-1" r="0.9" fill="#ffe7a0"/>
      <circle cx="0" cy="3" r="0.9" fill="#ffe7a0"/><circle cx="-2" cy="6" r="0.8" fill="#ffe7a0"/>
      <ellipse cx="-3.5" cy="-4" rx="1.6" ry="2.6" fill="#fff" opacity=".35"/>
    </g>`;

  let s = `<svg viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Birthday cake"><defs>
    <linearGradient id="${id('shade')}" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#7a1a3a" stop-opacity=".38"/><stop offset=".22" stop-color="#7a1a3a" stop-opacity="0"/>
      <stop offset=".68" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#7a1a3a" stop-opacity=".42"/>
    </linearGradient>
    <linearGradient id="${id('cream')}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fffdf9"/><stop offset="1" stop-color="#ffe2ea"/></linearGradient>
    <linearGradient id="${id('plate')}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fbf3ea"/><stop offset="1" stop-color="#cdb097"/></linearGradient>
    <radialGradient id="${id('flame')}" cx=".5" cy=".7" r=".65"><stop offset="0" stop-color="#fffde7"/><stop offset=".5" stop-color="#ffc247"/><stop offset="1" stop-color="#ff6b1e"/></radialGradient>
    <radialGradient id="${id('berry')}" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#ff7a8a"/><stop offset="1" stop-color="#c91f3d"/></radialGradient>
    <pattern id="${id('stripe')}" width="7" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
      <rect width="7" height="10" fill="#fff4dc"/><rect width="7" height="5" fill="#ff8db0"/></pattern>
    <filter id="${id('blur')}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <ellipse cx="150" cy="327" rx="150" ry="10" fill="rgba(0,0,0,.3)" filter="url(#${id('blur')})"/>
  <ellipse cx="150" cy="306" rx="144" ry="24" fill="url(#${id('plate')})"/>
  <ellipse cx="150" cy="302" rx="132" ry="19" fill="#fff8ef" opacity=".7"/>`;

  tiers.forEach((t, i) => {
    const rx = t.w / 2, ry = t.w * 0.1, xr = t.x + t.w;
    const body = `M${t.x} ${t.top} L${t.x} ${t.bot} A${rx} ${ry} 0 0 0 ${xr} ${t.bot} L${xr} ${t.top}Z`;
    s += `<path d="${body}" fill="${sponge[i]}"/><path d="${body}" fill="url(#${id('shade')})"/>`;
    t.lines.forEach((fr) => {
      const y = t.top + (t.bot - t.top) * fr;
      s += `<path d="M${t.x} ${f(y)} A${rx} ${ry} 0 0 0 ${xr} ${f(y)}" fill="none" stroke="#fff6ee" stroke-width="5" stroke-linecap="round"/>`;
    });
    if (i === 0) {
      for (let k = 0; k < 14; k += 1) {
        const px = 48 + k * (204 / 13);
        const py = t.bot + ry * Math.sqrt(Math.max(0, 1 - ((px - 150) / rx) ** 2)) - 2;
        s += `<circle cx="${f(px)}" cy="${f(py)}" r="4.3" fill="#fffaf5" stroke="#f1b9c7" stroke-width=".8"/>`;
      }
      s += `<text x="150" y="272" text-anchor="middle" font-family="'Great Vibes', cursive" font-size="27" fill="#fffaf2" stroke="#b5314f" stroke-width="1" paint-order="stroke">Happy Birthday</text>`;
    }
    if (i === 1) {
      const gy = t.top + (t.bot - t.top) * 0.55;
      s += `<path d="M${t.x} ${f(gy)} A${rx} ${ry} 0 0 0 ${xr} ${f(gy)}" fill="none" stroke="#f0c66b" stroke-width="5"/>`;
      s += `<path d="M${t.x} ${f(gy)} A${rx} ${ry} 0 0 0 ${xr} ${f(gy)}" fill="none" stroke="#fff3c9" stroke-width="1.4" stroke-dasharray="1 7" stroke-linecap="round"/>`;
    }
    if (i === 2) {
      s += `<path d="M150 117 C150 112 143 111 143 116 C143 120 150 124 150 127 C150 124 157 120 157 116 C157 111 150 112 150 117Z" fill="#fff" opacity=".92"/>`;
    }
    s += `<ellipse cx="150" cy="${t.top}" rx="${rx}" ry="${ry}" fill="url(#${id('cream')})" stroke="#f3c9d3" stroke-width=".8"/>`;
    s += `<path d="M${t.x} ${t.top} A${rx} ${ry} 0 0 0 ${xr} ${t.top}" fill="none" stroke="#fff6f8" stroke-width="13" stroke-linecap="round"/>`;
    const nd = Math.round(t.w / 17);
    for (let k = 0; k < nd; k += 1) {
      const cx = t.x + 9 + (t.w - 18) * k / (nd - 1);
      const len = 7 + ((k * 37 + i * 11) % 4) * 4;
      s += `<rect x="${f(cx - 4.5)}" y="${f(edgeY(t, cx) - 3)}" width="9" height="${len + 3}" rx="4.5" fill="#fff6f8"/>`;
    }
  });

  [[56, 0], [244, 0], [98, 1], [202, 1]].forEach(([x, ti]) => {
    s += berry(x, edgeY(tiers[ti], x) - 4 - (ti ? 0 : 1), ti ? 0.85 : 1);
  });

  const spread = candleCount >= 5 ? 18 : 20;
  const mid = (candleCount - 1) / 2;
  s += `<g ${isMain ? 'id="candles"' : ''}>`;
  for (let k = 0; k < candleCount; k += 1) {
    const dx = (k - mid) * spread;
    const cx = 150 + dx;
    const by = 91 + 4 * Math.sqrt(Math.max(0, 1 - (dx / 44) ** 2));
    const y0 = by - 34;
    s += `<g class="candle-svg">
      <rect x="${f(cx - 3.5)}" y="${f(y0)}" width="7" height="36" rx="3" fill="url(#${id('stripe')})" stroke="#e7b9a4" stroke-width=".5"/>
      <rect x="${f(cx - 0.6)}" y="${f(y0 - 3)}" width="1.2" height="4" fill="#5a2434"/>
      <g class="sflame" style="animation-delay:${(k * 0.15).toFixed(2)}s">
        <circle cx="${f(cx)}" cy="${f(y0 - 10)}" r="11" fill="#ffc247" opacity=".28"/>
        <path d="M${f(cx)} ${f(y0 - 22)} C${f(cx + 7)} ${f(y0 - 12)} ${f(cx + 5)} ${f(y0 - 2)} ${f(cx)} ${f(y0 - 2)} C${f(cx - 5)} ${f(y0 - 2)} ${f(cx - 7)} ${f(y0 - 12)} ${f(cx)} ${f(y0 - 22)}Z" fill="url(#${id('flame')})"/>
      </g>
      <path class="smoke" d="M${f(cx)} ${f(y0 - 4)} q-5 -8 0 -14 q5 -6 0 -14" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2" stroke-linecap="round"/>
    </g>`;
  }
  s += `</g></svg>`;
  return s;
}

document.querySelectorAll('.cake[data-candles]').forEach((el, i) => {
  el.innerHTML = cakeSVG(`ck${i}`, Number(el.dataset.candles) || 3, el.id === 'birthdayCake');
});

/* =========================================
   Calendar: Kartik 2083 BS (Kartik 1 = Sunday, Oct 18 2026, 30 days)
========================================= */
(function buildCalendar() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  const birthdayDay = 12;
  const startWeekday = 0;            // Sunday
  const totalDays = 30;
  const startAD = new Date(2026, 9, 18); // Oct 18, 2026

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((d) => {
    const h = document.createElement('div');
    h.className = 'cal-dow';
    h.textContent = d;
    grid.appendChild(h);
  });

  for (let i = 0; i < startWeekday; i += 1) {
    const e = document.createElement('div');
    e.className = 'cal-cell empty';
    grid.appendChild(e);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const ad = new Date(startAD);
    ad.setDate(startAD.getDate() + day - 1);
    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (day === birthdayDay ? ' birthday' : '');
    const adLabel = ad.getDate() === 1
      ? ad.toLocaleString('en', { month: 'short' }) + ' 1'
      : String(ad.getDate());
    cell.innerHTML = `<span class="bs">${day}</span><span class="ad">${adLabel}</span>` +
      (day === birthdayDay ? '<span class="cal-heart">❤️</span>' : '');
    if (day === birthdayDay) cell.setAttribute('aria-label', `Kartik 12, birthday of ${birthdayName}`);
    grid.appendChild(cell);
  }
})();

/* =========================================
   Photos: show heart placeholder until loaded
========================================= */
document.querySelectorAll('.photo-frame').forEach((frame) => {
  const img = frame.querySelector('img');
  const markLoaded = () => frame.classList.add('loaded');
  const markFailed = () => { img.style.display = 'none'; };
  if (img.complete && img.naturalWidth > 0) markLoaded();
  img.addEventListener('load', markLoaded);
  img.addEventListener('error', markFailed);
});

/* =========================================
   Background particles / hearts
========================================= */
function createBackgroundParticles() {
  const small = window.innerWidth < 768;
  const particleCount = small ? 22 : 38;
  const heartCount = small ? 10 : 16;

  particlesContainer.innerHTML = '';
  heartsContainer.innerHTML = '';

  for (let i = 0; i < particleCount; i += 1) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = '100%';
    p.style.animationDuration = `${9 + Math.random() * 10}s`;
    p.style.animationDelay = `${-Math.random() * 14}s`;
    particlesContainer.appendChild(p);
  }

  for (let i = 0; i < heartCount; i += 1) {
    const h = document.createElement('span');
    h.className = 'heart';
    h.style.left = `${Math.random() * 100}%`;
    h.style.top = '100%';
    h.style.animationDuration = `${11 + Math.random() * 12}s`;
    h.style.animationDelay = `${-Math.random() * 18}s`;
    h.style.opacity = '0.5';
    heartsContainer.appendChild(h);
  }
}

/* =========================================
   Cake wish
========================================= */
function createSparkleBurst(x, y) {
  const burst = document.createElement('div');
  burst.className = 'sparkle-burst';
  for (let i = 0; i < 24; i += 1) {
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty('--x', `${(Math.random() - 0.5) * 240}px`);
    s.style.setProperty('--y', `${(Math.random() - 0.5) * 240}px`);
    s.style.animationDelay = `${Math.random() * 0.1}s`;
    burst.appendChild(s);
  }
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1500);
}

function handleWish() {
  if (wishMade) return;
  wishMade = true;

  document.querySelectorAll('#candles .sflame').forEach((flame, i) => {
    setTimeout(() => flame.classList.add('out'), i * 120);
  });

  wishMessage.classList.remove('hidden');
  cakeNote.textContent = 'May every part of it come true. Turn the page when you are ready ❯';
  wishBtn.textContent = 'Wish Sent ❤️';
  wishBtn.disabled = true;

  const rect = document.getElementById('birthdayCake').getBoundingClientRect();
  createSparkleBurst(rect.left + rect.width / 2, rect.top + rect.height / 3);
}

/* =========================================
   Celebration canvas
========================================= */
function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

const rand = (min, max) => Math.random() * (max - min) + min;

function createConfetti(count = 140) {
  confettiPieces = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: -Math.random() * window.innerHeight,
    size: rand(5, 12),
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    speedY: rand(2, 5.5),
    speedX: rand(-1.5, 1.5),
    rotation: rand(0, Math.PI * 2),
    rotationSpeed: rand(-0.08, 0.08),
    shape: Math.random() > 0.5 ? 'rect' : 'circle'
  }));
}

function spawnFirework() {
  fireworks.push({
    type: 'rocket',
    x: rand(window.innerWidth * 0.15, window.innerWidth * 0.85),
    y: window.innerHeight + 20,
    targetX: rand(window.innerWidth * 0.12, window.innerWidth * 0.88),
    targetY: rand(window.innerHeight * 0.12, window.innerHeight * 0.45),
    speed: rand(5, 8),
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
  });
}

function explodeFirework(x, y, color) {
  const n = 26;
  for (let i = 0; i < n; i += 1) {
    const angle = (Math.PI * 2 * i) / n;
    const speed = rand(1.5, 5);
    fireworks.push({
      type: 'particle', x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      alpha: 1, decay: rand(0.012, 0.02), radius: rand(2, 4), color
    });
  }
}

function createOverlayHearts(count = 16) {
  overlayHearts = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: window.innerHeight + Math.random() * window.innerHeight,
    size: rand(14, 30),
    speed: rand(0.5, 1.4),
    drift: rand(-0.4, 0.4),
    alpha: rand(0.2, 0.5)
  }));
}

function drawHeart(x, y, size, alpha) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ff8fab';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.45);
  ctx.bezierCurveTo(-s * 1.2, -s * 0.2, -s * 0.7, -s * 1.1, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.7, -s * 1.1, s * 1.2, -s * 0.2, 0, s * 0.45);
  ctx.fill();
  ctx.restore();
}

function updateAndDrawConfetti() {
  confettiPieces.forEach((p) => {
    p.x += p.speedX;
    p.y += p.speedY;
    p.rotation += p.rotationSpeed;
    if (p.y > window.innerHeight + 20) {
      p.y = -20;
      p.x = Math.random() * window.innerWidth;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    if (p.shape === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function updateAndDrawFireworks() {
  fireworks = fireworks.filter((item) => {
    if (item.type === 'rocket') {
      const dx = item.targetX - item.x;
      const dy = item.targetY - item.y;
      const dist = Math.hypot(dx, dy);
      if (dist < item.speed) {
        explodeFirework(item.targetX, item.targetY, item.color);
        return false;
      }
      item.x += (dx / dist) * item.speed;
      item.y += (dy / dist) * item.speed;
      ctx.save();
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return true;
    }

    item.x += item.vx;
    item.y += item.vy;
    item.vy += 0.02;
    item.alpha -= item.decay;
    if (item.alpha <= 0) return false;

    ctx.save();
    ctx.globalAlpha = item.alpha;
    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return true;
  });
}

function updateAndDrawOverlayHearts() {
  overlayHearts.forEach((h) => {
    h.y -= h.speed;
    h.x += h.drift;
    if (h.y < -30) {
      h.y = window.innerHeight + 20;
      h.x = Math.random() * window.innerWidth;
    }
    drawHeart(h.x, h.y, h.size, h.alpha);
  });
}

function animateCelebration() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  updateAndDrawConfetti();
  updateAndDrawFireworks();
  updateAndDrawOverlayHearts();
  animationFrameId = requestAnimationFrame(animateCelebration);
}

function startCelebrationAnimations() {
  resizeCanvas();
  createConfetti();
  createOverlayHearts();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animateCelebration();
  spawnFirework();
  clearInterval(fireworkTimer);
  fireworkTimer = setInterval(spawnFirework, 900);
}

function stopCelebrationAnimations() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  clearInterval(fireworkTimer);
  fireworkTimer = null;
  fireworks = [];
  confettiPieces = [];
  overlayHearts = [];
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

/* =========================================
   Soft music (Web Audio, no files needed)
========================================= */
function stopMusic() {
  clearTimeout(musicTimer);
  musicTimer = null;
  musicOscillators.forEach((osc) => {
    try { osc.stop(); } catch (e) { /* already stopped */ }
  });
  musicOscillators = [];
  if (musicGainNode && audioContext) {
    const t = audioContext.currentTime;
    musicGainNode.gain.cancelScheduledValues(t);
    musicGainNode.gain.setValueAtTime(Math.max(musicGainNode.gain.value, 0.0001), t);
    musicGainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  }
}

function playTone(freq, startTime, duration, type, volume) {
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(musicGainNode);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
  musicOscillators.push(osc);
}

function startMusic() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (!audioContext) audioContext = new AC();
  if (audioContext.state === 'suspended') audioContext.resume();

  stopMusic();

  musicGainNode = audioContext.createGain();
  musicGainNode.gain.value = 0.18;
  musicGainNode.connect(audioContext.destination);

  const now = audioContext.currentTime + 0.05;
  const melody = [
    [523.25, 0.0, 0.55], [659.25, 0.6, 0.5], [783.99, 1.2, 0.6], [659.25, 1.9, 0.5],
    [698.46, 2.5, 0.6], [880.0, 3.2, 0.75], [783.99, 4.0, 0.7], [659.25, 4.8, 0.65],
    [698.46, 5.5, 0.55], [783.99, 6.1, 0.85]
  ];
  const bass = [
    [261.63, 0.0, 1.1], [196.0, 1.2, 1.0], [220.0, 2.5, 1.0], [174.61, 3.8, 1.0], [196.0, 5.1, 1.2]
  ];

  melody.forEach(([note, beat, dur]) => {
    playTone(note, now + beat, dur, 'triangle', 0.038);
    playTone(note * 0.5, now + beat, dur, 'sine', 0.012);
  });
  bass.forEach(([note, beat, dur]) => playTone(note, now + beat, dur, 'sine', 0.018));

  musicTimer = setTimeout(() => {
    if (celebrationLayer.classList.contains('show')) startMusic();
  }, 7400);
}

/* =========================================
   Surprise overlay
========================================= */
function openSurprise() {
  celebrationLayer.classList.add('show');
  document.body.classList.add('celebrating');
  startCelebrationAnimations();
  startMusic();
  closeOverlayBtn.focus({ preventScroll: true });
}

function closeSurprise() {
  celebrationLayer.classList.remove('show');
  document.body.classList.remove('celebrating');
  stopCelebrationAnimations();
  stopMusic();
  surpriseBtn.focus({ preventScroll: true });
}

wishBtn.addEventListener('click', handleWish);
surpriseBtn.addEventListener('click', openSurprise);
closeOverlayBtn.addEventListener('click', closeSurprise);
celebrationLayer.addEventListener('click', (e) => {
  if (e.target === celebrationLayer || e.target === canvas) closeSurprise();
});

window.addEventListener('resize', () => {
  createBackgroundParticles();
  if (celebrationLayer.classList.contains('show')) resizeCanvas();
});

window.addEventListener('keydown', (e) => {
  if (celebrationLayer.classList.contains('show')) {
    if (e.key === 'Escape') closeSurprise();
    return;
  }
  if (e.key === 'ArrowRight') nextPage();
  if (e.key === 'ArrowLeft') prevPage();
});

/* =========================================
   Init
========================================= */
createBackgroundParticles();
render();
