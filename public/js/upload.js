const form = document.getElementById('uploadForm');
const statusDiv = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const deleteBtn = document.getElementById('deleteBtn');

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const files = document.getElementById('photos').files;

  if (files.length > 5) {
    return showStatus('You can upload a maximum of 5 photos at once.', 'error');
  }

  const formData = new FormData();
  formData.append('name', document.getElementById('name').value);
  formData.append('identifier', document.getElementById('identifier').value);
  formData.append('consent', document.getElementById('consent').checked);

  for (const file of files) {
    formData.append('photos', file);
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading...';

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();

    if (res.ok) {
      showStatus(data.message, 'success');
      form.reset();
    } else {
      showStatus(data.error || 'Upload failed.', 'error');
    }
  } catch (err) {
    showStatus('Network error. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Upload & Show on Screen';
  }
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
  } catch {
    showStatus('Failed to connect to server.', 'error');
  }
});
