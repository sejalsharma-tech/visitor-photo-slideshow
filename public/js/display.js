const socket = io();
const idleScreen = document.getElementById('idle-screen');
const container = document.getElementById('slideshow-container');
const ambientBackdrop = document.getElementById('ambient-backdrop');
const slideImg = document.getElementById('slide-img');
const visitorNameEl = document.getElementById('visitor-name');
const visitorBadgeEl = document.getElementById('visitor-badge');
const progressFill = document.getElementById('progress-fill');
const queueStatus = document.getElementById('queue-status');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const reactionLayer = document.getElementById('reaction-layer');
const uploadUrlChip = document.getElementById('uploadUrlChip');
const qrCard = document.getElementById('qrCard');
const qrImage = document.getElementById('qrImage');

let priorityQueue = [];
let loopPool = [];
let loopIndex = 0;
let isPlaying = false;
let currentPlayingUrl = null;
let slideDurationMs = 5000;
let slideTimer = null;

fetch('/api/config')
  .then((res) => res.json())
  .then((data) => {
    if (data.slideDurationMs) slideDurationMs = data.slideDurationMs;
    if (data.uploadUrl) {
      uploadUrlChip.textContent = data.uploadUrl;
    }
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

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
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
  if (!isPlaying && priorityQueue.length === 0 && loopPool.length === 0) {
    queueStatus.textContent = 'LIVE • Waiting for uploads';
  } else if (priorityQueue.length > 0) {
    queueStatus.textContent = `LIVE • ${priorityQueue.length} new photo${priorityQueue.length > 1 ? 's' : ''} up next`;
  } else if (loopPool.length > 0) {
    queueStatus.textContent = `LIVE • Looping ${loopPool.length} photo${loopPool.length > 1 ? 's' : ''}`;
  } else {
    queueStatus.textContent = 'LIVE • Playing now';
  }
}

function enqueueBatch(batch) {
  batch.photos.forEach((photo) => {
    const slide = {
      visitorName: batch.visitorName,
      isReturning: batch.isReturning,
      url: photo.url,
      isPrevious: photo.isPrevious,
    };
    priorityQueue.push(slide);
    upsertIntoLoopPool(slide);
  });
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
  batches.forEach((batch) => enqueueBatch(batch));
});

socket.on('new-slideshow-batch', (batch) => {
  enqueueBatch(batch);
});

socket.on('purge-urls', (deletedUrls) => {
  priorityQueue = priorityQueue.filter((item) => !deletedUrls.includes(item.url));
  loopPool = loopPool.filter((item) => !deletedUrls.includes(item.url));
  if (loopIndex >= loopPool.length) loopIndex = 0;

  // If the currently displayed photo was deleted, skip immediately
  if (currentPlayingUrl && deletedUrls.includes(currentPlayingUrl)) {
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
  currentPlayingUrl = slide.url;
  idleScreen.style.display = 'none';
  container.style.display = 'flex';

  slideImg.style.animation = 'none';
  void slideImg.offsetWidth;
  slideImg.style.animation = `kenBurns ${slideDurationMs + 800}ms ease-out forwards`;

  slideImg.src = slide.url;
  ambientBackdrop.style.backgroundImage = `url('${slide.url}')`;
  visitorNameEl.textContent = slide.visitorName;

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

  progressFill.style.transition = 'none';
  progressFill.style.width = '0%';
  void progressFill.offsetWidth;
  progressFill.style.transition = `width ${slideDurationMs}ms linear`;
  progressFill.style.width = '100%';
}

function playNext() {
  clearTimeout(slideTimer);

  // 1. Always play newly uploaded priority slides first
  if (priorityQueue.length > 0) {
    isPlaying = true;
    const nextNew = priorityQueue.shift();
    updateHud();
    renderSlide(nextNew, false);
    slideTimer = setTimeout(playNext, slideDurationMs);
    return;
  }

  // 2. Continuously loop all uploaded consented photos when no new uploads are waiting
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

  // 3. Only show idle Welcome + QR screen when 0 photos exist in database
  isPlaying = false;
  currentPlayingUrl = null;
  container.style.display = 'none';
  idleScreen.style.display = 'flex';
  updateHud();
}
