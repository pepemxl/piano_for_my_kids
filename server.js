require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const authRoutes = require('./routes/auth');
const lessonRoutes = require('./routes/lessons');
const pianoRoutes = require('./routes/pianos');
const progressRoutes = require('./routes/progress');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = Number(process.env.PORT || 3000);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  createDatabaseTable: true
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/pianos', pianoRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);

// Protected pages: require auth before serving the static asset.
app.get(['/dashboard.html', '/lesson.html'], requireAuth, (req, res, next) => next());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  if (req.session?.userId) return res.redirect('/dashboard.html');
  res.redirect('/login.html');
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`Piano for My Kids running on http://localhost:${PORT}`);
});
