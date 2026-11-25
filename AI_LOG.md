# AI Interaction Log

This log documents 7 key AI interactions used to build **LuminaCast (Visitor Photo Slideshow)**, including 3 real bugs where AI-generated code had mistakes that I noticed and fixed.

## Key Prompts & Interactions
1. **Assignment Breakdown:** Asked AI to list all functional requirements, design challenges, and required GitHub repository deliverables from the assignment PDF.
2. **Tech Stack & Assumptions:** Asked AI to recommend a real-time stack (`Node.js`, `Express`, `Socket.io`, `MySQL`, `Multer`) and help structure `ASSUMPTIONS.md`.
3. **Database Schema & Multer Validation:** Asked AI to generate the MySQL schema (`visitors` and `photos`) and Express file upload/delete routes.
4. **Glassmorphic UI & Interactive Background:** Asked AI to design frosted glassmorphism cards, drag-and-drop thumbnail previews, an animated SVG logo, and a 60fps HTML5 Canvas particle background.
5. **Order-Independent Display Sync & Continuous Loop:** Asked AI to fix missed broadcasts when `/display` opens after an upload and keep photos looping continuously when idle.
6. **LAN QR Code Onboarding & Persistent Preview:** Asked AI to generate scannable Wi-Fi QR codes on both `/` and `/display` and keep a persistent preview of uploaded photos on `/`.
7. **Automated & Manual Testing:** Asked AI to write a built-in `node:test` integration test file (`tests/api.test.js`) and a manual test plan.

## Cases Where AI Was Wrong (And How I Fixed Them)

### Case 1: Display Missed Uploads If Opened After Photo Submission
* **What AI did wrong:** Initially, AI only sent a live `io.emit('new-slideshow-batch')` broadcast when a photo was uploaded. If `/display` was opened *after* uploading, the TV screen never received that broadcast and stayed stuck on the Welcome screen.
* **How I noticed:** During manual testing, I uploaded a photo on `/` first and clicked **Open TV Display ↗** afterward—the screen showed *"Waiting for uploads"* even though the photo was saved in MySQL.
* **How I fixed it:** Added an `app.locals.unplayedBatches` replay buffer in `src/server.js` and a `register-display` Socket.io handshake so `/display` immediately syncs pending and recent photos upon connecting.

### Case 2: Slideshow Reverted to Idle Welcome Screen After 5 Seconds
* **What AI did wrong:** In the first version of `public/js/display.js`, once the queue emptied after playing a 5-second photo, `playNext()` hid the slideshow container and switched back to `#idle-screen`.
* **How I noticed:** When testing a single photo upload, the photo disappeared after 5 seconds and left the TV screen empty between uploads.
* **How I fixed it:** Updated `public/js/display.js` with two playback layers: `priorityQueue` plays newly uploaded batches immediately, and `loopPool` continuously cycles through consented photos whenever no new uploads are waiting.

### Case 3: Returning Visitor Query Duplicated Newly Uploaded Photos
* **What AI did wrong:** AI initially inserted new photos into MySQL *before* querying the visitor's previous photos, causing newly uploaded photos to be fetched again as "previous" photos and played twice.
* **How I noticed:** During returning-visitor testing (TC-02), uploading 1 photo as a repeat visitor queued 2 identical slides back-to-back.
* **How I fixed it:** Reordered the queries in `src/routes/upload.js` so `previousPhotos` are fetched from MySQL *before* inserting the new uploaded files.
