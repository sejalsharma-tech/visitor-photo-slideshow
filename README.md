# LuminaCast — Visitor Photo Slideshow

A real-time web application where visitors upload photos from their phones or laptops and immediately see them play in a 5-second-per-slide showcase on a Smart TV or computer display. Returning visitors automatically replay their previous photos alongside new uploads.

## Features
* **Real-Time Live Slideshow (`/display`):** Instant Socket.io streaming with 5-second slide timing, blurred ambient backdrops, Ken Burns motion, countdown progress bar, and continuous looping when idle.
* **Returning Visitor Recognition:** Identifies repeat visitors via normalized Email or Phone Number in MySQL and plays new photos (`Welcome Back!`) followed by up to 5 previous photos (`Memory from Previous Visit`)[cite: 1].
* **Order-Independent Sync:** Works whether `/display` is opened before or after uploads by syncing from the server buffer and MySQL on connect.
* **Privacy & Consent Controls:** Mandatory public display consent with timestamp logging plus one-click permanent deletion (`Remove My Photos`) that removes files from disk, rows from MySQL, and active slides from the TV queue[cite: 1].
* **LAN QR Code & Live Reactions:** Auto-detects the host machine's local Wi-Fi IPv4 address to display scannable QR codes on both `/` and `/display`, plus floating live emoji reactions.

## Tech Stack
* **Backend:** Node.js, Express.js, Socket.io, Multer, QRCode
* **Database:** MySQL (`mysql2/promise`)
* **Frontend:** HTML5, CSS3 (Glassmorphism + Aurora UI), Vanilla JavaScript, HTML5 Canvas

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
   Edit `.env` with your local MySQL credentials (`SLIDE_DURATION_MS=5000` is preconfigured)[cite: 1].

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
