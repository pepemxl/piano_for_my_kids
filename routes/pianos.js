const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT id, slug, brand, model, num_keys AS numKeys,
            lowest_midi AS lowestMidi, highest_midi AS highestMidi,
            description, is_default AS isDefault
     FROM pianos ORDER BY is_default DESC, brand, model`
  );
  res.json(rows);
});

router.post('/select', requireAuth, async (req, res) => {
  const { pianoId } = req.body || {};
  if (!pianoId) return res.status(400).json({ error: 'pianoId required' });
  const [rows] = await pool.execute('SELECT id FROM pianos WHERE id = ?', [pianoId]);
  if (!rows[0]) return res.status(404).json({ error: 'piano not found' });
  await pool.execute('UPDATE users SET selected_piano_id = ? WHERE id = ?', [
    pianoId,
    req.session.userId
  ]);
  res.json({ ok: true });
});

module.exports = router;
