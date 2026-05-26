require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRouter       = require('./server/routes/auth');
const membershipRouter = require('./server/routes/membership');
const adminRouter      = require('./server/routes/admin');
const protect          = require('./server/middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes first — never shadowed by static
app.use('/api/auth',       authRouter);
app.use('/api/membership', membershipRouter);
app.use('/api/admin',      protect, adminRouter);

// Static files — __dirname is now the project root
app.use('/uploads', express.static(path.join(__dirname, 'server', 'uploads')));
app.use(express.static(path.join(__dirname)));

// Explicit page routes
app.get('/',            (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/membership',  (req, res) => res.sendFile(path.join(__dirname, 'membership.html')));

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`ANCHORMPCS running on http://localhost:${PORT}`));
