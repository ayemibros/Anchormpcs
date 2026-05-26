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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded passport photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve admin panel static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Serve public pages
app.use(express.static(path.join(__dirname, '..')));

// API routes
app.use('/api/auth',       authRouter);
app.use('/api/membership', membershipRouter);
app.use('/api/admin',      protect, adminRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`ANCHORMPCS server running on http://localhost:${PORT}`));
