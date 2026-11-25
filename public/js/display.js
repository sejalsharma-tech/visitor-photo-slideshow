const socket = io();
const idleScreen = document.getElementById('idle-screen');
const container = document.getElementById('slideshow-container');
const ambientBackdrop = document.getElementById('ambient-backdrop');
const slideStage = document.getElementById('slide-stage');
const slideImg = document.getElementById('slide-img');
const visitorNameEl = document.getElementById('visitor-name');
const visitorCaptionEl = document.getElementById('visitor-caption');
const visitorBadgeEl = document.getElementById('visitor-badge');
const polaroidNameEl = document.getElementById('polaroid-name');
const polaroidCaptionEl = document.getElementById('polaroid-caption');
const progressFill = document.getElementById('progress-fill');
const queueStatus = document.getElementById('queue-status');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const pauseBtn = document.getElementById('pauseBtn');
const pauseLabel = document.getElementById('pauseLabel');
const nextBtn = document.getElementById('nextBtn');
const hideBtn = document.getElementById('hideBtn');
const soundBtn = document.getElementById('soundBtn');
const soundLabel = document.getElementById('soundLabel');
const reactionLayer = document.getElementById('reaction-layer');
const uploadUrlChip = document.getElementById('uploadUrlChip');
const qrCard = document.getElementById('qrCard');
const qrImage = document.getElementById('qrImage');

let priorityQueue = [];
let loopPool = [];
let loopIndex = 0;
let isPlaying = false;
let isPaused = false;
let soundEnabled = true;
let currentSlide = null;
let slideDurationMs = 5000;
let slideTimer = null;
let slideStartTime = 0;
let remainingMs = 5000;

// Web Audio API Two-Note Arrival Chime (Zero external audio files)
let audioCtx = null;
function unlockAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}
document.addEventListener('click', unlockAudio, { once: true });

function playArrivalChime() {
  if (!soundEnabled) return;
  try {
    unlockAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const notes = [523.25, 783.99]; // C5 -> G5 harmonic chime
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.55);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.6);
    });
  } catch {}
}

fetch('/api/config')
  .then((res) => res.json())
  .then((data) => {
    if (data.slideDurationMs) slideDurationMs = data.slideDurationMs;
    if (data.uploadUrl) uploadUrlChip.textContent = data.uploadUrl;
    if (data.qrDataUrl && qrImage) {
      qrImage.src = data.qrDataUrl;
      qrCard.style.display = 'flex';
    }
  })
  .catch(() => {
    uploadUrlChip.textContent = window.location.origin;
  });

socket.on('connect', () => {
  socket.emit('register-display');
});

// Host Controls: Fullscreen, Sound, Pause/Resume, Next, Hide Slide
fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundLabel.textContent = soundEnabled ? '🔔 Chime On' : '🔕 Muted';
  if (soundEnabled) playArrivalChime();
});

function togglePause() {
  if (!isPlaying) return;
  isPaused = !isPaused;
  pauseLabel.textContent = isPaused ? '▶ Resume' : '⏸ Pause';

  if (isPaused) {
    clearTimeout(slideTimer);
    const elapsed = Date.now() - slideStartTime;
    remainingMs = Math.max(400, remainingMs - elapsed);
    const computedWidth = getComputedStyle(progressFill).width;
    progressFill.style.transition = 'none';
    progressFill.style.width = computedWidth;
  } else {
    slideStartTime = Date.now();
    progressFill.style.transition = `width ${remainingMs}ms linear`;
    progressFill.style.width = '100%';
    slideTimer = setTimeout(playNext, remainingMs);
  }
  updateHud();
}

function hideCurrentSlide() {
  if (!currentSlide) return;
  const badUrl = currentSlide.url;
  priorityQueue = priorityQueue.filter((item) => item.url !== badUrl);
  loopPool = loopPool.filter((item) => item.url !== badUrl);
  if (loopIndex >= loopPool.length) loopIndex = 0;
  isPaused = false;
  pauseLabel.textContent = '⏸ Pause';
  playNext();
}

pauseBtn.addEventListener('click', togglePause);
nextBtn.addEventListener('click', () => {
  isPaused = false;
  pauseLabel.textContent = '⏸ Pause';
  playNext();
});
hideBtn.addEventListener('click', hideCurrentSlide);

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    togglePause();
  } else if (e.code === 'ArrowRight') {
    isPaused = false;
    pauseLabel.textContent = '⏸ Pause';
    playNext();
  } else if (e.key === 'h' || e.key === 'H') {
    hideCurrentSlide();
  }
});

function upsertIntoLoopPool(slide) {
  const existingIdx = loopPool.findIndex((item) => item.url === slide.url);
  if (existingIdx !== -1) {
    loopPool[existingIdx] = slide;
  } else {
    loopPool.push(slide);
    if (loopPool.length > 30) {
      loopPool.shift();
    }
  }
}

