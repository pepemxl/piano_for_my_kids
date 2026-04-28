const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { lessonId, completedSteps, totalSteps, score } = req.body || {};
  if (!lessonId || completedSteps == null || !totalSteps) {
    return res.status(400).json({ error: 'lessonId, completedSteps, totalSteps required' });
  }

  const completedAt = completedSteps >= totalSteps ? new Date() : null;
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  await pool.execute(
    `INSERT INTO user_progress
       (user_id, lesson_id, completed_steps, total_steps, best_score, attempts, last_attempt_at, completed_at)
     VALUES (?, ?, ?, ?, ?, 1, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       completed_steps = GREATEST(completed_steps, VALUES(completed_steps)),
       total_steps     = VALUES(total_steps),
       best_score      = GREATEST(best_score, VALUES(best_score)),
       attempts        = attempts + 1,
       last_attempt_at = VALUES(last_attempt_at),
       completed_at    = COALESCE(completed_at, VALUES(completed_at))`,
    [req.session.userId, lessonId, completedSteps, totalSteps, safeScore, completedAt]
  );

  res.json({ ok: true });
});

router.get('/summary', requireAuth, async (req, res) => {
  const [[totals]] = await pool.execute(
    `SELECT
       COUNT(*) AS lessonsStarted,
       SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS lessonsCompleted,
       COALESCE(AVG(best_score), 0) AS avgScore
     FROM user_progress WHERE user_id = ?`,
    [req.session.userId]
  );
  const [[totalLessons]] = await pool.query(
    `SELECT COUNT(*) AS total FROM lessons`
  );
  res.json({
    lessonsStarted: Number(totals.lessonsStarted) || 0,
    lessonsCompleted: Number(totals.lessonsCompleted) || 0,
    averageScore: Math.round(Number(totals.avgScore) || 0),
    totalLessons: Number(totalLessons.total) || 0
  });
});

module.exports = router;
