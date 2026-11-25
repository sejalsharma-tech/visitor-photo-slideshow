# System Architecture

## 1. Tech Stack & Rationale
* **Frontend (`HTML5`, `CSS3`, `Vanilla JS`, `Canvas`):** Lightweight with zero build-step overhead, running smoothly on smart TV browsers and smartphones. Includes frosted glassmorphism, drag-and-drop previews, and an interactive particle background.
* **Backend (`Node.js` + `Express.js`):** Non-blocking event-driven I/O handles concurrent `multipart/form-data` image uploads efficiently.
* **Real-Time Communication (`Socket.io`):** Enables instant photo broadcasting (`new-slideshow-batch`), display registration sync (`register-display`), instant deletion purging (`purge-urls`), and live reactions (`live-reaction`).
* **Database (`MySQL` via `mysql2/promise`):** Relational schema maps each `visitor` to their `photos` with `ON DELETE CASCADE` for clean privacy opt-outs.
* **File Validation & QR Utilities (`Multer` + `QRCode`):** Multer enforces MIME, extension, count, and 5 MB size limits; `qrcode` generates Wi-Fi IP QR codes for phone access.

## 2. Database Data Model

### `visitors` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique visitor ID |
| `name` | `VARCHAR(100)` | `NOT NULL` | Visitor display name |
| `identifier` | `VARCHAR(150)` | `NOT NULL, UNIQUE` | Normalized email or phone number |
| `consent_given` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Public display consent flag |
| `consent_timestamp` | `DATETIME` | `NOT NULL` | Timestamp when consent was recorded |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | First visit timestamp |

### `photos` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY, AUTO_INCREMENT` | Unique photo ID |
| `visitor_id` | `INT` | `FOREIGN KEY -> visitors(id) ON DELETE CASCADE` | Owner visitor reference |
| `filename` | `VARCHAR(255)` | `NOT NULL` | Unique generated filename in `uploads/` |
| `original_name` | `VARCHAR(255)` | `NOT NULL` | Original uploaded filename |
| `mime_type` | `VARCHAR(50)` | `NOT NULL` | Validated MIME type (`image/jpeg`, `png`, `webp`) |
| `size_bytes` | `INT` | `NOT NULL` | File size in bytes (max 5 MB) |
| `uploaded_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Upload timestamp |

## 3. System Flow Diagram

```mermaid
sequenceDiagram
    participant V as Visitor (Phone / Laptop)
    participant API as Express + Multer + Socket.io
    participant DB as MySQL (visitors & photos)
    participant TV as Smart TV Display (/display)

    TV->>API: Socket Connect -> emit("register-display")
    API->>DB: Fetch recent consented photos
    API-->>TV: emit("sync-batches") + emit("seed-loop-pool")

    V->>API: POST /api/upload (Name, Identifier, Photos, Consent)
    API->>API: Validate MIME, Extension, Size (<=5MB), Count (<=5)
    API->>DB: Lookup Visitor by normalized Identifier
    alt Returning Visitor
        DB-->>API: Return Visitor ID + Up to 5 Previous Photos
    else New Visitor
        API->>DB: Insert New Visitor + Consent Timestamp
    end
    API->>DB: Insert New Photo Metadata
    API-->>TV: emit("new-slideshow-batch") [New + Previous Photos]
    TV->>TV: Play in FIFO priorityQueue (5s/slide), then loop continuously
    API-->>V: 201 Created + Uploaded Photo URLs for Persistent Preview

    opt Privacy Opt-Out
        V->>API: DELETE /api/photos { identifier }
        API->>DB: Delete Visitor (Cascades to photos) & Unlink Files
        API-->>TV: emit("purge-urls") -> Remove from Queue & Loop
    end
```
