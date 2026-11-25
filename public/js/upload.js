const socket = io();
const form = document.getElementById('uploadForm');
const statusDiv = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const deleteBtn = document.getElementById('deleteBtn');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('photos');
const previewGrid = document.getElementById('previewGrid');
const tiltCard = document.getElementById('tiltCard');
const uploadedShowcase = document.getElementById('uploadedShowcase');
const showcaseTitle = document.getElementById('showcaseTitle');
const uploadedGrid = document.getElementById('uploadedGrid');
const captionInput = document.getElementById('caption');
const captionCount = document.getElementById('captionCount');
const framePills = document.getElementById('framePills');

const uploadQrBox = document.getElementById('uploadQrBox');
const uploadQrImg = document.getElementById('uploadQrImg');
const uploadShareUrl = document.getElementById('uploadShareUrl');
const copyUrlBtn = document.getElementById('copyUrlBtn');
const qrZoomTrigger = document.getElementById('qrZoomTrigger');
const qrZoomModal = document.getElementById('qrZoomModal');
const qrZoomImg = document.getElementById('qrZoomImg');
const qrZoomUrlText = document.getElementById('qrZoomUrlText');

let selectedFiles = [];
let selectedFrame = 'glass';
let shareableUrl = window.location.origin;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// Caption character counter
captionInput.addEventListener('input', () => {
  captionCount.textContent = `${captionInput.value.length} / 80`;
});

// Selectable Frame Pills
framePills.addEventListener('click', (e) => {
  const btn = e.target.closest('.frame-pill');
  if (!btn) return;
  document.querySelectorAll('.frame-pill').forEach((p) => p.classList.remove('active'));
  btn.classList.add('active');
  selectedFrame = btn.dataset.frame;
  renderPreviews();
});

// Fetch LAN URL & QR Code
fetch('/api/config')
  .then((res) => res.json())
  .then((data) => {
    if (data.uploadUrl) shareableUrl = data.uploadUrl;
    if (data.qrDataUrl && uploadQrBox) {
      uploadQrImg.src = data.qrDataUrl;
      qrZoomImg.src = data.qrDataUrl;
      uploadShareUrl.textContent = shareableUrl;
      qrZoomUrlText.textContent = shareableUrl;
      uploadQrBox.style.display = 'flex';
    }
  })
  .catch(() => {});

copyUrlBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(shareableUrl).then(() => {
    const label = copyUrlBtn.querySelector('span');
    label.textContent = 'Copied!';
    setTimeout(() => {
      label.textContent = 'Copy Upload Link';
    }, 2000);
  }).catch(() => {});
});

qrZoomTrigger.addEventListener('click', () => {
  qrZoomModal.style.display = 'flex';
});

qrZoomModal.addEventListener('click', () => {
  qrZoomModal.style.display = 'none';
});

// Subtle 3D Glass Card Tilt
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
    item.className = `preview-item frame-${selectedFrame}`;
    item.innerHTML = `
      <img src="${url}" alt="${file.name}" />
      <button type="button" class="remove-thumb" data-idx="${index}" title="Remove">&times;</button>
    `;
    previewGrid.appendChild(item);
  });
}

function renderUploadedShowcase(visitorName, photoUrls, frameStyle) {
  if (!photoUrls || photoUrls.length === 0) return;
  showcaseTitle.textContent = `${visitorName}'s Uploaded Photos`;
  uploadedGrid.innerHTML = '';

  photoUrls.forEach((url) => {
    const item = document.createElement('div');
    item.className = `preview-item frame-${frameStyle || 'glass'}`;
    item.innerHTML = `<img src="${url}" alt="Uploaded photo" />`;
    uploadedGrid.appendChild(item);
  });

  uploadedShowcase.style.display = 'block';
}

previewGrid.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-thumb')) {
    const idx = parseInt(e.target.dataset.idx, 10);
    selectedFiles.splice(idx, 1);
    renderPreviews();
  }
});

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

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (selectedFiles.length === 0) {
    return showStatus('Please select or drop at least one photo.', 'error');
  }

  const visitorNameInput = document.getElementById('name').value.trim();
  const submittedFrame = selectedFrame;
  const fallbackUrls = selectedFiles.map((file) => URL.createObjectURL(file));

  const formData = new FormData();
  formData.append('name', visitorNameInput);
  formData.append('identifier', document.getElementById('identifier').value);
  formData.append('caption', captionInput.value.trim());
  formData.append('frameStyle', submittedFrame);
  formData.append('consent', document.getElementById('consent').checked);

  selectedFiles.forEach((file) => formData.append('photos', file));

  submitBtn.disabled = true;
  submitBtn.querySelector('span').textContent = 'Casting to Screen...';

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      showStatus(data.message, 'success');
      const finalUrls =
        data.uploadedPhotos && data.uploadedPhotos.length > 0
          ? data.uploadedPhotos.map((p) => p.url)
          : fallbackUrls;
      renderUploadedShowcase(data.visitorName || visitorNameInput, finalUrls, submittedFrame);

      form.reset();
      captionCount.textContent = '0 / 80';
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
    submitBtn.querySelector('span').textContent = 'Upload & Cast to Screen';
  }
});

document.querySelectorAll('.react-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    socket.emit('send-reaction', { emoji: btn.dataset.emoji });
  });
});

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
    if (res.ok) {
      uploadedShowcase.style.display = 'none';
      uploadedGrid.innerHTML = '';
    }
  } catch {
    showStatus('Failed to connect to server.', 'error');
  }
});
