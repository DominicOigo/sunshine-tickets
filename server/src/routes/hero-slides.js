const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/hero-slides — public, returns active slides ordered by sort_order
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from hero_slides where is_active = true order by sort_order asc, created_at desc'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/hero-slides/all — admin sees all
router.get('/all', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from hero_slides order by sort_order asc, created_at desc'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/hero-slides — admin creates
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { image_url, title, subtitle, link_url, link_text, sort_order, is_active } = req.body;
  if (!image_url) return res.status(400).json({ error: 'image_url is required' });
  try {
    const { rows } = await pool.query(
      `insert into hero_slides (image_url, title, subtitle, link_url, link_text, sort_order, is_active)
       values($1,$2,$3,$4,$5,$6,$7) returning *`,
      [image_url, title||'', subtitle||'', link_url||null, link_text||'Explore Events', sort_order??0, is_active??true]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/hero-slides/:id — admin updates
router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  const { image_url, title, subtitle, link_url, link_text, sort_order, is_active } = req.body;
  try {
    const sets = []; const vals = []; let i = 1;
    if (image_url !== undefined) { sets.push(`image_url=$${i++}`); vals.push(image_url); }
    if (title !== undefined)      { sets.push(`title=$${i++}`);      vals.push(title); }
    if (subtitle !== undefined)   { sets.push(`subtitle=$${i++}`);   vals.push(subtitle); }
    if (link_url !== undefined)   { sets.push(`link_url=$${i++}`);   vals.push(link_url); }
    if (link_text !== undefined)  { sets.push(`link_text=$${i++}`);  vals.push(link_text); }
    if (sort_order !== undefined) { sets.push(`sort_order=$${i++}`); vals.push(sort_order); }
    if (is_active !== undefined)  { sets.push(`is_active=$${i++}`);  vals.push(is_active); }
    sets.push(`updated_at=now()`);
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `update hero_slides set ${sets.join(',')} where id=$${i} returning *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: 'Slide not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/hero-slides/:id — admin deletes
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('delete from hero_slides where id=$1', [req.params.id]);
    res.json({ message: 'Slide deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
