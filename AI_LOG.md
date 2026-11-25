# AI Interaction Log

This log documents 8 key AI interactions used to design, build, and refine **LuminaCast (Visitor Photo Slideshow)**, including 4 specific cases where AI-generated code had mistakes that I identified and fixed.

## Key Prompts & Interactions
1. **Assignment Breakdown & Deliverables:** Prompted AI to extract core functional requirements, design challenges, and required repository artifacts from the assignment specification.
2. **Tech Stack & Design Decisions:** Prompted AI to recommend a real-time stack (`Node.js`, `Express`, `Socket.io`, `MySQL`, `Multer`) and structure `ASSUMPTIONS.md`.
3. **Database Schema & Validation API:** Prompted AI to write the relational MySQL schema (`visitors` and `photos`) and Express upload/delete routes.
4. **Glassmorphic UI & Interactive Canvas:** Prompted AI to build frosted glassmorphism cards, drag-and-drop thumbnail previews, an animated SVG brand logo, and a 60fps HTML5 Canvas particle network.
5. **Order-Independent Display Sync & Continuous Loop:** Prompted AI to fix missed broadcasts when `/display` opens after an upload and loop consented photos continuously when idle.
6. **LAN QR Code Onboarding & Persistent Preview:** Prompted AI to generate scannable Wi-Fi QR codes on both `/` and `/display` and keep a persistent preview of uploaded photos on `/`.
7. **Shoutout Captions, Frames, Host Controls & Arrival Chime:** Prompted AI to add profanity-filtered shoutout captions, selectable TV frames (`Glass`, `Polaroid`, `Warm Film`, `Noir`), TV host keyboard controls, and a Web Audio arrival chime.
8. **Automated & Manual Verification Suite:** Prompted AI to create a zero-dependency `node:test` integration test suite (`tests/api.test.js`) and manual test plan.

## Cases Where AI Was Wrong (And How I Fixed Them)

### Case 1: Display Missed Uploads If Opened After Photo Submission
* **What AI did wrong:** Initially, AI only sent a live `io.emit('new-slideshow-batch')` broadcast on upload. If `/display` was opened *after* uploading, the TV screen never received that broadcast and remained stuck on the Welcome screen.
* **How I noticed:** During testing, I uploaded a photo on `/` first and clicked **Open TV Display ↗** afterward—the screen showed *"Waiting for uploads"* even though the photo was saved in MySQL.
* **How I fixed it:** Added an `app.locals.unplayedBatches` replay buffer in `src/server.js` and a `register-display` Socket.io handshake so `/display` immediately syncs pending and recent photos upon connecting.

### Case 2: Slideshow Reverted to Idle Welcome Screen After 5 Seconds
* **What AI did wrong:** In the first version of `public/js/display.js`, once the queue emptied after playing a 5-second photo, `playNext()` hid the slideshow container and switched back to `#idle-screen`.
* **How I noticed:** When testing a single photo upload, the photo disappeared after 5 seconds and left the TV screen empty between uploads.
* **How I fixed it:** Updated `public/js/display.js` with two playback layers: `priorityQueue` plays newly uploaded batches immediately, and `loopPool` continuously cycles through consented photos whenever no new uploads are waiting.

### Case 3: Returning Visitor Query Duplicated Newly Uploaded Photos
* **What AI did wrong:** AI initially inserted new photos into MySQL *before* querying the visitor's previous photos, causing newly uploaded photos to be fetched again as "previous" photos and played twice.
* **How I noticed:** During returning-visitor testing (TC-02), uploading 1 photo as a repeat visitor queued 2 identical slides back-to-back.
* **How I fixed it:** Reordered the queries in `src/routes/upload.js` so `previousPhotos` are fetched from MySQL *before* inserting the new uploaded files.

### Case 4: Orphaned Image Files Left on Disk When Caption Validation Failed
* **What AI did wrong:** When adding the profanity filter for shoutout captions, Multer had already saved the uploaded image files to `uploads/` before the route handler rejected the caption with HTTP `400`, leaving orphaned files on disk.
* **How I noticed:** After testing a blocked caption upload, I checked the `uploads/` folder and saw the rejected image file still present.
* **How I fixed it:** Added a `cleanupUploadedFiles(req.files)` helper in `src/routes/upload.js` that immediately unlinks temporary uploaded files from disk whenever validation fails.
