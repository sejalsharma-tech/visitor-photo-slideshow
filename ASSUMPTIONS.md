# Assumptions & Design Decisions

The assignment left several practical details open so I could make sensible engineering choices. Below is every assumption and design decision I made while building **LuminaCast (Visitor Photo Slideshow)**, explained in simple terms.

---

## 1. How Returning Visitors Are Identified
* **Problem:** Two different visitors can have the exact same name (for example, two visitors named "Aarav"). If we only check the name, one person's photos would get mixed up with another person's.
* **My Decision:** Along with their **Name**, every visitor enters a unique **Email Address or Phone Number**. The app automatically removes extra spaces and converts it to lowercase before saving it in MySQL.
* **Why:** It accurately recognizes returning visitors and links their old photos without forcing people to create passwords or use facial recognition.

---

## 2. Privacy, Public Consent & Photo Deletion
* **Problem:** Visitor photos are displayed publicly on a shared TV screen, so visitors must give clear permission and have control over their photos.
* **My Decision:**
  * **Mandatory Consent Checkbox:** Visitors cannot upload any photo unless they tick the checkbox: *"I consent to my name and uploaded photos being displayed publicly on the venue screen."*
  * **Consent Timestamp:** The exact date and time when consent was given is saved in the MySQL `visitors` table.
  * **One-Click Photo Removal (Opt-Out):** A **"Remove My Photos"** button is provided on the upload page. If a visitor enters their email/phone, the server immediately deletes their image files from the `uploads/` folder, deletes their records from MySQL, and removes their photos from the live TV slideshow queue.
* **Why:** Ensures nobody's photo is shown without permission and gives visitors instant control to delete their data anytime.

---

## 3. File Validation, Size Limits & Multiple Uploads at Once
* **Problem:** Users might try to upload huge files, non-image files (like PDFs or videos), or multiple visitors might upload photos at the exact same time.
* **My Decision:**
  * **Allowed Formats:** Only `.jpg`, `.jpeg`, `.png`, and `.webp` images are allowed. This is checked on the backend (using Multer) by verifying both the file extension and real MIME type—not just on the browser.
  * **Size & Photo Count Limits:** Each photo must be **5 MB or smaller**, and a visitor can upload up to **5 photos at one time**.
  * **Handling Simultaneous Uploads:** The TV display uses a **First-In, First-Out (FIFO) Priority Queue**. If 5 visitors upload photos at the exact same second, the TV screen does not crash or overlap—it plays each visitor's photos smoothly one after another.
* **Why:** Protects the server from invalid or oversized files and ensures every visitor gets fair screen time during busy moments.

---

## 4. Slideshow Timing & Returning Visitor Playback Order
* **Problem:** The assignment did not specify how long each photo should stay on screen or in what order old vs. new photos should play.
* **My Decision:**
  * **5-Second Slide Duration:** Every photo plays for **5 seconds** (`SLIDE_DURATION_MS=5000`), with a live progress bar at the bottom of the name card showing the remaining time.
  * **Playback Order for Returning Visitors:** When a visitor comes back and uploads new photos, the slideshow plays their **new photos first** (with a `"Welcome Back!"` badge), followed by up to **5 of their most recent previous photos** (with a `"Memory from Previous Visit"` badge).
* **Why:** 5 seconds is long enough to enjoy each photo without making other visitors wait too long, and capping old photos at 5 prevents one returning visitor from taking over the entire screen.

---

## 5. Opening the TV Display Before or After Uploading
* **Problem:** A user might upload photos on `/` first and open `/display` *afterward*, or refresh the TV browser. Without sync logic, the TV screen would miss those earlier uploads.
* **My Decision:** The server keeps an in-memory buffer of unplayed uploads (`unplayedBatches`) and also reads recent consented photos from MySQL whenever `/display` connects.
* **Why:** The app works reliably regardless of whether you open the TV display first or upload photos first.

---

## 6. Continuous Slideshow Loop (No Blank TV Screen)
* **Problem:** If only 1 or 2 photos are uploaded and the slideshow stops after 5 seconds, the TV screen would go back to an empty Welcome screen.
* **My Decision:** Once all newly uploaded photos in the priority queue finish playing, `/display` automatically switches to a **Continuous Showcase Loop** that cycles through all uploaded consented photos. The Welcome + QR screen is only shown when zero photos exist in the database.
* **Why:** Keeps the smart TV display lively and visually engaging at all times.

---

## 7. Mobile QR Code Onboarding & Interactive UI Enhancements
* **Problem:** Visitors using their phones cannot connect to `localhost`, and users want visual confirmation after uploading.
* **My Decision:**
  * **Auto LAN QR Code:** The server detects the host computer's local Wi-Fi IP address (`http://<LAN-IP>:3000`) and displays a scannable QR code on both `/` and `/display` (with a Copy Link button and zoom modal).
  * **Persistent Upload Preview:** After submitting, the upload page keeps a thumbnail preview card (`Queued on TV`) of the visitor's uploaded photos while resetting the form inputs.
  * **Live Emoji Reactions:** Visitors can tap reaction buttons (`❤️ 🔥 🎉 👏 ✨`) on their phones to send floating live reactions onto the TV display.
* **Why:** Makes live demos and real-world venue usage effortless on mobile devices.
