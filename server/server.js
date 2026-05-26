require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const authRouter       = require('./routes/auth');
const membershipRouter = require('./routes/membership');
const adminRouter      = require('./routes/admin');
const protect          = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 5000;

// Root of the project:
// 1. STATIC_PATH env var (set this in hosting control panel if needed)
// 2. process.cwd() if index.html is found there (IIS sets CWD to app root)
// 3. Fall back to one level up from /server
const fs = require('fs');
const ROOT = process.env.STATIC_PATH ||
  (fs.existsSync(path.join(process.cwd(), 'index.html')) ? process.cwd() : path.join(__dirname, '..'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes (registered before static so they are never shadowed)
app.use('/api/auth',       authRouter);
app.use('/api/membership', membershipRouter);
app.use('/api/admin',      protect, adminRouter);

// Serve uploaded passport photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve admin panel
app.use('/admin', express.static(path.join(ROOT, 'admin')));

// Serve public static assets
app.use('/assets', express.static(path.join(ROOT, 'assets')));
app.use(express.static(ROOT));

// Explicit fallback routes for main pages
app.get('/',            (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/membership',  (req, res) => res.sendFile(path.join(ROOT, 'membership.html')));
app.get('/admin',       (req, res) => res.sendFile(path.join(ROOT, 'admin', 'login.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(ROOT, 'admin', 'login.html')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`ANCHORMPCS server running on http://localhost:${PORT}`));
