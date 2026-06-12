/**
 * WC2026 Predictor - Backend Server + Telegram Bot
 * 
 * - Serves API for the mini-app
 * - Persists matches + predictions to data/db.json
 * - Validates Telegram WebApp initData for real user identification + security
 * - Launches the mini-app via bot (sends WebApp button on /start)
 * - Admin actions restricted to ADMIN_IDS
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173'; // dev default
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(Number);

// Real users
const IVAN_ID = 948806223;
const ROMAN_ID = 1252235003;

if (!BOT_TOKEN) {
  console.warn('⚠️  BOT_TOKEN is not set in .env — bot features disabled.');
}

app.use(cors()); // In production you may want to lock this to your WEBAPP_URL origin
app.use(express.json({ limit: '1mb' }));

// ---------- Data persistence ----------
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Exact same types & logic as frontend
const INITIAL_MATCHES = [
  { id: 1, homeTeam: "Mexico", awayTeam: "South Africa", date: "Jun 11 • 3:00 PM — Estadio Azteca, Mexico City", stage: "Group A", status: "finished", homeScore: 2, awayScore: 0 },
  { id: 2, homeTeam: "South Korea", awayTeam: "Czechia", date: "Jun 11 • 10:00 PM — Estadio Akron, Guadalajara", stage: "Group A", status: "finished", homeScore: 2, awayScore: 1 },
  { id: 3, homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", date: "Jun 12 • 3:00 PM — BMO Field, Toronto", stage: "Group B", status: "finished", homeScore: 1, awayScore: 1 },
  { id: 4, homeTeam: "United States", awayTeam: "Paraguay", date: "Jun 12 • 9:00 PM — SoFi Stadium, Inglewood", stage: "Group D", status: "upcoming" },
  { id: 5, homeTeam: "Qatar", awayTeam: "Switzerland", date: "Jun 13 • 3:00 PM — Levi's Stadium, Santa Clara", stage: "Group B", status: "upcoming" },
  { id: 6, homeTeam: "Brazil", awayTeam: "Morocco", date: "Jun 13 • 6:00 PM — MetLife Stadium, East Rutherford", stage: "Group C", status: "upcoming" },
  { id: 7, homeTeam: "Haiti", awayTeam: "Scotland", date: "Jun 13 • 9:00 PM — Gillette Stadium, Foxborough", stage: "Group C", status: "upcoming" },
  { id: 8, homeTeam: "Australia", awayTeam: "Türkiye", date: "Jun 14 • 12:00 AM — BC Place, Vancouver", stage: "Group D", status: "upcoming" },
  { id: 9, homeTeam: "Germany", awayTeam: "Curaçao", date: "Jun 14 • 1:00 PM — NRG Stadium, Houston", stage: "Group E", status: "upcoming" },
  { id: 10, homeTeam: "Netherlands", awayTeam: "Japan", date: "Jun 14 • 4:00 PM — AT&T Stadium, Arlington", stage: "Group F", status: "upcoming" },
  { id: 11, homeTeam: "Ivory Coast", awayTeam: "Ecuador", date: "Jun 14 • 7:00 PM — Lincoln Financial Field, Philadelphia", stage: "Group E", status: "upcoming" },
  { id: 12, homeTeam: "Sweden", awayTeam: "Tunisia", date: "Jun 14 • 10:00 PM — Estadio BBVA, Monterrey", stage: "Group F", status: "upcoming" },
  { id: 13, homeTeam: "Spain", awayTeam: "Cabo Verde", date: "Jun 15 • 1:00 PM — Mercedes-Benz Stadium, Atlanta", stage: "Group H", status: "upcoming" },
  { id: 14, homeTeam: "Belgium", awayTeam: "Egypt", date: "Jun 15 • 3:00 PM — Lumen Field, Seattle", stage: "Group G", status: "upcoming" },
  { id: 15, homeTeam: "Saudi Arabia", awayTeam: "Uruguay", date: "Jun 15 • 6:00 PM — Hard Rock Stadium, Miami", stage: "Group H", status: "upcoming" },
  { id: 16, homeTeam: "Iran", awayTeam: "New Zealand", date: "Jun 15 • 9:00 PM — SoFi Stadium, Inglewood", stage: "Group G", status: "upcoming" },
  { id: 17, homeTeam: "France", awayTeam: "Senegal", date: "Jun 16 • 3:00 PM — MetLife Stadium, East Rutherford", stage: "Group I", status: "upcoming" },
  { id: 18, homeTeam: "Iraq", awayTeam: "Norway", date: "Jun 16 • 6:00 PM — Gillette Stadium, Foxborough", stage: "Group I", status: "upcoming" },
  { id: 19, homeTeam: "Argentina", awayTeam: "Algeria", date: "Jun 16 • 9:00 PM — Arrowhead Stadium, Kansas City", stage: "Group J", status: "upcoming" },
  { id: 20, homeTeam: "Austria", awayTeam: "Jordan", date: "Jun 17 • 12:00 AM — Levi's Stadium, Santa Clara", stage: "Group J", status: "upcoming" },
  { id: 21, homeTeam: "Portugal", awayTeam: "DR Congo", date: "Jun 17 • 1:00 PM — NRG Stadium, Houston", stage: "Group K", status: "upcoming" },
  { id: 22, homeTeam: "England", awayTeam: "Croatia", date: "Jun 17 • 4:00 PM — AT&T Stadium, Arlington", stage: "Group L", status: "upcoming" },
  { id: 23, homeTeam: "Ghana", awayTeam: "Panama", date: "Jun 17 • 7:00 PM — BMO Field, Toronto", stage: "Group L", status: "upcoming" },
  { id: 24, homeTeam: "Uzbekistan", awayTeam: "Colombia", date: "Jun 17 • 10:00 PM — Estadio Azteca, Mexico City", stage: "Group K", status: "upcoming" },
  { id: 25, homeTeam: "Czechia", awayTeam: "South Africa", date: "Jun 18 • 12:00 PM — Mercedes-Benz Stadium, Atlanta", stage: "Group A", status: "upcoming" },
  { id: 26, homeTeam: "Switzerland", awayTeam: "Bosnia and Herzegovina", date: "Jun 18 • 3:00 PM — SoFi Stadium, Inglewood", stage: "Group B", status: "upcoming" },
  { id: 27, homeTeam: "Canada", awayTeam: "Qatar", date: "Jun 18 • 6:00 PM — BC Place, Vancouver", stage: "Group B", status: "upcoming" },
  { id: 28, homeTeam: "Mexico", awayTeam: "South Korea", date: "Jun 18 • 9:00 PM — Estadio Akron, Guadalajara", stage: "Group A", status: "upcoming" },
  { id: 29, homeTeam: "United States", awayTeam: "Australia", date: "Jun 19 • 3:00 PM — Lumen Field, Seattle", stage: "Group D", status: "upcoming" },
  { id: 30, homeTeam: "Scotland", awayTeam: "Morocco", date: "Jun 19 • 6:00 PM — Gillette Stadium, Foxborough", stage: "Group C", status: "upcoming" },
  { id: 31, homeTeam: "Brazil", awayTeam: "Haiti", date: "Jun 19 • 9:00 PM — Lincoln Financial Field, Philadelphia", stage: "Group C", status: "upcoming" },
  { id: 32, homeTeam: "Türkiye", awayTeam: "Paraguay", date: "Jun 19 • 11:00 PM — Levi's Stadium, Santa Clara", stage: "Group D", status: "upcoming" },
  { id: 33, homeTeam: "Netherlands", awayTeam: "Sweden", date: "Jun 20 • 1:00 PM — NRG Stadium, Houston", stage: "Group F", status: "upcoming" },
  { id: 34, homeTeam: "Germany", awayTeam: "Ivory Coast", date: "Jun 20 • 4:00 PM — BMO Field, Toronto", stage: "Group E", status: "upcoming" },
  { id: 35, homeTeam: "Ecuador", awayTeam: "Curaçao", date: "Jun 20 • 8:00 PM — Arrowhead Stadium, Kansas City", stage: "Group E", status: "upcoming" },
  { id: 36, homeTeam: "Spain", awayTeam: "Saudi Arabia", date: "Jun 21 • 12:00 PM — Mercedes-Benz Stadium, Atlanta", stage: "Group H", status: "upcoming" },
  { id: 37, homeTeam: "Belgium", awayTeam: "Iran", date: "Jun 21 • 3:00 PM — SoFi Stadium, Inglewood", stage: "Group G", status: "upcoming" },
  { id: 38, homeTeam: "Uruguay", awayTeam: "Cabo Verde", date: "Jun 21 • 6:00 PM — Hard Rock Stadium, Miami", stage: "Group H", status: "upcoming" },
  { id: 39, homeTeam: "New Zealand", awayTeam: "Egypt", date: "Jun 21 • 9:00 PM — BC Place, Vancouver", stage: "Group G", status: "upcoming" },
  { id: 40, homeTeam: "Argentina", awayTeam: "Austria", date: "Jun 22 • 1:00 PM — AT&T Stadium, Arlington", stage: "Group J", status: "upcoming" },
  { id: 41, homeTeam: "France", awayTeam: "Iraq", date: "Jun 22 • 5:00 PM — Lincoln Financial Field, Philadelphia", stage: "Group I", status: "upcoming" },
  { id: 42, homeTeam: "Norway", awayTeam: "Senegal", date: "Jun 22 • 8:00 PM — MetLife Stadium, East Rutherford", stage: "Group I", status: "upcoming" },
  { id: 43, homeTeam: "Jordan", awayTeam: "Algeria", date: "Jun 22 • 11:00 PM — Levi's Stadium, Santa Clara", stage: "Group J", status: "upcoming" },
  { id: 44, homeTeam: "Portugal", awayTeam: "Uzbekistan", date: "Jun 23 • 1:00 PM — NRG Stadium, Houston", stage: "Group K", status: "upcoming" },
  { id: 45, homeTeam: "England", awayTeam: "Ghana", date: "Jun 23 • 4:00 PM — Gillette Stadium, Foxborough", stage: "Group L", status: "upcoming" },
  { id: 46, homeTeam: "Panama", awayTeam: "Croatia", date: "Jun 23 • 7:00 PM — BMO Field, Toronto", stage: "Group L", status: "upcoming" },
  { id: 47, homeTeam: "Colombia", awayTeam: "DR Congo", date: "Jun 23 • 10:00 PM — Estadio Akron, Guadalajara", stage: "Group K", status: "upcoming" },
  { id: 48, homeTeam: "Switzerland", awayTeam: "Canada", date: "Jun 24 • 3:00 PM — BC Place, Vancouver", stage: "Group B", status: "upcoming" },
  { id: 49, homeTeam: "Bosnia and Herzegovina", awayTeam: "Qatar", date: "Jun 24 • 3:00 PM — Lumen Field, Seattle", stage: "Group B", status: "upcoming" },
  { id: 50, homeTeam: "Scotland", awayTeam: "Brazil", date: "Jun 24 • 6:00 PM — Hard Rock Stadium, Miami", stage: "Group C", status: "upcoming" },
  { id: 51, homeTeam: "Morocco", awayTeam: "Haiti", date: "Jun 24 • 6:00 PM — Mercedes-Benz Stadium, Atlanta", stage: "Group C", status: "upcoming" },
  { id: 52, homeTeam: "Czechia", awayTeam: "Mexico", date: "Jun 24 • 9:00 PM — Estadio Azteca, Mexico City", stage: "Group A", status: "upcoming" },
  { id: 53, homeTeam: "South Africa", awayTeam: "South Korea", date: "Jun 24 • 9:00 PM — Estadio BBVA, Monterrey", stage: "Group A", status: "upcoming" },
  { id: 54, homeTeam: "Ecuador", awayTeam: "Germany", date: "Jun 25 • 4:00 PM — MetLife Stadium, East Rutherford", stage: "Group E", status: "upcoming" },
  { id: 55, homeTeam: "Curaçao", awayTeam: "Ivory Coast", date: "Jun 25 • 4:00 PM — Lincoln Financial Field, Philadelphia", stage: "Group E", status: "upcoming" },
  { id: 56, homeTeam: "Japan", awayTeam: "Sweden", date: "Jun 25 • 7:00 PM — AT&T Stadium, Arlington", stage: "Group F", status: "upcoming" },
  { id: 57, homeTeam: "Tunisia", awayTeam: "Netherlands", date: "Jun 25 • 7:00 PM — Arrowhead Stadium, Kansas City", stage: "Group F", status: "upcoming" },
  { id: 58, homeTeam: "Türkiye", awayTeam: "United States", date: "Jun 25 • 10:00 PM — SoFi Stadium, Inglewood", stage: "Group D", status: "upcoming" },
  { id: 59, homeTeam: "Paraguay", awayTeam: "Australia", date: "Jun 25 • 10:00 PM — Levi's Stadium, Santa Clara", stage: "Group D", status: "upcoming" },
  { id: 60, homeTeam: "Norway", awayTeam: "France", date: "Jun 26 • 3:00 PM — Gillette Stadium, Foxborough", stage: "Group I", status: "upcoming" },
  { id: 61, homeTeam: "Senegal", awayTeam: "Iraq", date: "Jun 26 • 3:00 PM — BMO Field, Toronto", stage: "Group I", status: "upcoming" },
  { id: 62, homeTeam: "Cabo Verde", awayTeam: "Saudi Arabia", date: "Jun 26 • 8:00 PM — NRG Stadium, Houston", stage: "Group H", status: "upcoming" },
  { id: 63, homeTeam: "Uruguay", awayTeam: "Spain", date: "Jun 26 • 8:00 PM — Estadio Akron, Guadalajara", stage: "Group H", status: "upcoming" },
  { id: 64, homeTeam: "Egypt", awayTeam: "Iran", date: "Jun 26 • 11:00 PM — Lumen Field, Seattle", stage: "Group G", status: "upcoming" },
  { id: 65, homeTeam: "New Zealand", awayTeam: "Belgium", date: "Jun 26 • 11:00 PM — BC Place, Vancouver", stage: "Group G", status: "upcoming" },
  { id: 66, homeTeam: "Panama", awayTeam: "England", date: "Jun 27 • 5:00 PM — MetLife Stadium, East Rutherford", stage: "Group L", status: "upcoming" },
  { id: 67, homeTeam: "Croatia", awayTeam: "Ghana", date: "Jun 27 • 5:00 PM — Lincoln Financial Field, Philadelphia", stage: "Group L", status: "upcoming" },
  { id: 68, homeTeam: "Colombia", awayTeam: "Portugal", date: "Jun 27 • 7:30 PM — Hard Rock Stadium, Miami", stage: "Group K", status: "upcoming" },
  { id: 69, homeTeam: "DR Congo", awayTeam: "Uzbekistan", date: "Jun 27 • 7:30 PM — Mercedes-Benz Stadium, Atlanta", stage: "Group K", status: "upcoming" },
  { id: 70, homeTeam: "Algeria", awayTeam: "Austria", date: "Jun 27 • 10:00 PM — Arrowhead Stadium, Kansas City", stage: "Group J", status: "upcoming" },
  { id: 71, homeTeam: "Jordan", awayTeam: "Argentina", date: "Jun 27 • 10:00 PM — AT&T Stadium, Arlington", stage: "Group J", status: "upcoming" },
];

const INITIAL_PREDICTIONS = {
  // Demo seeds (fallback)
  1: {
    1: { home: 3, away: 1 },
    2: { home: 2, away: 0 },
  },
  2: {
    1: { home: 1, away: 0 },
    2: { home: 2, away: 1 },
  },
  3: {
    1: { home: 2, away: 0 },
    2: { home: 0, away: 2 },
  },

  // Real users (Ivan + Roman) - seeded so you start with 2 and 8 points
  948806223: { // Ivan (admin)
    1: { home: 3, away: 1 }, // +2
    2: { home: 1, away: 0 }, // +2
    3: { home: 2, away: 0 }, // -2
  },
  1252235003: { // Roman
    1: { home: 2, away: 0 }, // +5
    2: { home: 2, away: 1 }, // +5
    3: { home: 0, away: 2 }, // -2
  },
};

function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        matches: parsed.matches || INITIAL_MATCHES,
        predictions: parsed.predictions || INITIAL_PREDICTIONS,
      };
    } catch (e) {
      console.error('Failed to parse db.json, using initial seed', e);
    }
  }
  // First run - seed
  const seeded = { matches: INITIAL_MATCHES, predictions: INITIAL_PREDICTIONS };
  saveDB(seeded);
  return seeded;
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = loadDB();

// Ensure the real users (Ivan and Roman) have the correct starting predictions
// for the first 3 finished matches (so they don't stay at 0 points)
function ensureRealUsersSeeded() {
  const seed = INITIAL_PREDICTIONS;

  [1, 2, 3].forEach((matchId) => {
    if (!db.predictions[matchId]) db.predictions[matchId] = {};

    // Ivan
    if (!db.predictions[matchId][IVAN_ID]) {
      db.predictions[matchId][IVAN_ID] = seed[IVAN_ID]?.[matchId] || { home: 3, away: 1 };
    }
    // Roman
    if (!db.predictions[matchId][ROMAN_ID]) {
      db.predictions[matchId][ROMAN_ID] = seed[ROMAN_ID]?.[matchId] || { home: 2, away: 0 };
    }
  });

  saveDB(db);
}

ensureRealUsersSeeded();

// ---------- Telegram initData validation (critical for security) ----------
function validateInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    // Build data-check-string
    const dataCheckArr = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // secret_key = HMAC_SHA256(botToken, "WebAppData")
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // hash = HMAC_SHA256(dataCheckString, secret_key)
    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      console.warn('InitData hash mismatch - possible tampering');
      return null;
    }

    // Parse user
    const userJson = params.get('user');
    if (!userJson) return null;

    const user = JSON.parse(userJson);
    // user has id, first_name, last_name, username, etc.
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name || '',
      username: user.username || '',
      isPremium: !!user.is_premium,
    };
  } catch (err) {
    console.error('Failed to validate initData', err);
    return null;
  }
}

function isAdmin(userId) {
  if (!userId) return false;
  // Demo fallback
  if (userId === 1 || userId === 2) return true;
  // Loaded from ADMIN_IDS in .env (only Ivan is admin)
  return ADMIN_IDS.includes(userId);
}

// ---------- API Routes ----------

// Public: get full current state (matches + predictions)
app.get('/api/state', (req, res) => {
  // Optional: support dev override ?devUser=1 (only for local testing)
  res.json({
    matches: db.matches,
    predictions: db.predictions,
    // server does not decide "current user" - frontend + validation does
  });
});

// Save or update a prediction (any logged in TG user)
app.post('/api/predict', (req, res) => {
  const { matchId, home, away, initData } = req.body;

  if (typeof matchId !== 'number' || typeof home !== 'number' || typeof away !== 'number') {
    return res.status(400).json({ error: 'Bad request' });
  }

  const user = validateInitData(initData, BOT_TOKEN);
  if (!user) {
    console.warn('validateInitData failed for /api/predict. initData present?', !!initData, 'BOT_TOKEN set?', !!BOT_TOKEN);
    // In development we allow a fallback using devUserId
    const devId = Number(req.body.devUserId);
    if (process.env.NODE_ENV !== 'production' && devId) {
      // dev mode only
    } else {
      return res.status(401).json({ error: 'Unauthorized - invalid Telegram data' });
    }
  }

  const currentUserId = user ? user.id : Number(req.body.devUserId);

  const match = db.matches.find(m => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.status === 'finished') {
    return res.status(400).json({ error: 'Cannot predict on finished match' });
  }

  // Allow admin to edit prediction for another user (e.g. Ivan edits Roman's prediction)
  let targetUserId = currentUserId;
  const requestedTarget = Number(req.body.targetUserId);
  if (requestedTarget && isAdmin(currentUserId)) {
    targetUserId = requestedTarget;
  }

  // Save prediction
  if (!db.predictions[matchId]) db.predictions[matchId] = {};
  db.predictions[matchId][targetUserId] = { home, away };

  saveDB(db);

  res.json({ success: true, savedFor: targetUserId });
});

// Admin only: add a new match
app.post('/api/match', (req, res) => {
  const { homeTeam, awayTeam, date, stage, initData } = req.body;

  const user = validateInitData(initData, BOT_TOKEN);
  const userId = user ? user.id : Number(req.body.devUserId);

  if (!isAdmin(userId)) {
    console.warn(`Admin check failed. userId=${userId}, ADMIN_IDS=${ADMIN_IDS.join(',') || 'empty'}, isAdmin result=false`);
    return res.status(403).json({ error: 'Admin only' });
  }

  if (!homeTeam || !awayTeam || !date) {
    return res.status(400).json({ error: 'homeTeam, awayTeam and date are required' });
  }

  const maxId = Math.max(0, ...db.matches.map(m => m.id));
  const newMatch = {
    id: maxId + 1,
    homeTeam: String(homeTeam).trim(),
    awayTeam: String(awayTeam).trim(),
    date: String(date).trim(),
    stage: stage ? String(stage).trim() : 'Group Stage',
    status: 'upcoming',
  };

  db.matches.push(newMatch);
  saveDB(db);

  res.json({ success: true, match: newMatch });
});

// Admin only: set or update result for a match (finishes it or corrects score)
app.post('/api/finish-match', (req, res) => {
  const { matchId, homeScore, awayScore, initData } = req.body;

  const user = validateInitData(initData, BOT_TOKEN);
  const userId = user ? user.id : Number(req.body.devUserId);

  if (!isAdmin(userId)) {
    console.warn(`Admin check failed. userId=${userId}, ADMIN_IDS=${ADMIN_IDS.join(',') || 'empty'}, isAdmin result=false`);
    return res.status(403).json({ error: 'Admin only' });
  }

  if (typeof matchId !== 'number' || typeof homeScore !== 'number' || typeof awayScore !== 'number') {
    return res.status(400).json({ error: 'Bad request' });
  }

  const matchIndex = db.matches.findIndex(m => m.id === matchId);
  if (matchIndex === -1) return res.status(404).json({ error: 'Match not found' });

  db.matches[matchIndex] = {
    ...db.matches[matchIndex],
    status: 'finished',
    homeScore,
    awayScore,
  };

  saveDB(db);

  // Optional: notify the other player via bot (simple broadcast to known users later)
  res.json({ success: true, match: db.matches[matchIndex] });
});

// Admin: full export of current DB (handy)
app.post('/api/export', (req, res) => {
  const { initData } = req.body;
  const user = validateInitData(initData, BOT_TOKEN);
  const userId = user ? user.id : Number(req.body.devUserId);

  if (!isAdmin(userId)) {
    console.warn(`Admin check failed. userId=${userId}, ADMIN_IDS=${ADMIN_IDS.join(',') || 'empty'}, isAdmin result=false`);
    return res.status(403).json({ error: 'Admin only' });
  }
  res.json({ success: true, data: db, exportedAt: new Date().toISOString() });
});

// Simple health
app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now() }));

// ---------- Telegram Bot ----------
let bot = null;

if (BOT_TOKEN) {
  // Use polling for development / easy start. For production use setWebHook.
  bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const user = msg.from;

    const text = `Hello ${user.first_name || 'there'}!\n\nWelcome to the WC2026 Predictor.\n\nTap the button below to open the prediction mini-app.`;

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⚽ Open WC2026 Predictor',
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    };

    bot.sendMessage(chatId, text, opts).catch(console.error);
  });

  bot.onText(/\/predict/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Open the app to make your predictions:', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Open Predictor', web_app: { url: WEBAPP_URL } }]],
      },
    }).catch(console.error);
  });

  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, 
      'Commands:\n' +
      '/start - Open the mini-app\n' +
      '/predict - Quick link to predictions\n\n' +
      'Inside the app (Ivan is admin):\n' +
      '• Predict upcoming games\n' +
      '• See results + points on finished games\n' +
      '• Leaderboard\n' +
      '• Admin can add matches and post results'
    );
  });

  bot.on('polling_error', (err) => {
    console.error('Telegram polling error:', err.message);
  });

  console.log('🤖 Telegram bot is polling. Send /start to your bot to test the WebApp button.');
}

// ---------- Serve built frontend in production (optional) ----------
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('📦 Serving built frontend from /dist (production mode)');
}

// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`✅ WC2026 Predictor API running on http://localhost:${PORT}`);
  console.log(`   WebApp URL (for bot buttons): ${WEBAPP_URL}`);
  console.log(`   ADMIN_IDS from .env: ${ADMIN_IDS.length ? ADMIN_IDS.join(', ') : '(empty - only demo 1/2 will work as admin)'}`);
  if (fs.existsSync(DB_PATH)) {
    console.log(`   Loaded DB from ${DB_PATH}`);
  } else {
    console.log(`   Seeded fresh DB`);
  }
});

// Graceful save on exit (best effort)
process.on('SIGINT', () => {
  saveDB(db);
  process.exit(0);
});
process.on('SIGTERM', () => {
  saveDB(db);
  process.exit(0);
});
