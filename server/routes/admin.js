const router  = require('express').Router();
const db      = require('../config/db');

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [[counts]] = await db.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'Pending')  AS pending,
      SUM(status = 'Approved') AS approved,
      SUM(status = 'Rejected') AS rejected
    FROM members
  `);
  const [[payments]] = await db.query(`
    SELECT
      COUNT(*) AS total_payments,
      SUM(status = 'Pending')   AS pending_payments,
      SUM(status = 'Confirmed') AS confirmed_payments,
      SUM(CASE WHEN status = 'Confirmed' THEN amount ELSE 0 END) AS total_confirmed_amount
    FROM payments
  `);
  res.json({ ...counts, ...payments });
});

// GET /api/admin/members?status=&search=&page=&limit=
router.get('/members', async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];

  if (status) { conditions.push('status = ?'); params.push(status); }
  if (search) {
    conditions.push('(full_name LIKE ? OR phone LIKE ? OR email LIKE ? OR member_number LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM members ${where}`, params);
  const [rows] = await db.query(
    `SELECT id, full_name, phone, email, membership_type, num_shares, share_amount,
            status, member_number, created_at
     FROM members ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );

  res.json({ total, page: parseInt(page), limit: parseInt(limit), members: rows });
});

// GET /api/admin/members/:id
router.get('/members/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM members WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Member not found' });
  res.json(rows[0]);
});

// PATCH /api/admin/members/:id/approve
router.patch('/members/:id/approve', async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.query('SELECT * FROM members WHERE id = ?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Member not found' });

  // Generate member_number if not already set
  const member_number = rows[0].member_number || `ANC-${String(id).padStart(5, '0')}`;

  await db.query(
    `UPDATE members SET status='Approved', member_number=?, approved_by=?, approved_at=NOW(),
     rejection_reason=NULL WHERE id=?`,
    [member_number, req.admin.id, id]
  );
  res.json({ success: true, member_number });
});

// PATCH /api/admin/members/:id/reject
router.patch('/members/:id/reject', async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Rejection reason required' });

  const [rows] = await db.query('SELECT id FROM members WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Member not found' });

  await db.query(
    `UPDATE members SET status='Rejected', rejection_reason=?, approved_by=?, approved_at=NOW()
     WHERE id=?`,
    [reason, req.admin.id, req.params.id]
  );
  res.json({ success: true });
});

// PATCH /api/admin/members/:id/pending  — undo approval/rejection
router.patch('/members/:id/pending', async (req, res) => {
  await db.query(
    `UPDATE members SET status='Pending', rejection_reason=NULL, approved_by=NULL, approved_at=NULL
     WHERE id=?`,
    [req.params.id]
  );
  res.json({ success: true });
});

// DELETE /api/admin/members/:id  — superadmin only
router.delete('/members/:id', async (req, res) => {
  if (req.admin.role !== 'superadmin')
    return res.status(403).json({ error: 'Superadmin access required' });
  await db.query('DELETE FROM payments WHERE member_id = ?', [req.params.id]);
  await db.query('DELETE FROM members WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ── Payments ──────────────────────────────────────────────────

// GET /api/admin/payments?member_id=&status=&page=&limit=
router.get('/payments', async (req, res) => {
  const { member_id, status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = [];

  if (member_id) { conditions.push('p.member_id = ?'); params.push(member_id); }
  if (status)    { conditions.push('p.status = ?');    params.push(status); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM payments p ${where}`, params
  );
  const [rows] = await db.query(
    `SELECT p.*, m.full_name, m.member_number
     FROM payments p JOIN members m ON p.member_id = m.id
     ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), offset]
  );
  res.json({ total, page: parseInt(page), limit: parseInt(limit), payments: rows });
});

// POST /api/admin/payments  — record a payment
router.post('/payments', async (req, res) => {
  const { member_id, payment_type, amount, reference, notes } = req.body;
  if (!member_id || !payment_type || !amount)
    return res.status(400).json({ error: 'member_id, payment_type, and amount are required' });

  const [result] = await db.query(
    `INSERT INTO payments (member_id, payment_type, amount, reference, notes) VALUES (?,?,?,?,?)`,
    [member_id, payment_type, amount, reference || null, notes || null]
  );
  res.status(201).json({ success: true, payment_id: result.insertId });
});

// PATCH /api/admin/payments/:id/confirm
router.patch('/payments/:id/confirm', async (req, res) => {
  await db.query(
    `UPDATE payments SET status='Confirmed', confirmed_by=? WHERE id=?`,
    [req.admin.id, req.params.id]
  );
  res.json({ success: true });
});

// PATCH /api/admin/payments/:id/reject
router.patch('/payments/:id/reject', async (req, res) => {
  await db.query(
    `UPDATE payments SET status='Rejected', confirmed_by=? WHERE id=?`,
    [req.admin.id, req.params.id]
  );
  res.json({ success: true });
});

module.exports = router;
