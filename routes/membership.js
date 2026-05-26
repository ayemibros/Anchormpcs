const router = require('express').Router();
const multer = require('multer');
const path   = require('path');
const db     = require('../config/db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `passport_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    /^image\/(jpeg|png|webp)$/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPEG/PNG/WEBP images allowed'));
  },
});

// POST /api/membership  — public form submission
router.post('/', upload.single('passport_photo'), async (req, res) => {
  try {
    const f = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const shareAmount = (parseInt(f.num_shares) || 1) * 25000;

    const [result] = await db.query(
      `INSERT INTO members (
        full_name, date_of_birth, gender, marital_status, occupation,
        nationality, id_number, phone, rc_number, email, state_of_origin,
        residential_address, passport_photo,
        employer_name, work_address, income_range,
        membership_type, num_shares, share_amount, purpose,
        kin_name, kin_relationship, kin_phone, kin_address,
        savings_plan
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        f.full_name, f.dob || null, f.gender, f.marital_status || null, f.occupation || null,
        f.nationality || null, f.id_number || null, f.phone, f.rc_number || null,
        f.email || null, f.state_of_origin || null, f.residential_address || null, photoPath,
        f.employer_name || null, f.work_address || null, f.income_range || null,
        f.membership_type, parseInt(f.num_shares) || 1, shareAmount, f.purpose || null,
        f.kin_name || null, f.kin_relationship || null, f.kin_phone || null, f.kin_address || null,
        f.savings_plan || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. You will be contacted within 3–5 business days.',
      application_id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Submission failed. Please try again.' });
  }
});

// GET /api/membership/check/:phone  — let applicant check their status
router.get('/check/:phone', async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, full_name, membership_type, status, member_number, created_at
     FROM members WHERE phone = ? ORDER BY created_at DESC LIMIT 1`,
    [req.params.phone]
  );
  if (!rows.length) return res.status(404).json({ error: 'No application found for this phone number' });
  res.json(rows[0]);
});

module.exports = router;
