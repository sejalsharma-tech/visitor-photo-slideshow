const socket = io();
const form = document.getElementById('uploadForm');
const statusDiv = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const deleteBtn = document.getElementById('deleteBtn');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('photos');
const previewGrid = document.getElementById('previewGrid');
const tiltCard = document.getElementById('tiltCard');

let selectedFiles = [];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Subtle 3D Glass Card Tilt on Desktop
tiltCard.addEventListener('mousemove', (e) => {
  if (window.innerWidth < 768) return;
  const rect = tiltCard.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  tiltCard.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
});

tiltCard.addEventListener('mouseleave', () => {
  tiltCard.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

function addFiles(fileList) {
  const incoming = Array.from(fileList);

  for (const file of incoming) {
    if (selectedFiles.length >= 5) {
      showStatus('Maximum 5 photos allowed per upload.', 'error');
      break;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      showStatus(`"${file.name}" skipped: Only JPG, PNG, and WEBP allowed.`, 'error');
      continue;
    }
    if (file.size > MAX_SIZE_BYTES) {
      showStatus(`"${file.name}" skipped: Exceeds 5MB limit.`, 'error');
      continue;
    }
    selectedFiles.push(file);
  }
  renderPreviews();
}

function renderPreviews() {
  previewGrid.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const url = URL.createObjectURL(file);
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.innerHTML = `
      <img src="${url}" alt="${file.name}" />
      <button type="button" class="remove-thumb" data-idx="${index}" title="Remove">&times;</button>
    `;
    previewGrid.appendChild(item);
  });
}

previewGrid.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-thumb')) {
    const idx = parseInt(e.target.dataset.idx, 10);
    selectedFiles.splice(idx, 1);
    renderPreviews();
  }
});

// Drag & Drop handlers
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  addFiles(e.target.files);
  fileInput.value = '';
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  addFiles(e.dataTransfer.files);
});

// Form Submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (selectedFiles.length === 0) {
    return showStatus('Please select or drop at least one photo.', 'error');
  }

  const formData = new FormData();
  formData.append('name', document.getElementById('name').value);
  formData.append('identifier', document.getElementById('identifier').value);
  formData.append('consent', document.getElementById('consent').checked);

  selectedFiles.forEach((file) => formData.append('photos', file));

  submitBtn.disabled = true;
  submitBtn.textContent = 'Casting to Screen...';

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      showStatus(data.message, 'success');
      form.reset();
      selectedFiles = [];
      renderPreviews();
      socket.emit('send-reaction', { emoji: '🎉' });
    } else {
      showStatus(data.error || 'Upload failed.', 'error');
    }
  } catch {
    showStatus('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload & Cast to Screen';
  }
});

// Live Emoji Reactions to TV
document.querySelectorAll('.react-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    socket.emit('send-reaction', { emoji: btn.dataset.emoji });
  });
});

// Privacy Opt-Out
deleteBtn.addEventListener('click', async () => {
  const identifier = prompt('Enter the Email or Phone Number you used to upload:');
  if (!identifier) return;

  try {
    const res = await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json();
    showStatus(data.message || data.error, res.ok ? 'success' : 'error');
  } catch {
    showStatus('Failed to connect to server.', 'error');
  }
});
