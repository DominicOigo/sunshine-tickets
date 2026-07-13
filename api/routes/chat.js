const router = require('express').Router();
const pool   = require('../db/pool');
const { auth, requireRole } = require('../middleware/auth');

// POST /api/chat/conversations — create a new conversation (public)
router.post('/conversations', async (req, res) => {
  const { user_name, user_email } = req.body;
  try {
    const { rows } = await pool.query(
      `insert into conversations (user_name, user_email, user_id)
       values ($1, $2, $3) returning *`,
      [user_name || 'Guest', user_email || null, req.user?.id || null]
    );
    const conv = rows[0];
    await pool.query(
      `insert into notifications (recipient_id, type, title, message, link, is_read)
       values(null, 'new_chat', 'New Chat Conversation', $1, '/admin/messages', false)`,
      [`${conv.user_name} started a new chat conversation.`]
    );
    res.status(201).json(conv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/chat/conversations/:id — get conversation with messages (public with token)
router.get('/conversations/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from conversations where id = $1', [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Conversation not found' });
    const { rows: messages } = await pool.query(
      'select * from messages where conversation_id = $1 order by created_at asc',
      [req.params.id]
    );
    res.json({ ...rows[0], messages });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/chat/conversations/:id/messages — send a message (public)
router.post('/conversations/:id/messages', async (req, res) => {
  const { sender_name, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  try {
    const { rows } = await pool.query(
      `insert into messages (conversation_id, sender_type, sender_name, content)
       values ($1, 'user', $2, $3) returning *`,
      [req.params.id, sender_name || 'Guest', content]
    );
    await pool.query(
      'update conversations set updated_at = now() where id = $1',
      [req.params.id]
    );
    await pool.query(
      `insert into notifications (recipient_id, type, title, message, link, is_read)
       values(null, 'chat_message', 'New Chat Message', $1, '/admin/messages', false)`,
      [`${sender_name || 'Guest'}: ${content.slice(0, 80)}`]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/chat/conversations — list all conversations (admin)
router.get('/admin/conversations', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      select c.*,
        (select count(*) from messages m where m.conversation_id = c.id) as message_count,
        (select content from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as last_message
      from conversations c
      order by c.updated_at desc
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/admin/chat/conversations/:id — admin view conversation
router.get('/admin/conversations/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select * from conversations where id = $1', [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Conversation not found' });
    const { rows: messages } = await pool.query(
      'select * from messages where conversation_id = $1 order by created_at asc',
      [req.params.id]
    );
    res.json({ ...rows[0], messages });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/admin/chat/conversations/:id/messages — admin replies
router.post('/admin/conversations/:id/messages', auth, requireRole('admin'), async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  try {
    const { rows } = await pool.query(
      `insert into messages (conversation_id, sender_type, sender_name, content)
       values ($1, 'admin', $2, $3) returning *`,
      [req.params.id, req.user?.full_name || 'Support', content]
    );
    await pool.query(
      'update conversations set updated_at = now() where id = $1',
      [req.params.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/admin/chat/conversations/:id/close — close a conversation
router.patch('/admin/conversations/:id/close', auth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      "update conversations set status = 'closed', updated_at = now() where id = $1 returning *",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Conversation not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
