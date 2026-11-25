# AI Interaction Log

## Key Prompts Used
1. **Requirement Breakdown:** Asked AI to break down the assignment PDF into core features, design constraints, and repository deliverables.
2. **Architecture & Assumptions:** Asked AI to recommend a reliable real-time stack and draft `ASSUMPTIONS.md` covering returning visitors, consent, and concurrency.
3. **Database & API:** Asked AI to generate the MySQL schema (`visitors` and `photos`) and Express/Multer upload route.
4. **Frontend UI & FIFO Queue:** Asked AI to build the upload form and `/display` slideshow queue using Socket.io.
5. **Testing & Documentation:** Asked AI to draft a manual test plan and Mermaid architecture diagram.

## Cases Where AI Was Wrong (And How I Fixed Them)

### Case 1: Relying Only on Frontend File Validation
* **What AI did wrong:** In the initial upload form, AI only added `accept=".jpg,.png"` on the HTML `<input>` tag without validating MIME types on the backend.
* **How I noticed:** I tested uploading a renamed `.txt` file via curl and it bypassed the HTML check and saved to `uploads/`.
* **How I fixed it:** Added a strict `fileFilter` in Multer (`src/routes/upload.js`) that checks both `file.mimetype` and `path.extname()`, plus a global Multer error handler in `src/server.js`.

### Case 2: Returning Visitor Query Included Newly Uploaded Photos Twice
* **What AI did wrong:** AI initially inserted the new photos into MySQL *before* querying the visitor's previous photos, causing the new photos to appear twice in the slideshow batch.
* **How I noticed:** During manual testing (TC-02), uploading 1 photo as a returning visitor played the same photo back-to-back.
* **How I fixed it:** Reordered the logic in `src/routes/upload.js` so `previousPhotos` are fetched *before* inserting the new photos into the `photos` table.
