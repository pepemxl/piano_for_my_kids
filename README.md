# Piano for My Kids

A small web app to teach kids piano. Login + session via MySQL, a 4-module
learning plan, an interactive 88-key piano visualization, and Web MIDI support
so the kids can play their real Yamaha P-145.

## What's inside

- **Backend**: Node.js + Express, MySQL via `mysql2`, sessions in MySQL via
  `express-mysql-session`, password hashing with `bcrypt`.
- **Frontend**: vanilla HTML/CSS/JS — no build step.
- **Piano**: full 88-key SVG-style keyboard (A0–C8), supports mouse,
  computer keyboard, and Web MIDI input. Tones synthesized via WebAudio.
- **Curriculum**: note recognition, simple songs (Twinkle, Mary Had a Little
  Lamb, Ode to Joy), scales / finger exercises (C major, five-finger,
  Hanon-style), and reading-music basics.
- **Pianos**: pre-configured for **Yamaha P-145** (88 keys, A0–C8). Two extra
  presets for 61- and 49-key keyboards if a kid prefers a smaller range.

## Quickstart with Docker (recommended for development)

Requires Docker + Docker Compose. No need to install Node or MySQL locally.

```bash
cp .env.example .env       # only needed for local (non-Docker) runs
make up                    # starts mysql + app + adminer
make seed                  # loads the lesson plan (run once)
```

Then open:

- **App**: <http://localhost:3000>
- **Adminer** (DB browser): <http://localhost:8080>
  — server `mysql`, user `piano_user`, password `piano_password`, database `piano_for_my_kids`.

Useful targets — run `make help` to see them all:

| Target          | What it does                                                |
| --------------- | ----------------------------------------------------------- |
| `make up`       | Start all containers in the background                      |
| `make down`     | Stop containers (volumes preserved)                         |
| `make logs-app` | Tail the Node app logs                                      |
| `make seed`     | Re-load `data/lessons.js` into MySQL                        |
| `make shell-db` | Open a `mysql` shell as the app user                        |
| `make reset-db` | **Destructive**: drop the DB volume and re-init from scratch |
| `make clean`    | Remove containers and volumes                               |

The app container hot-reloads via `node --watch`; just edit files and refresh the browser.

## Manual setup (without Docker)

### 1. Install MySQL

Install MySQL 8.x locally (or run it in Docker). Then create a user and
database — easiest is to run the bundled schema:

```bash
mysql -u root -p < db/schema.sql
```

This creates the `piano_for_my_kids` database, the tables, and seeds the
piano presets.

If you want a dedicated DB user (recommended), run:

```sql
CREATE USER 'piano_user'@'localhost' IDENTIFIED BY 'piano_password';
GRANT ALL PRIVILEGES ON piano_for_my_kids.* TO 'piano_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Configure environment

```bash
cp .env.example .env
# edit .env with your DB credentials and a long random SESSION_SECRET
```

### 3. Install Node dependencies

Requires Node 18+.

```bash
npm install
```

### 4. Seed the lesson plan

```bash
npm run db:init
```

This loads the curriculum from `data/lessons.js` into the `lessons` table.
Re-run it any time you edit the curriculum.

### 5. Start the server

```bash
npm start
# or, with auto-reload on file change:
npm run dev
```

Open <http://localhost:3000>.

## Using a real Yamaha P-145

1. Connect the P-145 to the computer with a USB cable (USB-B to USB-A or
   USB-C, depending on your machine).
2. Open the app in **Chrome or Edge** — Web MIDI is not supported in
   Safari or Firefox by default.
3. The badge in the top-right of the lesson page will say
   "MIDI: 1 device(s) connected" once the piano is detected.
4. Play keys on the P-145 — the on-screen piano will mirror your input
   and validate the lesson steps.

If no MIDI device is connected, kids can still use the on-screen piano
(mouse) or their computer keyboard:

- White keys: `A S D F G H J K L ;` → `C D E F G A B C D E`
- Black keys: `W E T Y U O P` → `C# D# F# G# A# C#5 D#5`

## Project layout

```
.
├── server.js                  # Express entry
├── config/db.js               # MySQL pool
├── middleware/auth.js         # requireAuth
├── routes/                    # auth, pianos, lessons, progress
├── data/lessons.js            # curriculum source of truth
├── db/schema.sql              # MySQL schema + piano seeds
├── scripts/init-db.js         # loads lessons into MySQL
├── Dockerfile, docker-compose.yml, Makefile  # dev environment
└── public/                    # static frontend
    ├── login.html, signup.html, dashboard.html, lesson.html
    ├── css/style.css
    └── js/auth.js, dashboard.js, piano.js, midi.js, lesson.js
```

## Adding more songs / lessons

Edit `data/lessons.js`, then re-run:

```bash
npm run db:init
```

Step types supported:

| Type             | Fields                              | Behavior                                       |
| ---------------- | ----------------------------------- | ---------------------------------------------- |
| `info`           | `text`                              | Shows a tip; user clicks "Skip step" to move on |
| `play_note`      | `midi`, `label?`, `prompt`          | Highlights one key; user must press it          |
| `play_sequence`  | `midis[]`, `prompt`                 | Highlights keys in order, advancing per hit    |
| `identify_note`  | `midi`, `prompt`                    | Same validation as `play_note`, no highlight   |

MIDI numbers: middle C = 60, A0 = 21, C8 = 108.

## Adding more pianos

Insert a row into the `pianos` table (or extend the seed in
`db/schema.sql`). Each piano has a `lowest_midi` / `highest_midi` range —
the on-screen keyboard sizes itself to that range.

## Security notes

- Passwords hashed with bcrypt (cost 12).
- Session cookies are `httpOnly` + `sameSite=lax`.
- For production, set `SESSION_SECRET` to a long random value, run behind
  HTTPS, and set `cookie.secure = true` in `server.js`.
