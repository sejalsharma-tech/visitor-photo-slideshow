const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES, files: 5 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg, .jpeg, .png, and .webp images are allowed.'));
    }
  },
});

router.get('/config', (req, res) => {
  res.json({
    slideDurationMs: parseInt(process.env.SLIDE_DURATION_MS, 10) || 5000,
  });
});

router.post('/upload', upload.array('photos', 5), async (req, res) => {
  try {
    const { name, identifier, consent } = req.body;
    const files = req.files;

    if (!name || !identifier) {
      return res.status(400).json({ error: 'Name and Email/Phone are required.' });
    }
    if (consent !== 'true') {
      return res.status(400).json({ error: 'Public display consent is required.' });
    }
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Please upload at least one photo.' });
    }

    const normalizedId = identifier.trim().toLowerCase();
    const cleanName = name.trim();

    const [existingVisitors] = await db.query(
      'SELECT * FROM visitors WHERE identifier = ?',
      [normalizedId]
    );

    let visitorId;
    let isReturning = false;
    let previousPhotos = [];

    if (existingVisitors.length > 0) {
      isReturning = true;
      visitorId = existingVisitors[0].id;

      await db.query('UPDATE visitors SET name = ? WHERE id = ?', [cleanName, visitorId]);

      const [prevRows] = await db.query(
        'SELECT filename FROM photos WHERE visitor_id = ? ORDER BY uploaded_at DESC LIMIT 5',
        [visitorId]
      );
      previousPhotos = prevRows.map((row) => ({
        url: `/uploads/${row.filename}`,
        isPrevious: true,
      }));
    } else {
      const [result] = await db.query(
        'INSERT INTO visitors (name, identifier, consent_given, consent_timestamp) VALUES (?, ?, TRUE, NOW())',
        [cleanName, normalizedId]
      );
      visitorId = result.insertId;
    }

    const newPhotos = [];
    for (const file of files) {
      await db.query(
        'INSERT INTO photos (visitor_id, filename, original_name, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?)',
        [visitorId, file.filename, file.originalname, file.mimetype, file.size]
      );
      newPhotos.push({
        url: `/uploads/${file.filename}`,
        isPrevious: false,
      });
    }

    const io = req.app.get('io');
    const slideshowBatch = {
      visitorName: cleanName,
      isReturning,
      photos: [...newPhotos, ...previousPhotos],
    };
    io.emit('new-slideshow-batch', slideshowBatch);

    res.status(201).json({
      message: isReturning
        ? `Welcome back, ${cleanName}! Your new and previous photos are queued.`
        : `Thank you, ${cleanName}! Your photos are now queued for display.`,
      visitorName: cleanName,
      isReturning,
      uploadedCount: newPhotos.length,
      previousCount: previousPhotos.length,
      uploadedPhotos: newPhotos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while processing upload.' });
  }
});

router.delete('/photos', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or Phone is required.' });
    }

    const normalizedId = identifier.trim().toLowerCase();
    const [visitors] = await db.query('SELECT id FROM visitors WHERE identifier = ?', [normalizedId]);

    if (visitors.length === 0) {
      return res.status(404).json({ error: 'No records found for this Email/Phone.' });
    }

    const visitorId = visitors[0].id;
    const [photos] = await db.query('SELECT filename FROM photos WHERE visitor_id = ?', [visitorId]);

    photos.forEach((p) => {
      const filePath = path.join(__dirname, '../../uploads', p.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await db.query('DELETE FROM visitors WHERE id = ?', [visitorId]);

    res.json({ message: 'All your photos and data have been permanently deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete photos.' });
  }
});

module.exports = router;
