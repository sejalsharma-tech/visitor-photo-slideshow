const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('io', io);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', uploadRoutes);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/upload.html')));
app.get('/display', (req, res) => res.sendFile(path.join(__dirname, '../public/display.html')));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: `File too large. Max size is ${process.env.MAX_FILE_SIZE_MB || 5}MB.` });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Maximum 5 photos allowed per upload.' });
    }
  }
  res.status(400).json({ error: err.message || 'Upload failed.' });
});

io.on('connection', (socket) => {
  console.log('Display/Client connected:', socket.id);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`TV Display available at http://localhost:${PORT}/display`);
});
