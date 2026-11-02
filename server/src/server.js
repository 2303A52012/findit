const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Flexible CORS supporting local development, custom domains, or fullstack hosting
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const clientOrigin = process.env.CLIENT_ORIGIN;
    if (!clientOrigin || clientOrigin === '*' || clientOrigin.trim() === '') {
      return callback(null, true);
    }
    const allowed = clientOrigin.split(',').map(s => s.trim().replace(/\/$/, ''));
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowed.includes(cleanOrigin) || allowed.includes('*')) {
      return callback(null, true);
    }
    // Allow local development callers
    if (cleanOrigin.startsWith('http://localhost:') || cleanOrigin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint for uptime monitoring & container probes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Main API routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/me', dashboardRoutes);

// In production, serve static client files if build exists (Unified single-service deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Express 4/5 compatible SPA fallback (bypasses path-to-regexp wildcard syntax issues)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// 404 for unmatched API routes
app.use((req, res) => res.status(404).json({ message: 'API endpoint not found' }));

// Global error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(error.errors)[0].message });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with that value already exists' });
  }
  res.status(500).json({ message: 'Internal server error' });
});

async function start() {
  await connectDatabase();
  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`FindIt server is active on port ${port} (0.0.0.0)`);
  });
}

if (require.main === module) {
  start().catch(error => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}

module.exports = { app, start };
