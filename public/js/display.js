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

uploadUrlChip.textContent = `Visit ${window.location.origin} to Upload`;

const queue = [];
let isPlaying = false;
let slideDurationMs = 5000;

fetch('/api/config')
  .then((res) => res.json())
  .then((data) => {
    if (data.slideDurationMs) slideDurationMs = data.slideDurationMs;
  })
  .catch(() => {});

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    fullscreenBtn.textContent = '✕ Exit Fullscreen';
  } else {
    document.exitFullscreen().catch(() => {});
    fullscreenBtn.textContent = '⛶ Fullscreen';
  }
});

function updateHud() {
  if (!isPlaying && queue.length === 0) {
    queueStatus.textContent = 'LIVE • Waiting for uploads';
  } else if (queue.length === 0) {
    queueStatus.textContent = 'LIVE • Playing now';
  } else {
    queueStatus.textContent = `LIVE • ${queue.length} photo${queue.length > 1 ? 's' : ''} up next`;
  }
}

socket.on('new-slideshow-batch', (batch) => {
  batch.photos.forEach((photo) => {
    queue.push({
      visitorName: batch.visitorName,
      isReturning: batch.isReturning,
      url: photo.url,
      isPrevious: photo.isPrevious,
    });
  });

  updateHud();
  if (!isPlaying) {
    playNext();
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

function playNext() {
  if (queue.length === 0) {
    isPlaying = false;
    container.style.display = 'none';
    idleScreen.style.display = 'block';
    updateHud();
    return;
  }

  isPlaying = true;
  const current = queue.shift();
  updateHud();

  idleScreen.style.display = 'none';
  container.style.display = 'flex';

  // Restart Ken Burns image animation cleanly
  slideImg.style.animation = 'none';
  void slideImg.offsetWidth;
  slideImg.style.animation = `kenBurns ${slideDurationMs + 800}ms ease-out forwards`;

  slideImg.src = current.url;
  ambientBackdrop.style.backgroundImage = `url('${current.url}')`;
  visitorNameEl.textContent = current.visitorName;

  if (current.isPrevious) {
    visitorBadgeEl.textContent = 'Memory from Previous Visit';
    visitorBadgeEl.className = 'badge memory';
  } else if (current.isReturning) {
    visitorBadgeEl.textContent = 'Welcome Back!';
    visitorBadgeEl.className = 'badge';
  } else {
    visitorBadgeEl.textContent = 'New Visitor';
    visitorBadgeEl.className = 'badge';
  }

  // Animate bottom timer progress bar
  progressFill.style.transition = 'none';
  progressFill.style.width = '0%';
  void progressFill.offsetWidth;
  progressFill.style.transition = `width ${slideDurationMs}ms linear`;
  progressFill.style.width = '100%';

  setTimeout(playNext, slideDurationMs);
}
