# Test Suite & Manual Verification Results

## 1. Automated Integration Tests (`tests/api.test.js`)
Run while the server is running (`node src/server.js`):
```bash
node --test tests/api.test.js
```

| Test ID | Automated Test Case | Status |
| :--- | :--- | :--- |
| AT-01 | `GET /api/config` returns `5000ms` duration, LAN `uploadUrl`, and QR code data URL | PASS |
| AT-02 | `POST /api/upload` blocks requests without consent (`400`) | PASS |
| AT-03 | `POST /api/upload` rejects `.txt` files via backend Multer filter (`400`) | PASS |
| AT-04 | `POST /api/upload` registers new visitor (`201`) and detects returning visitor (`isReturning: true`) | PASS |
| AT-05 | `DELETE /api/photos` removes uploaded files from disk and cascades MySQL deletion (`200`) | PASS |

## 2. Manual Test Plan & Results

| ID | Test Case | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | New Visitor Upload & Preview | Open `/`, enter name + email, drop 1 JPG, tick consent, submit. | Photo uploads (`201`), persistent preview stays on `/`, and plays for 5s on `/display` with `New Visitor` badge. | PASS |
| TC-02 | Returning Visitor Replay | Upload a new photo using the same email from TC-01. | `/display` plays the new photo (`Welcome Back!`) followed by previous photo (`Memory from Previous Visit`). | PASS |
| TC-03 | Order-Independent TV Sync | Upload a photo while `/display` is closed, then open `/display`. | `/display` syncs immediately from server buffer/MySQL and plays the uploaded photo. | PASS |
| TC-04 | Continuous Showcase Loop | Wait 5 seconds after priority queue finishes on `/display`. | Display keeps looping consented photos in `Showcase Loop` mode instead of reverting to an empty screen. | PASS |
| TC-05 | Oversized File Rejection | Try uploading an image larger than 5 MB. | Backend rejects with HTTP `400` (`File too large. Max size is 5MB.`). | PASS |
| TC-06 | Concurrent Uploads | Submit uploads from 2 browser tabs at the same time. | Both batches enter the FIFO `priorityQueue` and play one after another without overlap. | PASS |
| TC-07 | Privacy Opt-Out | Click **Remove My Photos** on `/` and enter registered email. | Files deleted from `uploads/`, rows deleted from MySQL, and active slides purged from `/display`. | PASS |
| TC-08 | QR Code & Live Reactions | Scan QR code on `/display` or `/` with a phone and tap reaction emojis. | Phone opens upload URL directly; tapped emojis float across `/display` in real time. | PASS |