function updateHud() {
  if (isPaused) {
    queueStatus.textContent = 'PAUSED • Host control active';
  } else if (!isPlaying && priorityQueue.length === 0 && loopPool.length === 0) {
    queueStatus.textContent = 'LIVE • Waiting for uploads';
  } else if (priorityQueue.length > 0) {
    queueStatus.textContent = `LIVE • ${priorityQueue.length} new photo${priorityQueue.length > 1 ? 's' : ''} up next`;
  } else if (loopPool.length > 0) {
    queueStatus.textContent = `LIVE • Looping ${loopPool.length} photo${loopPool.length > 1 ? 's' : ''}`;
  } else {
    queueStatus.textContent = 'LIVE • Playing now';
  }
}

function enqueueBatch(batch, playSound = false) {
  batch.photos.forEach((photo) => {
    const slide = {
      visitorName: batch.visitorName,
      isReturning: batch.isReturning,
      url: photo.url,
      caption: photo.caption || '',
      frameStyle: photo.frameStyle || 'glass',
      isPrevious: photo.isPrevious,
    };
    priorityQueue.push(slide);
    upsertIntoLoopPool(slide);
  });
  if (playSound) playArrivalChime();
  updateHud();
  if (!isPlaying) {
    playNext();
  }
}

socket.on('seed-loop-pool', (slides) => {
  slides.forEach((slide) => upsertIntoLoopPool(slide));
  updateHud();
  if (!isPlaying && (priorityQueue.length > 0 || loopPool.length > 0)) {
    playNext();
  }
});

socket.on('sync-batches', (batches) => {
  batches.forEach((batch) => enqueueBatch(batch, false));
});

socket.on('new-slideshow-batch', (batch) => {
  enqueueBatch(batch, true);
});

socket.on('purge-urls', (deletedUrls) => {
  priorityQueue = priorityQueue.filter((item) => !deletedUrls.includes(item.url));
  loopPool = loopPool.filter((item) => !deletedUrls.includes(item.url));
  if (loopIndex >= loopPool.length) loopIndex = 0;

  if (currentSlide && deletedUrls.includes(currentSlide.url)) {
    playNext();
  } else {
    updateHud();
  }
});

socket.on('live-reaction', ({ emoji }) => {
  const el = document.createElement('div');
  el.className = 'floating-emoji';
  el.textContent = emoji;
  el.style.left = `${12 + Math.random() * 76}%`;
  reactionLayer.appendChild(el);
  setTimeout(() => el.remove(), 2900);
});

function renderSlide(slide, isAmbientLoop) {
  currentSlide = slide;
  idleScreen.style.display = 'none';
  container.style.display = 'flex';

  // Apply selected frame style (glass, polaroid, warm, noir)
  const frame = slide.frameStyle || 'glass';
  slideStage.className = `frame-${frame}`;

  slideImg.style.animation = 'none';
  void slideImg.offsetWidth;
  slideImg.style.animation = `kenBurns ${slideDurationMs + 800}ms ease-out forwards`;

  slideImg.src = slide.url;
  ambientBackdrop.style.backgroundImage = `url('${slide.url}')`;
  visitorNameEl.textContent = slide.visitorName;
  polaroidNameEl.textContent = slide.visitorName;
  polaroidCaptionEl.textContent = slide.caption || '';

  if (slide.caption) {
    visitorCaptionEl.textContent = `"${slide.caption}"`;
    visitorCaptionEl.style.display = 'block';
  } else {
    visitorCaptionEl.style.display = 'none';
  }

  if (isAmbientLoop) {
    visitorBadgeEl.textContent = 'Showcase Loop';
    visitorBadgeEl.className = 'badge memory';
  } else if (slide.isPrevious) {
    visitorBadgeEl.textContent = 'Memory from Previous Visit';
    visitorBadgeEl.className = 'badge memory';
  } else if (slide.isReturning) {
    visitorBadgeEl.textContent = 'Welcome Back!';
    visitorBadgeEl.className = 'badge';
  } else {
    visitorBadgeEl.textContent = 'New Visitor';
    visitorBadgeEl.className = 'badge';
  }

  remainingMs = slideDurationMs;
  slideStartTime = Date.now();
  progressFill.style.transition = 'none';
  progressFill.style.width = '0%';
  void progressFill.offsetWidth;
  progressFill.style.transition = `width ${slideDurationMs}ms linear`;
  progressFill.style.width = '100%';
}

function playNext() {
  clearTimeout(slideTimer);

  if (priorityQueue.length > 0) {
    isPlaying = true;
    const nextNew = priorityQueue.shift();
    updateHud();
    renderSlide(nextNew, false);
    slideTimer = setTimeout(playNext, slideDurationMs);
    return;
  }

  if (loopPool.length > 0) {
    isPlaying = true;
    if (loopIndex >= loopPool.length) loopIndex = 0;
    const nextLoopSlide = loopPool[loopIndex];
    loopIndex = (loopIndex + 1) % loopPool.length;
    updateHud();
    renderSlide(nextLoopSlide, true);
    slideTimer = setTimeout(playNext, slideDurationMs);
    return;
  }

  isPlaying = false;
  currentSlide = null;
  container.style.display = 'none';
  idleScreen.style.display = 'flex';
  updateHud();
}
