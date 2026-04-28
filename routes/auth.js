const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { username, displayName, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'password must be at least 6 characters' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    const [defaultPiano] = await pool.query(
      'SELECT id FROM pianos WHERE is_default = 1 LIMIT 1'
    );
    const defaultPianoId = defaultPiano[0]?.id || null;

    const [result] = await pool.execute(
      `INSERT INTO users (username, display_name, password_hash, selected_piano_id)
       VALUES (?, ?, ?, ?)`,
      [username, displayName || username, hash, defaultPianoId]
    );

    req.session.userId = result.insertId;
    req.session.username = username;
    res.json({ ok: true, userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'username already taken' });
    }
    console.error('signup error', err);
    res.status(500).json({ error: 'signup failed' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const [rows] = await pool.execute(
    `SELECT id, username, display_name, password_hash, selected_piano_id
     FROM users WHERE username = ? LIMIT 1`,
    [username]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      selectedPianoId: user.selected_piano_id
    }
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: 'not authenticated' });
  const [rows] = await pool.execute(
    `SELECT id, username, display_name, selected_piano_id FROM users WHERE id = ?`,
    [req.session.userId]
  );
  const u = rows[0];
  if (!u) return res.status(401).json({ error: 'not authenticated' });
  res.json({
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    selectedPianoId: u.selected_piano_id
  });
});

module.exports = router;
