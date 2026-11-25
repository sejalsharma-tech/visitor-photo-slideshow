# Assumptions & Design Decisions

The assignment left several practical details open so I could make sensible engineering choices. Below is every gap I filled, every feature I added, and the reason behind each decision—written clearly for review and live demonstration.

---

## 1. Identifying Returning Visitors
* **What was unspecified:** How to know if a visitor has visited before without creating a complex login system.
* **My Decision:** Every visitor enters their **Name** plus a unique **Email Address or Phone Number**. The app trims spaces and converts the email/phone to lowercase before saving it in MySQL.
* **Why:** Two people can have the same name (like "Aarav"), so using a normalized email or phone number reliably links returning visitors to their past photos without needing passwords or facial recognition.

---

## 2. Privacy, Public Consent & One-Click Photo Deletion
* **What was unspecified:** How to protect visitor privacy when photos are displayed on a public TV screen.
* **My Decision:**
  * **Mandatory Consent Checkbox:** The upload fails unless the visitor explicitly ticks *"I consent to my name and uploaded photos being displayed publicly on the venue screen."*
  * **Consent Audit Log:** The exact date and time when consent was given is saved in the MySQL `visitors` table.
  * **Right to Removal (Opt-Out):** Visitors can click **"Remove My Photos"** anytime and enter their email/phone to permanently delete their image files from disk, remove their database records, and purge their slides from the live TV queue.
* **Why:** Guarantees informed consent before public display and gives visitors immediate self-service control over their data.

---

## 3. File Validation, Size Limits & Simultaneous Uploads
* **What was unspecified:** Allowed image formats, maximum file sizes, and how to handle multiple people uploading at once.
* **My Decision:**
  * **Strict Backend Validation:** Only `.jpg`, `.jpeg`, `.png`, and `.webp` images are allowed. Multer checks both the file extension and real MIME type on the server (so renamed non-image files are blocked).
  * **Size & Batch Limits:** Maximum **5 MB per photo** and up to **5 photos per upload**.
  * **FIFO Priority Queue:** When multiple visitors upload at the exact same second, `/display` queues them in First-In, First-Out order so slides never overlap or crash the screen.
* **Why:** Protects server storage from invalid or oversized files and ensures every visitor gets fair screen time.

---

## 4. Slideshow Timing, Returning Replay & Continuous Loop
* **What was unspecified:** How long each photo plays, playback order for returning visitors, and what happens if `/display` is opened after uploads.
* **My Decision:**
  * **5-Second Slide Duration:** Every slide displays for **5 seconds** (`SLIDE_DURATION_MS=5000`) with a live countdown bar at the bottom of the name card.
  * **Returning Visitor Order:** Plays **new photos first** (`Welcome Back!`), followed by up to **5 most recent previous photos** (`Memory from Previous Visit`).
  * **Order-Independent Sync:** If `/display` is opened *after* photos are uploaded, the server immediately syncs unplayed batches and recent MySQL photos so nothing is missed.
  * **Continuous Showcase Loop:** Once new priority uploads finish, `/display` continuously loops consented photos instead of reverting to an empty screen (the Welcome + QR screen appears only when 0 photos exist).
* **Why:** Keeps the venue TV visually active at all times and works regardless of whether the TV page or upload page is opened first.

---

## 5. Optional Photo Shoutouts & Public Profanity Filter
* **What was unspecified:** Whether visitors can attach short messages to their photos and how to prevent offensive text on a public screen.
* **My Decision:** Visitors can type an optional **80-character shoutout caption** (e.g., *"Tech Fest 2026 Crew!"*) displayed on the TV overlay. Before saving or broadcasting, the backend checks both the visitor's name and caption against a profanity filter (`BLOCKED_WORDS`). If inappropriate language is detected, the upload is rejected (`HTTP 400`) and any temporary uploaded files are immediately deleted from disk.
* **Why:** Makes the slideshow more personal and engaging while protecting the public display from inappropriate text and avoiding orphaned files on disk.

---

## 6. Host TV Keyboard Controls & Instant Moderation
* **What was unspecified:** How an event host or operator manages the TV display during a live session.
* **My Decision:** Added on-screen HUD buttons and keyboard shortcuts on `/display`:
  * **`Space` (Pause / Resume):** Freezes the current slide and countdown progress bar so people can take a closer look or photo.
  * **`ArrowRight` (Next Slide):** Immediately advances to the next photo in the queue.
  * **`H` / `Hide Slide` Button:** Instantly removes the currently displayed photo from both the priority queue and continuous loop.
* **Why:** Gives the host real-time operational control to moderate unwanted or accidental uploads without waiting for the visitor to use the opt-out form.

---

## 7. Selectable TV Photo Frames (`Glass`, `Polaroid`, `Warm Film`, `Noir B&W`)
* **What was unspecified:** Visual presentation styles for visitor photos on the TV display.
* **My Decision:** Added a frame selector on the upload page offering four styles—**Glass**, **Polaroid** (classic white frame with printed visitor name and caption), **Warm Film**, and **Noir B&W**. The chosen style previews live on the upload page, saves to MySQL (`photos.frame_style`), and renders on `/display`.
* **Why:** Lets visitors personalize how their memories appear on the big screen and visually distinguishes different uploads during a live demo.

---

## 8. Web Audio Arrival Chime & Live Emoji Reactions
* **What was unspecified:** How people in a room notice when a new photo arrives on the TV screen, and how visitors can interact after uploading.
* **My Decision:**
  * **Synthesized Arrival Chime:** `/display` uses the browser's built-in **Web Audio API** to play a soft two-note harmonic glass chime whenever new photos arrive, paired with a **Chime On / Muted** toggle in the top HUD.
  * **Live Emoji Reactions:** Visitors can tap reaction buttons (`❤️ 🔥 🎉 👏 ✨`) on their phones to float live emojis across the TV screen via Socket.io.
* **Why:** Draws attention to new uploads in a venue without requiring external `.mp3` files, and keeps visitors engaged after submitting.

---

## 9. Mobile QR Code Onboarding & Persistent Upload Preview
* **What was unspecified:** How visitors on smartphones access the local server URL and confirm their upload succeeded.
* **My Decision:**
  * **Auto LAN QR Code:** The server detects the host machine's local Wi-Fi IPv4 address (`http://<LAN-IP>:3000`) and displays a scannable QR code on both `/` and `/display` (with a Copy Link button and zoom modal).
  * **Persistent Upload Preview:** After submitting, the upload page resets the form inputs while keeping a thumbnail showcase card (`Queued on TV`) of the visitor's uploaded photos.
* **Why:** Eliminates typing IP addresses on mobile phones during live demos and gives clear visual confirmation after upload.
