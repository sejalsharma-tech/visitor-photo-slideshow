const socket = io();
const idleScreen = document.getElementById('idle-screen');
const container = document.getElementById('slideshow-container');
const slideImg = document.getElementById('slide-img');
const visitorNameEl = document.getElementById('visitor-name');
const visitorBadgeEl = document.getElementById('visitor-badge');

const queue = [];
let isPlaying = false;
let slideDurationMs = 5000;

fetch('/api/config')
  .then((res) => res.json())
  .then((data) => {
    if (data.slideDurationMs) slideDurationMs = data.slideDurationMs;
  })
  .catch(() => {});

socket.on('new-slideshow-batch', (batch) => {
  batch.photos.forEach((photo) => {
    queue.push({
      visitorName: batch.visitorName,
      isReturning: batch.isReturning,
      url: photo.url,
      isPrevious: photo.isPrevious,
    });
  });

  if (!isPlaying) {
    playNext();
  }
});

function playNext() {
  if (queue.length === 0) {
    isPlaying = false;
    container.style.display = 'none';
    idleScreen.style.display = 'block';
    return;
  }

  isPlaying = true;
  const current = queue.shift();

  idleScreen.style.display = 'none';
  container.style.display = 'flex';

  slideImg.src = current.url;
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

  setTimeout(playNext, slideDurationMs);
}
