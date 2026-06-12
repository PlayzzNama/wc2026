import { useState, useEffect, useMemo } from 'react';
import { Trophy, Calendar, Users, Settings, RefreshCw, Download, Upload, Plus, Check, X, Edit2 } from 'lucide-react';

// Types
interface User {
  id: number;
  name: string;
  isAdmin: boolean;
}

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  stage: string;
  status: 'upcoming' | 'finished';
  homeScore?: number;
  awayScore?: number;
}

interface Prediction {
  home: number;
  away: number;
}

type PredictionsMap = Record<number, Record<number, Prediction>>; // matchId -> userId -> Prediction

const USERS: User[] = [
  { id: 948806223, name: 'Ivan', isAdmin: true },
  { id: 1252235003, name: 'Roman', isAdmin: false },
];

const INITIAL_MATCHES: Match[] = [
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

const INITIAL_PREDICTIONS: PredictionsMap = {
  // Demo seeds (for testing / fallback)
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

  // Real users - seeded with the same predictions so you start with correct points
  948806223: { // Ivan (admin)
    1: { home: 3, away: 1 }, // +2 (correct winner)
    2: { home: 1, away: 0 }, // +2 (correct winner)
    3: { home: 2, away: 0 }, // -2 (wrong)
  },
  1252235003: { // Roman
    1: { home: 2, away: 0 }, // +5 (exact)
    2: { home: 2, away: 1 }, // +5 (exact)
    3: { home: 0, away: 2 }, // -2 (wrong)
  },
};

const STORAGE_KEY = 'wc2026_predictor_v1';

// API base configuration
// Priority:
// 1. VITE_API_URL (set this in production, e.g. https://your-backend.onrender.com)
// 2. localhost:3001 when running on localhost (dev)
// 3. Same origin (if you deploy frontend + backend together)
const getApiBase = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (envUrl) {
    return envUrl.replace(/\/+$/, ''); // remove trailing slashes
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // On production static hosts (Netlify, Vercel etc.) we MUST have VITE_API_URL set
    // otherwise API calls will fail
    return '';
  }
  return '';
};

const API_BASE = getApiBase();

