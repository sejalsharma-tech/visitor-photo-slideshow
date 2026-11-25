# Assumptions & Design Decisions

This document outlines the gaps identified in the project requirements and the rationale behind each decision made.

## 1. Identifying Returning Visitors
* **Gap:** Two different visitors can share the same name (e.g., two people named "Aarav"). Relying on name alone risks mixing up different people's photos.
* **Decision:** Visitors are asked for their **Name** and a unique identifier (**Email or Phone Number**). The email/phone is normalized (trimmed and lowercased) and stored as a unique key in the database.
* **Why:** It accurately links a returning visitor to their previous uploads without requiring complex user accounts, passwords, or facial recognition (which raises major privacy concerns).

## 2. Privacy & Consent
* **Gap:** Photos are displayed publicly on a shared TV/monitor, requiring explicit permission and data hygiene.
* **Decision:**
  * A **mandatory consent checkbox** must be checked before the upload button becomes active (*"I consent to my name and uploaded photos being displayed publicly on the venue screen"*).
  * Consent timestamp is recorded in the database for accountability.
  * **Retention Policy:** Uploaded photos are intended for temporary event display and should be purged after 24 hours (or manually cleared by an admin).
  * **Opt-out:** Visitors can request deletion of their photos using their registered email/phone via a simple removal button on the upload page.
* **Why:** Prevents accidental public exposure and ensures informed consent before any media hits the display.

## 3. File Validation & Upload Limits
* **Gap:** Unvalidated uploads can crash the server, fill up disk space, or introduce malicious files.
* **Decision:**
  * **Allowed formats:** `.jpg`, `.jpeg`, `.png`, `.webp` (validated via both file extension and MIME type on the backend, not just the frontend).
  * **Size limit:** Maximum **5 MB per photo**.
  * **Batch limit:** Maximum **5 photos per upload session**.
* **Why:** High-resolution phone photos fit comfortably under 5 MB, while strict backend validation prevents oversized or non-image payloads.

## 4. Handling Concurrent Uploads
* **Gap:** Multiple visitors may upload photos at the exact same time, which could cause overlapping slides or skipped photos on the display.
* **Decision:** The display screen maintains a **FIFO (First-In, First-Out) playback queue**. When an upload finishes, the server broadcasts the visitor's batch (new photos + any previous photos for returning visitors) via WebSockets (Socket.io) to the display, which appends them to the queue.
* **Why:** Guarantees every visitor gets fair screen time without interrupting a photo that is currently being shown.

## 5. Slideshow Behavior & Duration
* **Gap:** Exact display timing and idle screen behavior were not specified.
* **Decision:**
  * Each photo displays for **5 seconds** (configurable via `.env`) along with a subtle overlay showing the visitor's name (and a "Welcome Back!" badge for returning visitors).
  * **Returning Visitor Limit:** If a returning visitor has many historical photos, the slideshow plays their newly uploaded photos first, followed by up to their **5 most recent previous photos** so one person does not monopolize the screen.
  * **Idle State:** When the queue is empty, the display shows a clean welcome screen prompting visitors to upload photos.
