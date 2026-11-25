# Manual Test Plan & Results

| ID | Test Case | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| TC-01 | New Visitor Upload | Open `/`, enter name + email, select 1 JPG, check consent, submit. | Photo uploads, returns 201, and plays immediately on `/display` with "New Visitor" badge. | PASS |
| TC-02 | Returning Visitor | Upload a new photo using the exact same email from TC-01. | `/display` plays the new photo ("Welcome Back!") followed by previous photo ("Memory from Previous Visit"). | PASS |
| TC-03 | Missing Consent | Fill form and select photo, leave consent unchecked. | Browser/Backend blocks submission with consent error. | PASS |
| TC-04 | Invalid File Type | Try uploading a `.pdf` or `.txt` file. | Backend Multer filter rejects with 400 error. | PASS |
| TC-05 | Oversized File | Try uploading an image larger than 5MB. | Backend rejects with "File too large" error. | PASS |
| TC-06 | Concurrent Uploads | Open 2 browser tabs and submit uploads simultaneously. | Both batches are queued in FIFO order on `/display` without overlapping or dropping slides. | PASS |
| TC-07 | Privacy Opt-Out | Click "Remove My Uploaded Photos" and enter email. | Files deleted from `uploads/` and records removed from MySQL. | PASS |