function getOutcomeLabel(home: number, away: number): string {
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

function getPoints(pred: Prediction, actualHome: number, actualAway: number): number {
  if (pred.home === actualHome && pred.away === actualAway) {
    return 5;
  }
  const predOutcome = getOutcomeLabel(pred.home, pred.away);
  const actualOutcome = getOutcomeLabel(actualHome, actualAway);
  if (predOutcome === actualOutcome) {
    return 2;
  }
  return -2;
}

function getUserById(id: number): User {
  return USERS.find(u => u.id === id) || { id, name: `User ${id}`, isAdmin: false };
}

// Admin check: real ADMIN_IDS from server + fallback for demo + your real IDs
function isAdminUser(userId: number): boolean {
  if (!userId) return false;
  // Demo fallback
  if (userId === 1 || userId === 2) return true;
  // Real admin (Ivan)
  if (userId === 948806223) return true;
  // In real usage the server also enforces this via ADMIN_IDS env
  return false; // frontend hint only - server is the real authority
}

function App() {
  // Real Telegram user (when opened inside Telegram)
  const [tgUser, setTgUser] = useState<any>(null);
  const [initData, setInitData] = useState<string>('');

  // The *authenticated* user id for writes (real TG id when available, else demo)
  const [authUserId, setAuthUserId] = useState<number>(1);

  // Current viewed user (for UI - lets you peek at the other person's data)
  const [viewedUserId, setViewedUserId] = useState<number>(1);

  // Core data (source of truth = server, localStorage is fallback/cache)
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [predictions, setPredictions] = useState<PredictionsMap>(INITIAL_PREDICTIONS);
  // const [isLoading, setIsLoading] = useState(true); // reserved for future loading UI

  // Load real Telegram context + fetch canonical state from server
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    let realId: number | null = null;
    let rawInitData = '';

    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      rawInitData = tg.initData || '';

      if (user?.id) {
        realId = user.id;
        setTgUser(user);
        setInitData(rawInitData);

        // Prefer real name for display
        // We still keep the switcher for "view as"
      }
    }

    // Determine the identity used for saving predictions
    const effectiveAuthId = realId ?? 948806223; // default to Ivan (real ID) if not inside Telegram
    setAuthUserId(effectiveAuthId);

    // If we have a real user, default the "viewed" to the real one
    if (realId) {
      setViewedUserId(realId);
    }

    // Fetch latest from server (preferred)
    async function loadFromServer() {
      try {
        const res = await fetch(`${API_BASE}/api/state`);
        if (res.ok) {
          const data = await res.json();
          if (data.matches?.length) setMatches(data.matches);
          if (data.predictions) setPredictions(data.predictions);
        }
      } catch (e) {
        // Server not available - fall back to localStorage seed (dev without server)
        console.warn('Could not reach API server, using local data', e);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.matches) setMatches(parsed.matches);
            if (parsed.predictions) setPredictions(parsed.predictions);
          } catch {}
        }
      } finally {
        // setIsLoading(false);
      }
    }
    loadFromServer();
  }, []);

  // The user we are *viewing* (for UI display / previewing brother's data)
  const viewedUser = getUserById(viewedUserId);

  // Whether the *real authenticated person* is an admin (controls showing Admin tab + permissions for writes)
  const isRealAdmin = isAdminUser(authUserId);

  // Who we are actually saving/editing predictions for.
  // Normal users always edit their own.
  // Admin can edit the currently viewed person's predictions.
  const editingUserId = isRealAdmin ? viewedUserId : authUserId;

  // Computed: total points for a user (used for header when viewing + leaderboard)
  const getUserPoints = (userId: number): number => {
    return matches
      .filter((m): m is Match & { homeScore: number; awayScore: number } =>
        m.status === 'finished' && typeof m.homeScore === 'number' && typeof m.awayScore === 'number'
      )
      .reduce((sum, match) => {
        const pred = predictions[match.id]?.[userId];
        if (!pred) return sum;
        return sum + getPoints(pred, match.homeScore, match.awayScore);
      }, 0);
  };

  const currentPoints = useMemo(() => getUserPoints(viewedUserId), [viewedUserId, matches, predictions]);

  const leaderboard = useMemo(() => {
    // Include any users that have predictions even if not in the static USERS list
    const allUserIds = new Set<number>();
    Object.values(predictions).forEach(predsByUser => {
      Object.keys(predsByUser).forEach(uid => allUserIds.add(Number(uid)));
    });
    USERS.forEach(u => allUserIds.add(u.id));

    return Array.from(allUserIds).map(id => {
      const base = getUserById(id);
      return {
        ...base,
        points: getUserPoints(id),
        predictedCount: matches.filter(m => predictions[m.id]?.[id]).length,
      };
    }).sort((a, b) => b.points - a.points);
  }, [matches, predictions]);

  // Tabs
  const [activeTab, setActiveTab] = useState<'upcoming' | 'finished' | 'leaderboard' | 'admin'>('upcoming');

  // For prediction inputs - local editing state per match
  const [editingPreds, setEditingPreds] = useState<Record<number, Prediction>>({});

  // Admin: finish / edit result modal
  const [resultModalMatch, setResultModalMatch] = useState<Match | null>(null);
  const [resultHome, setResultHome] = useState<number>(0);
  const [resultAway, setResultAway] = useState<number>(0);

  // Admin: add match form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMatch, setNewMatch] = useState({
    homeTeam: '',
    awayTeam: '',
    date: '',
    stage: '',
  });

  // Get prediction for the inputs in Upcoming tab.
  // Admin edits the viewed user's predictions.
  // Normal user edits only their own.
  const getUserPrediction = (matchId: number): Prediction | null => {
    const targetId = editingUserId;
    const saved = predictions[matchId]?.[targetId];
    const editing = editingPreds[matchId];
    return editing || saved || null;
  };

  // For finished cards we show what the *currently viewed* person predicted + earned
  const getViewedPrediction = (matchId: number): Prediction | null => {
    return predictions[matchId]?.[viewedUserId] || null;
  };

  // Update temp editing prediction
  const updateEditingPred = (matchId: number, field: 'home' | 'away', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 20) return;

    setEditingPreds(prev => {
      const current = prev[matchId] || getUserPrediction(matchId) || { home: 0, away: 0 };
      return {
        ...prev,
        [matchId]: { ...current, [field]: num },
      };
    });
  };

  // Save prediction
  // - Normal users: save for themselves
  // - Admin: can save for the currently viewed user (e.g. Ivan can edit Roman's prediction)
  const savePrediction = async (matchId: number) => {
    const editing = editingPreds[matchId];
    if (!editing) return;

    const targetId = editingUserId;

    // Optimistic local update
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [targetId]: editing,
      },
    }));

    // Clear editing state
    setEditingPreds(prev => {
      const copy = { ...prev };
      delete copy[matchId];
      return copy;
    });

    // Send to server
    try {
      const body: any = {
        matchId,
        home: editing.home,
        away: editing.away,
        initData,
        targetUserId: isRealAdmin ? targetId : undefined,
      };
      if (!initData) {
        // Allow dev mode when opened directly in browser (no Telegram initData)
        body.devUserId = authUserId;
      }

      const res = await fetch(`${API_BASE}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Save prediction error:', err);
        const apiTarget = API_BASE || 'same-origin (Netlify itself - wrong!)';
        alert(`Failed to save prediction on server: ${err.error || res.statusText || 'Unknown error'} (status ${res.status}).\n\nAPI target: ${apiTarget}\n\n1. Make sure VITE_API_URL is set on Netlify to your Render backend URL.\n2. Redeploy frontend on Netlify after setting the env var.\n3. Open the app from inside Telegram (not direct link) for real initData.`);
      } else {
        // Refresh from server to stay in sync
        const stateRes = await fetch(`${API_BASE}/api/state`);
        if (stateRes.ok) {
          const data = await stateRes.json();
          if (data.matches) setMatches(data.matches);
          if (data.predictions) setPredictions(data.predictions);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Clear editing without saving
  const cancelEditing = (matchId: number) => {
    setEditingPreds(prev => {
      const copy = { ...prev };
      delete copy[matchId];
      return copy;
    });
  };

  // Open result modal (admin)
  const openResultModal = (match: Match) => {
    setResultModalMatch(match);
    setResultHome(match.homeScore ?? 0);
    setResultAway(match.awayScore ?? 0);
  };

  const closeResultModal = () => {
    setResultModalMatch(null);
    setResultHome(0);
    setResultAway(0);
  };

  // Confirm set result (finish or update) - ADMIN only via real auth
  const confirmSetResult = async () => {
    if (!resultModalMatch) return;

    const payload: any = {
      matchId: resultModalMatch.id,
      homeScore: resultHome,
      awayScore: resultAway,
      initData,
    };
    if (!initData) {
      payload.devUserId = authUserId;
    }

    try {
      const res = await fetch(`${API_BASE}/api/finish-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Finish match error:', err);
        alert(`Admin action failed: ${err.error || 'Permission denied or server error'}.\n\nCurrent API: ${API_BASE || 'same-origin'}\n\nBackend is probably not deployed or VITE_API_URL is not set on Netlify.`);
        return;
      }
      // Refresh from server
      const stateRes = await fetch(`${API_BASE}/api/state`);
      if (stateRes.ok) {
        const data = await stateRes.json();
        if (data.matches) setMatches(data.matches);
        if (data.predictions) setPredictions(data.predictions);
      }
    } catch (e: any) {
      console.error('Finish match exception:', e);
      alert(`Could not reach server to set result. Current API base: ${API_BASE || 'same origin'}`);
    }

    closeResultModal();
  };

  // Add new match (admin)
  const addNewMatch = async () => {
    if (!newMatch.homeTeam.trim() || !newMatch.awayTeam.trim() || !newMatch.date.trim()) {
      alert('Please fill Home team, Away team and Date');
      return;
    }

    const payload: any = {
      homeTeam: newMatch.homeTeam.trim(),
      awayTeam: newMatch.awayTeam.trim(),
      date: newMatch.date.trim(),
      stage: newMatch.stage.trim(),
      initData,
    };
    if (!initData && (authUserId === 1 || authUserId === 2)) payload.devUserId = authUserId;

    try {
      const res = await fetch(`${API_BASE}/api/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Failed to add match: ' + (err.error || res.statusText));
        return;
      }
      const stateRes = await fetch(`${API_BASE}/api/state`);
      if (stateRes.ok) {
        const data = await stateRes.json();
        if (data.matches) setMatches(data.matches);
        if (data.predictions) setPredictions(data.predictions);
      }
    } catch (e) {
      alert('Server unreachable while adding match. Change applied locally only.');
      // local fallback
      const maxId = Math.max(0, ...matches.map(m => m.id));
      const matchToAdd: Match = {
        id: maxId + 1,
        homeTeam: newMatch.homeTeam.trim(),
        awayTeam: newMatch.awayTeam.trim(),
        date: newMatch.date.trim(),
        stage: newMatch.stage.trim() || 'Group Stage',
        status: 'upcoming',
      };
      setMatches(prev => [...prev, matchToAdd]);
    }

    setNewMatch({ homeTeam: '', awayTeam: '', date: '', stage: '' });
    setShowAddForm(false);
  };

  // Export full data
  const exportData = () => {
    const data = { matches, predictions, version: 1, exportedAt: new Date().toISOString() };
    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert('✅ Data copied to clipboard! Send this JSON to your brother via Telegram chat.');
    }).catch(() => {
      // fallback
      prompt('Copy this data and send to the other player:', json);
    });
  };

  // Import data
  const importData = () => {
    const input = prompt('Paste the exported JSON data here (from your brother):');
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      if (parsed.matches && parsed.predictions) {
        setMatches(parsed.matches);
        setPredictions(parsed.predictions);
        alert('✅ Data imported successfully! All matches and predictions updated.');
        // Switch back to Ivan view after import for consistency
        setViewedUserId(948806223); // Ivan's real ID
      } else {
        throw new Error('Invalid data format');
      }
    } catch (e) {
      alert('❌ Invalid data. Make sure you pasted the complete exported JSON.');
    }
  };

  // Reset everything to initial seeded state
  const resetToInitial = () => {
    if (!confirm('Reset ALL matches and predictions to the initial seeded state? This cannot be undone.')) return;
    setMatches(INITIAL_MATCHES);
    setPredictions(INITIAL_PREDICTIONS);
    setEditingPreds({});
    setViewedUserId(948806223); // default to Ivan
  };

  // Special helper for admin: force the correct starting points (2 for Ivan, 8 for Roman)
  // on the real user IDs. Useful when data/db.json has old data.
  const reseedRealUserPoints = () => {
    if (!confirm('This will set the initial predictions for your real IDs (Ivan 2pts, Roman 8pts) on the first 3 finished matches.\n\nRecommended: also delete data/db.json and restart the server for full effect.')) return;

    const realPreds = INITIAL_PREDICTIONS;

    setPredictions(prev => {
      const newPreds = { ...prev };

      // Ensure first 3 matches have the seeded predictions for real IDs
      [1, 2, 3].forEach(matchId => {
        if (realPreds[matchId]) {
          newPreds[matchId] = {
            ...newPreds[matchId],
            948806223: realPreds[948806223]?.[matchId] || realPreds[1]?.[948806223] || { home: 3, away: 1 },
            1252235003: realPreds[1252235003]?.[matchId] || realPreds[2]?.[1252235003] || { home: 2, away: 0 },
          };
        }
      });

      return newPreds;
    });

    alert('Predictions for real IDs have been applied locally.\n\nTo make it permanent and fix 0 points: stop the server, delete data/db.json, then run "npm run dev" again.');
  };

  // Filter matches
  const upcomingMatches = matches
    .filter(m => m.status === 'upcoming')
    .sort((a, b) => a.id - b.id);

  const finishedMatches = matches
    .filter(m => m.status === 'finished')
    .sort((a, b) => b.id - a.id); // newest finished first

  // Render a match card for upcoming
  const renderUpcomingCard = (match: Match) => {
    const userPred = getUserPrediction(match.id);
    const isEditing = !!editingPreds[match.id];
    const savedPred = predictions[match.id]?.[editingUserId];
    const hasSaved = !!savedPred;

    const isEditingOther = isRealAdmin && editingUserId !== authUserId;

    return (
      <div key={match.id} className="tg-card p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-tg-text-secondary font-medium">{match.stage} • {match.date}</div>
            <div className="flex items-center gap-3 mt-1">
              <div className="font-semibold text-lg">{match.homeTeam}</div>
              <div className="text-tg-text-secondary text-sm font-medium">vs</div>
              <div className="font-semibold text-lg">{match.awayTeam}</div>
            </div>
          </div>
          <div className="status-badge status-upcoming">UPCOMING</div>
        </div>

        <div className="border-t border-white/10 pt-3">
          <div className="text-sm font-medium mb-2 text-tg-text-secondary flex items-center gap-2">
            {isEditingOther ? `${viewedUser.name}'s Prediction` : 'Your Prediction'}
            {isEditingOther && <span className="admin-badge text-[9px]">ADMIN EDIT</span>}
          </div>

          <div className="flex items-center gap-3">
            <div className="prediction-row">
              <input
                type="number"
                min={0}
                max={20}
                value={userPred ? userPred.home : ''}
                placeholder="0"
                onChange={(e) => updateEditingPred(match.id, 'home', e.target.value)}
                className="score-input"
                disabled={false}
              />
              <div className="text-tg-text-secondary font-bold text-xl">:</div>
              <input
                type="number"
                min={0}
                max={20}
                value={userPred ? userPred.away : ''}
                placeholder="0"
                onChange={(e) => updateEditingPred(match.id, 'away', e.target.value)}
                className="score-input"
              />
            </div>

            <div className="flex gap-2 ml-auto">
              {isEditing && (
                <button
                  onClick={() => cancelEditing(match.id)}
                  className="tg-button-secondary px-4 py-2 text-sm rounded-xl flex items-center gap-1"
                >
                  <X size={16} /> Cancel
                </button>
              )}
              <button
                onClick={() => savePrediction(match.id)}
                disabled={!userPred}
                className={`px-5 py-2 text-sm rounded-xl flex items-center gap-1.5 ${userPred ? 'tg-button' : 'tg-button-secondary opacity-60 cursor-not-allowed'}`}
              >
                <Check size={16} /> 
                {hasSaved ? 'Update' : 'Save Prediction'}
                {isEditingOther && ` for ${viewedUser.name}`}
              </button>
            </div>
          </div>

          {hasSaved && !isEditing && (
            <div className="text-xs mt-2 text-tg-text-secondary">
              Saved for {viewedUser.name}: <span className="font-semibold text-tg-text">{savedPred.home}–{savedPred.away}</span>. 
              {isEditingOther ? 'You are editing as admin.' : ''}
            </div>
          )}
          {!hasSaved && !userPred && (
            <div className="text-xs mt-2 text-tg-text-secondary italic">
              Enter scores for {viewedUser.name} and press Save Prediction
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render finished match card
  const renderFinishedCard = (match: Match) => {
    const actualHome = match.homeScore!;
    const actualAway = match.awayScore!;
    const userPred = getViewedPrediction(match.id);   // what the person we are "Viewing as" has
    const userPoints = userPred ? getPoints(userPred, actualHome, actualAway) : null;

    const ivanPred = predictions[match.id]?.[1];
    const romanPred = predictions[match.id]?.[2];

    const outcomeText = actualHome > actualAway
      ? `${match.homeTeam} win`
      : actualAway > actualHome
      ? `${match.awayTeam} win`
      : 'Draw';

    return (
      <div key={match.id} className="tg-card p-4 mb-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-xs text-tg-text-secondary font-medium">{match.stage} • {match.date}</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-semibold text-lg">{match.homeTeam}</span>
              <span className="text-xl font-black tabular-nums px-1 text-tg-text-secondary">vs</span>
              <span className="font-semibold text-lg">{match.awayTeam}</span>
            </div>
          </div>
          <div className="status-badge status-finished">FINISHED</div>
        </div>

        {/* Actual result */}
        <div className="my-3 flex items-center gap-3">
          <div className="text-4xl font-black tabular-nums tracking-tighter">
            {actualHome} <span className="text-tg-text-secondary text-2xl font-bold align-middle">:</span> {actualAway}
          </div>
          <div className="text-sm px-3 py-1 bg-white/5 rounded-full text-tg-text-secondary font-medium">{outcomeText}</div>
        </div>

        {/* Viewed person's result + points (use the top switcher) */}
        <div className="bg-black/20 rounded-xl p-3 mt-2 space-y-2.5">
          <div>
            <div className="text-xs uppercase tracking-wider text-tg-text-secondary mb-1">
              {viewedUser.name}'s Prediction
            </div>
            {userPred ? (
              <div className="flex items-center gap-3">
                <span className="font-bold text-2xl tabular-nums">{userPred.home}–{userPred.away}</span>
                <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${userPoints && userPoints > 0 ? 'points-positive bg-green-500/10' : 'points-negative bg-red-500/10'}`}>
                  {userPoints! > 0 ? '+' : ''}{userPoints} pts
                </span>
              </div>
            ) : (
              <div className="text-tg-text-secondary italic text-sm">No prediction was made for this match.</div>
            )}
          </div>

          {/* Show both players' predictions */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-tg-text-secondary">Ivan:</span>{' '}
              <span className="font-semibold">{ivanPred ? `${ivanPred.home}–${ivanPred.away}` : '—'}</span>
            </div>
            <div>
              <span className="text-tg-text-secondary">Roman:</span>{' '}
              <span className="font-semibold">{romanPred ? `${romanPred.home}–${romanPred.away}` : '—'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--tg-theme-bg-color)' }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-4 pt-4 pb-3" style={{ background: 'var(--tg-theme-bg-color)' }}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="text-[#3b82f6]" size={26} />
              <div>
                <div className="font-black text-2xl tracking-[-1px]">WC2026</div>
                <div className="text-[10px] -mt-1.5 text-tg-text-secondary font-medium">PREDICTOR</div>
              </div>
            </div>
          </div>

          {/* User switcher */}
          <div className="flex bg-white/5 rounded-2xl p-0.5 text-sm font-semibold">
            {USERS.map(u => (
              <button
                key={u.id}
                onClick={() => setViewedUserId(u.id)}
                className={`px-3.5 py-1.5 rounded-[14px] transition-all flex items-center gap-1.5 ${viewedUserId === u.id ? 'bg-white text-[#0f172a] shadow' : 'text-tg-text-secondary'}`}
              >
                {u.name}
                {u.isAdmin && <span className="admin-badge ml-0.5">ADMIN</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Current user summary */}
        <div className="tg-card px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-tg-text-secondary">Viewing as</div>
            <div className="font-bold text-xl flex items-center gap-2">
              {viewedUser.name}
              {viewedUser.isAdmin && <span className="admin-badge">ADMIN</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-tg-text-secondary">TOTAL POINTS</div>
            <div className={`text-4xl font-black tabular-nums tracking-tighter ${currentPoints >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {currentPoints}
            </div>
          </div>
        </div>

        {tgUser && (
          <div className="text-[10px] text-center mt-1.5 text-tg-text-secondary">
            Real Telegram user: {tgUser.first_name} (id: {tgUser.id}) — predictions are saved for you
          </div>
        )}
        {authUserId !== viewedUserId && (
          <div className="text-[10px] text-center text-amber-400/80 -mt-0.5">
            (Viewing {viewedUser.name}’s data • You are saving predictions as your own account)
          </div>
        )}

        {/* Debug info */}
        <div className="text-[9px] text-center text-tg-text-secondary opacity-60 mt-1 break-all">
          API: {API_BASE || 'same-origin (Netlify)'} | initData: {initData ? 'yes' : 'no'} | authId: {authUserId}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mx-1 sticky top-[138px] z-40 bg-[var(--tg-theme-bg-color)]">
        {(['upcoming', 'finished', 'leaderboard'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab flex-1 text-center capitalize ${activeTab === tab ? 'active' : ''}`}
          >
            {tab}
          </button>
        ))}
        {isRealAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`tab flex-1 text-center flex items-center justify-center gap-1 ${activeTab === 'admin' ? 'active' : ''}`}
          >
            <Settings size={15} /> Admin
          </button>
        )}
      </div>

      <div className="px-4 pt-4 max-w-[680px] mx-auto">
        {/* UPCOMING */}
        {activeTab === 'upcoming' && (
          <>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Calendar size={18} className="text-tg-text-secondary" />
              <div className="font-semibold">Upcoming Matches ({upcomingMatches.length})</div>
            </div>
            {upcomingMatches.length === 0 && (
              <div className="text-center py-8 text-tg-text-secondary">No upcoming matches.</div>
            )}
            {upcomingMatches.map(renderUpcomingCard)}
          </>
        )}

        {/* FINISHED */}
        {activeTab === 'finished' && (
          <>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Check size={18} className="text-[#4ade80]" />
              <div className="font-semibold">Finished Matches • Results &amp; Points</div>
            </div>
            {finishedMatches.length === 0 && (
              <div className="text-center py-8 text-tg-text-secondary">No finished matches yet.</div>
            )}
            {finishedMatches.map(renderFinishedCard)}

            <div className="mt-4 text-xs text-center text-tg-text-secondary px-6">
              Points shown above are for the currently selected user ({viewedUser.name}).
            </div>
          </>
        )}

        {/* LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <Users size={18} />
              <div className="font-semibold">Leaderboard</div>
            </div>

            <div className="tg-card divide-y divide-white/10 overflow-hidden">
              {leaderboard.map((entry, idx) => {
                const isCurrent = entry.id === viewedUserId;
                return (
                  <div
                    key={entry.id}
                    className={`leaderboard-row flex items-center px-4 py-3.5 ${isCurrent ? 'bg-white/5' : ''}`}
                    onClick={() => setViewedUserId(entry.id)}
                  >
                    <div className="w-7 font-mono text-xl font-black text-tg-text-secondary">#{idx + 1}</div>
                    <div className="flex-1 pl-1">
                      <div className="font-semibold text-lg flex items-center gap-2">
                        {entry.name}
                        {entry.isAdmin && <span className="admin-badge">ADMIN</span>}
                        {isCurrent && <span className="text-xs px-2 py-px bg-white/10 rounded">you</span>}
                      </div>
                      <div className="text-xs text-tg-text-secondary">{entry.predictedCount} / {matches.length} matches predicted</div>
                    </div>
                    <div className={`text-right font-black text-3xl tabular-nums tracking-[-1.5px] ${entry.points >= 0 ? 'points-positive' : 'points-negative'}`}>
                      {entry.points}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-tg-text-secondary mt-3 px-2">
              Tap a row to view as that player. Points are calculated from finished matches only.
            </div>
          </div>
        )}

        {/* ADMIN */}
        {activeTab === 'admin' && isRealAdmin && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-1 px-1">
              <Settings size={18} />
              <div className="font-semibold">Admin Panel</div>
            </div>

            {/* Quick actions */}
            <div className="tg-card p-4 space-y-3">
              <div className="text-sm font-semibold mb-1">Data Sync (between you and Roman)</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={exportData} className="tg-button flex items-center gap-2 text-sm px-4 py-2">
                  <Download size={16} /> Export &amp; Copy JSON
                </button>
                <button onClick={importData} className="tg-button-secondary flex items-center gap-2 text-sm px-4 py-2 rounded-xl">
                  <Upload size={16} /> Import from Brother
                </button>
                <button onClick={resetToInitial} className="tg-button-secondary flex items-center gap-2 text-sm px-4 py-2 rounded-xl text-red-400 hover:bg-red-500/10">
                  <RefreshCw size={16} /> Reset to Initial
                </button>
                <button onClick={reseedRealUserPoints} className="tg-button-secondary flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20">
                  <RefreshCw size={16} /> Re-seed points for real IDs (Ivan 2 / Roman 8)
                </button>
              </div>
              <div className="text-xs text-tg-text-secondary pt-1">
                If you see 0 points, use "Re-seed points for real IDs". For best results also delete <code>data/db.json</code> and restart the server.<br />
                <strong>To edit Roman's predictions:</strong> Click the <strong>Roman</strong> button in the top switcher → go to Upcoming tab. You will see inputs for him and "Save Prediction for Roman".
              </div>
            </div>

            {/* Set / Edit results */}
            <div>
              <div className="text-sm font-semibold mb-2 px-1">Matches — Set or Edit Results</div>
              <div className="space-y-2">
                {matches.map(match => (
                  <div key={match.id} className="tg-card p-3 flex items-center justify-between text-sm">
                    <div>
                      <span className="font-semibold">{match.homeTeam} vs {match.awayTeam}</span>
                      <span className="ml-2 text-tg-text-secondary text-xs">({match.stage})</span>
                      {match.status === 'finished' && (
                        <span className="ml-2 text-[#4ade80] text-xs">• {match.homeScore}–{match.awayScore}</span>
                      )}
                    </div>
                    <button
                      onClick={() => openResultModal(match)}
                      className="tg-button-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    >
                      <Edit2 size={14} /> {match.status === 'finished' ? 'Edit Result' : 'Set Result & Finish'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add match */}
            <div className="tg-card p-4">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full flex items-center justify-center gap-2 py-2 font-semibold tg-button-secondary rounded-xl mb-2"
              >
                <Plus size={17} /> {showAddForm ? 'Cancel' : 'Add New Match'}
              </button>

              {showAddForm && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      placeholder="Home Team"
                      value={newMatch.homeTeam}
                      onChange={e => setNewMatch({ ...newMatch, homeTeam: e.target.value })}
                      className="score-input w-full !h-10 text-left px-3"
                    />
                    <input
                      placeholder="Away Team"
                      value={newMatch.awayTeam}
                      onChange={e => setNewMatch({ ...newMatch, awayTeam: e.target.value })}
                      className="score-input w-full !h-10 text-left px-3"
                    />
                  </div>
                  <input
                    placeholder="Date e.g. Jun 22, 2026 • 19:00"
                    value={newMatch.date}
                    onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                    className="score-input w-full !h-10 text-left px-3"
                  />
                  <input
                    placeholder="Stage (e.g. Group A, Quarter-final)"
                    value={newMatch.stage}
                    onChange={e => setNewMatch({ ...newMatch, stage: e.target.value })}
                    className="score-input w-full !h-10 text-left px-3"
                  />
                  <button onClick={addNewMatch} className="tg-button w-full">Add Match</button>
                </div>
              )}
            </div>

            <div className="text-xs text-center text-amber-400/70 px-4">
              Remember to Export after changes and share with Roman so you stay in sync.
            </div>
          </div>
        )}

        {/* Info footer */}
        <div className="mt-8 text-center text-[10px] text-tg-text-secondary px-6 leading-relaxed">
          Scoring: <span className="font-semibold text-[#22c55e]">+5</span> exact score • <span className="font-semibold text-[#eab308]">+2</span> correct winner/draw • <span className="font-semibold text-[#ef4444]">-2</span> wrong outcome
          <br />Seeded with Ivan: 2 pts • Roman: 8 pts from the first three finished games.
        </div>
      </div>

      {/* RESULT MODAL (Admin) */}
      {resultModalMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={closeResultModal}>
          <div className="tg-card w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="font-bold text-lg mb-1">Set Match Result</div>
            <div className="text-sm mb-4 text-tg-text-secondary">
              {resultModalMatch.homeTeam} vs {resultModalMatch.awayTeam} <span className="text-xs">({resultModalMatch.stage})</span>
            </div>

            <div className="flex items-center gap-4 justify-center mb-5">
              <div className="text-center">
                <div className="text-xs mb-1 text-tg-text-secondary">{resultModalMatch.homeTeam}</div>
                <input
                  type="number"
                  value={resultHome}
                  onChange={(e) => setResultHome(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                  className="score-input text-3xl font-black"
                />
              </div>
              <div className="text-3xl text-tg-text-secondary font-light pt-6">:</div>
              <div className="text-center">
                <div className="text-xs mb-1 text-tg-text-secondary">{resultModalMatch.awayTeam}</div>
                <input
                  type="number"
                  value={resultAway}
                  onChange={(e) => setResultAway(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                  className="score-input text-3xl font-black"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={closeResultModal} className="flex-1 tg-button-secondary py-3 rounded-2xl">Cancel</button>
              <button onClick={confirmSetResult} className="flex-1 tg-button py-3 rounded-2xl">Confirm Result</button>
            </div>

            <div className="text-[10px] text-center text-tg-text-secondary mt-3">
              This will mark the match finished (or update the score) and immediately award points based on saved predictions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
