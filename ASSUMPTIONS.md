# Assumptions & Design Decisions

This document outlines every gap identified in the assignment requirements and the rationale behind each technical decision made.

## 1. Identifying Returning Visitors
* **Gap:** Two different visitors can share the same name (e.g., two visitors named "Aarav"). Identifying visitors by name alone would mix up different people's photo histories.
* **Decision:** Visitors provide their **Name** along with a unique identifier (**Email or Phone Number**). The identifier is trimmed, lowercased, and stored with a `UNIQUE` constraint in MySQL.
* **Why:** Reliably links returning visitors to their previous uploads without requiring passwords, user accounts, or invasive facial recognition.

## 2. Privacy & Public Display Consent
* **Gap:** Visitor photos are displayed publicly on a shared TV/monitor, requiring explicit informed consent and user control over personal data.
* **Decision:**
  * **Mandatory Consent Checkbox:** Uploads are blocked on both frontend and backend unless the visitor explicitly checks *"I consent to my name and uploaded photos being displayed publicly on the venue screen."*
  * **Consent Audit Timestamp:** `consent_given` and `consent_timestamp` are recorded in the `visitors` table upon registration.
  * **Right to Removal (Opt-Out):** Visitors can permanently remove all their photos at any time via the **Remove My Photos** button (`DELETE /api/photos`), which deletes image files from disk, removes database records via `ON DELETE CASCADE`, and purges them from the live TV queue.
* **Why:** Prevents accidental public display and gives visitors immediate self-service deletion rights.

## 3. File Validation, Size Limits & Concurrency
* **Gap:** Unvalidated uploads could crash the server, exhaust storage, or allow non-image payloads, while simultaneous uploads could cause race conditions on the TV screen.
* **Decision:**
  * **Allowed Formats:** Only `.jpg`, `.jpeg`, `.png`, and `.webp` are accepted, enforced on the backend via Multer using both `file.mimetype` and `path.extname()`.
  * **Size & Batch Caps:** Maximum **5 MB per photo** and **5 photos per upload session**.
  * **Concurrent Upload Handling:** The TV display uses a **FIFO `priorityQueue`** so simultaneous submissions play sequentially without overlapping slides.
* **Why:** Backend MIME + extension checks cannot be bypassed by renaming files, and FIFO queuing ensures fair screen time under concurrent load.

## 4. Order-Independent Sync & Continuous Slideshow Loop
* **Gap:** A TV operator might open `/display` *after* visitors have already uploaded photos, and leaving the screen blank after one 5-second slide wastes display real estate.
* **Decision:**
  * **Server Replay Buffer & DB Seed:** The server caches unplayed batches in `app.locals.unplayedBatches` and seeds `/display` with recent consented photos from MySQL whenever a display connects (`register-display`).
  * **Slide Timing & Returning Replay:** Each photo plays for **5 seconds** (`SLIDE_DURATION_MS=5000`). Returning visitors see their newly uploaded photos first (`Welcome Back!`), followed by up to **5 most recent previous photos** (`Memory from Previous Visit`).
  * **Continuous Loop:** Once `priorityQueue` finishes, `/display` continuously cycles through `loopPool` (up to 30 consented photos) instead of reverting to an empty screen. The Welcome + QR idle screen appears only when 0 photos exist.
* **Why:** Guarantees zero missed uploads regardless of tab open order and keeps the venue screen engaging between uploads.

## 5. Mobile Onboarding via LAN QR Code
* **Gap:** Typing `localhost` on a phone does not connect to the host laptop running the server.
* **Decision:** `GET /api/config` inspects `os.networkInterfaces()` to detect the host machine's local Wi-Fi IPv4 address (`http://<LAN-IP>:3000`) and generates a scannable QR code shown on both `/display` and `/`.
* **Why:** Allows visitors on the same Wi-Fi network to scan and upload immediately during live events or demos.
