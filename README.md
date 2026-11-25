# LuminaCast — Visitor Photo Slideshow

A real-time web application where visitors upload photos from their phones or laptops and immediately see them play in a 5-second-per-slide showcase on a Smart TV or computer display. Returning visitors automatically replay their previous photos alongside new uploads.

## Key Features
* **Real-Time TV Slideshow (`/display`):** Instant Socket.io streaming with 5-second slide timing, blurred ambient backdrops, Ken Burns motion, countdown progress bar, synthesized Web Audio arrival chime, and continuous looping when idle.
* **Custom TV Photo Frames & Shoutouts:** Visitors can choose `Glass`, `Polaroid`, `Warm Film`, or `Noir B&W` styling and attach an optional 80-character shoutout caption protected by a server-side profanity filter.
* **Returning Visitor Recognition:** Identifies repeat visitors via normalized Email or Phone Number in MySQL and plays new photos (`Welcome Back!`) followed by up to 5 previous photos (`Memory from Previous Visit`).
* **Host TV Controls & Moderation:** Built-in HUD buttons and keyboard shortcuts (`Space` Pause/Resume, `ArrowRight` Next Slide, `H` Hide Slide, plus Chime Mute toggle).
* **Privacy & Consent Controls:** Mandatory public display consent with timestamp logging plus one-click permanent deletion (`Remove My Photos`) that removes files from disk, rows from MySQL, and active slides from the TV queue.
* **LAN QR Code & Live Reactions:** Auto-detects the host machine's local Wi-Fi IPv4 address to display scannable QR codes on both `/` and `/display`, plus floating live emoji reactions.

## TV Display Host Controls (`/display`)
| Shortcut / Button | Action |
| :--- | :--- |
| `Space` / **Pause** | Freeze or resume the current slide and countdown bar |
| `ArrowRight` / **Next** | Skip immediately to the next photo in the queue |
| `H` / **Hide Slide** | Instantly remove the active slide from the screen and loop |
| **Chime On / Muted** | Toggle the synthesized Web Audio arrival chime |
| **Fullscreen** | Expand `/display` to full screen for Smart TVs |

## Tech Stack
* **Backend:** Node.js, Express.js, Socket.io, Multer, QRCode
* **Database:** MySQL (`mysql2/promise`)
* **Frontend:** HTML5, CSS3 (Glassmorphism + Aurora UI), Vanilla JavaScript, HTML5 Canvas, Web Audio API

## Repository Structure
```text
visitor-photo-slideshow/
├── database/schema.sql      # MySQL database & table definitions
├── public/
│   ├── upload.html          # Visitor upload, frame picker & QR share page (/)
│   ├── display.html         # Smart TV slideshow display & host HUD (/display)
│   ├── css/style.css        # Aurora glassmorphism, frame styles & TV display CSS
│   └── js/                  # Client logic (upload.js, display.js, bg-canvas.js)
├── src/
│   ├── server.js            # Express + Socket.io server & replay buffer
│   ├── db.js                # MySQL connection pool & safe column migration
│   └── routes/upload.js     # Multer validation, profanity guard, upload & opt-out API
├── tests/
│   ├── api.test.js          # Automated Node integration test suite (6 checks)
│   └── TEST_PLAN.md         # Manual test plan & verification results
├── .env.example             # Environment variable placeholders
├── ASSUMPTIONS.md           # Documented design decisions & gap resolutions
├── ARCHITECTURE.md          # Stack rationale, data model & sequence diagram
├── AI_LOG.md                # Key AI prompts & 4 bug-fix case studies
└── README.md                # Setup & run guide
```

## Setup & Run Instructions (macOS)

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd visitor-photo-slideshow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your local MySQL credentials (`SLIDE_DURATION_MS=5000` is preconfigured).

4. **Initialize MySQL database:**
   ```bash
   brew services start mysql
   mysql -u root < database/schema.sql
   ```

5. **Start the server:**
   ```bash
   node src/server.js
   ```

6. **Open the app:**
   * **Visitor Upload Page:** `http://localhost:3000`
   * **Smart TV Slideshow Display:** `http://localhost:3000/display`

7. **Run automated tests (with server running in another terminal):**
   ```bash
   node --test tests/api.test.js
   ```

## Documentation
* [Assumptions & Design Decisions](ASSUMPTIONS.md)
* [System Architecture](ARCHITECTURE.md)
* [AI Interaction Log](AI_LOG.md)
* [Test Suite & Manual Results](tests/TEST_PLAN.md)
