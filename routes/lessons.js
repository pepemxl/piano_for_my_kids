const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT l.id, l.slug, l.module, l.title, l.description, l.difficulty, l.ordering,
            JSON_LENGTH(l.steps_json) AS totalSteps,
            COALESCE(p.completed_steps, 0) AS completedSteps,
            COALESCE(p.best_score, 0) AS bestScore,
            p.completed_at AS completedAt
     FROM lessons l
     LEFT JOIN user_progress p
       ON p.lesson_id = l.id AND p.user_id = ?
     ORDER BY l.ordering, l.id`,
    [req.session.userId]
  );
  res.json(rows);
});

router.get('/:slug', requireAuth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, slug, module, title, description, difficulty, ordering, steps_json
     FROM lessons WHERE slug = ? LIMIT 1`,
    [req.params.slug]
  );
  const lesson = rows[0];
  if (!lesson) return res.status(404).json({ error: 'lesson not found' });

  // mysql2 returns JSON columns already parsed in newer versions; guard either way.
  const steps = typeof lesson.steps_json === 'string'
    ? JSON.parse(lesson.steps_json)
    : lesson.steps_json;

  const [progressRows] = await pool.execute(
    `SELECT completed_steps AS completedSteps, best_score AS bestScore,
            attempts, completed_at AS completedAt
     FROM user_progress WHERE user_id = ? AND lesson_id = ?`,
    [req.session.userId, lesson.id]
  );

  res.json({
    id: lesson.id,
    slug: lesson.slug,
    module: lesson.module,
    title: lesson.title,
    description: lesson.description,
    difficulty: lesson.difficulty,
    ordering: lesson.ordering,
    steps,
    progress: progressRows[0] || { completedSteps: 0, bestScore: 0, attempts: 0, completedAt: null }
  });
});

module.exports = router;
