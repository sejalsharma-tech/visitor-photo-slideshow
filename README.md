# Visitor Photo Slideshow

A real-time web application where visitors upload photos from their devices and immediately see them play in a slideshow on a Smart TV or computer display. Returning visitors automatically see their previous photos alongside their new uploads.

## Tech Stack
* **Backend:** Node.js, Express.js, Socket.io, Multer
* **Database:** MySQL
* **Frontend:** HTML5, CSS3, Vanilla JavaScript

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
   Edit `.env` with your local MySQL credentials.
4. **Initialize the database:**
   Start MySQL (`brew services start mysql`) and run:
   ```bash
   mysql -u root < database/schema.sql
   ```
5. **Start the server:**
   ```bash
   node src/server.js
   ```
6. **Open the app:**
   * **Visitor Upload Page:** `http://localhost:3000`
   * **Smart TV Slideshow Display:** `http://localhost:3000/display`

## Documentation
* [Assumptions & Design Decisions](ASSUMPTIONS.md)
* [System Architecture](ARCHITECTURE.md)
* [AI Interaction Log](AI_LOG.md)
* [Test Plan & Results](tests/TEST_PLAN.md)
