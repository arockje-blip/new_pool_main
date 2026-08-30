// ══════════════════════════════════════════════════
//  CORE — one file for everything shared: Firebase init,
//  clan data, and all Firestore read/write logic.
//  Both game.html (via js/game.js) and admin.html (via
//  js/admin.js) import from this single file instead of
//  juggling separate firebase.js / clans.js / database.js
//  modules.
// ══════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, increment, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── FIREBASE INIT (Modular SDK — Firestore only) ──
const firebaseConfig = {
  apiKey: "AIzaSyBIN9V6VU272N4Q85vQoWC7FvVSc-NQuqE",
  authDomain: "pool8-2d25c.firebaseapp.com",
  projectId: "pool8-2d25c",
  storageBucket: "pool8-2d25c.firebasestorage.app",
  messagingSenderId: "314144118688",
  appId: "1:314144118688:web:08f57c12a32a7c14e976c5",
  measurementId: "G-BD0JFH2R4Y"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── CLANS — single source of truth for clan keys/names/passwords/domains ──
export const CLANS = {
  aura7f: {
    name: 'Aura7F',
    color: '#4aa86a',
    badge: '⚡',
    logo: 'images/clans/aura.jpg',
    password: 'tech',
    domains: ['App Developer', 'Web Developer', 'Game Developer', 'Full Stack', 'Cybersecurity', 'UI & UX Designer', 'Data Scientist', 'AI & ML Engineer']
  },
  belmonts: {
    name: 'Belmonts',
    color: '#a84a4a',
    badge: '🏔️',
    logo: 'images/clans/belmonts.jpg',
    password: 'mount',
    domains: ['Game Developer', 'Full Stack Developer', 'Data Scientist', 'AI & ML Engineer', 'DevOps', 'App Developer', 'Cybersecurity']
  },
  lumina: {
    name: 'Lumina',
    color: '#f0d040',
    badge: '☀️',
    logo: 'images/clans/lumina.jpg',
    password: 'light',
    domains: ['Web Developer', 'UI & UX Designer', 'Full Stack', 'Cybersecurity', 'Cloud Engineer', 'AI & ML Engineer', 'Data Scientist']
  },
  adepti: {
    name: 'Adepti',
    color: '#4a7ba7',
    badge: '✨',
    logo: 'images/clans/adepti.jpg',
    password: 'space',
    domains: ['UI & UX Designer', 'Full Stack', 'AI & ML Engineer', 'Game Developer', 'Data Scientist', 'Embedded System', 'IoT']
  }
};

// ══════════════════════════════════════════════════
//  DATABASE (Firestore access layer)
//  Every read/write the game needs goes through here.
//
//  Collections used (see firestore.rules):
//    leaderboard/{clanKey}   -> aggregate clan stats
//    players/{playerId}      -> one doc per logged-in player/device
// ══════════════════════════════════════════════════
const LEADERBOARD_COL = 'leaderboard';
const PLAYERS_COL = 'players';
const PLAYER_ID_KEY = 'billiards_player_id_v1';

// ── Empty stat shape, used to seed a clan's leaderboard doc ──
export function createEmptyClanStats() {
  return {
    games: 0, wins: 0, losses: 0,
    playerPooled: 0, cpuPooled: 0, totalPooled: 0,
    ballsPotted: 0, correctAnswers: 0, wrongAnswers: 0
  };
}

// ── Make sure every clan has a leaderboard doc so the admin
//    dashboard / onSnapshot listeners never see "missing" clans ──
export async function ensureLeaderboardDocs() {
  const jobs = Object.keys(CLANS).map(async (clanKey) => {
    const ref = doc(db, LEADERBOARD_COL, clanKey);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, { clan: clanKey, ...createEmptyClanStats() });
    }
  });
  await Promise.all(jobs);
}

// ── Live subscription: fires cb(clanKey, data) whenever any clan's stats
//    change, on ANY device — this is what keeps the leaderboard/admin
//    dashboard in sync across every laptop, not just the one that scored. ──
export function subscribeLeaderboard(cb) {
  const unsubs = Object.keys(CLANS).map((clanKey) => {
    const ref = doc(db, LEADERBOARD_COL, clanKey);
    return onSnapshot(ref, (snap) => {
      cb(clanKey, snap.exists() ? snap.data() : createEmptyClanStats());
    });
  });
  return () => unsubs.forEach((u) => u());
}

// ── Record balls potted by either side during the current match ──
export async function recordPooledBalls(clanKey, actor, count) {
  if (!clanKey || !count) return;
  const ref = doc(db, LEADERBOARD_COL, clanKey);
  const field = actor === 0 ? 'playerPooled' : 'cpuPooled';
  await updateDoc(ref, {
    [field]: increment(count),
    totalPooled: increment(count),
    ballsPotted: increment(count)
  }).catch(async () => {
    // doc didn't exist yet - seed then retry once
    await setDoc(ref, { clan: clanKey, ...createEmptyClanStats() }, { merge: true });
    await updateDoc(ref, {
      [field]: increment(count),
      totalPooled: increment(count),
      ballsPotted: increment(count)
    });
  });
}

// ── Record a finished match result (player's clan vs their own clan's CPU) ──
export async function recordMatchResult(clanKey, playerWon) {
  if (!clanKey) return;
  const ref = doc(db, LEADERBOARD_COL, clanKey);
  await updateDoc(ref, {
    games: increment(1),
    wins: increment(playerWon ? 1 : 0),
    losses: increment(playerWon ? 0 : 1)
  });
}

// ── Quiz accuracy tracking (per clan, aggregate) ──
export async function recordQuizAnswer(clanKey, correct) {
  if (!clanKey) return;
  const ref = doc(db, LEADERBOARD_COL, clanKey);
  await updateDoc(ref, {
    correctAnswers: increment(correct ? 1 : 0),
    wrongAnswers: increment(correct ? 0 : 1)
  });
}

// ── Player identity (no Firebase Auth in this phase) ──
export function getOrCreatePlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
}

// ── Called on successful clan login: persists session + writes/updates the player doc ──
export async function loginPlayer(clanKey, playerName = 'Player') {
  const playerId = getOrCreatePlayerId();
  const ref = doc(db, PLAYERS_COL, playerId);
  await setDoc(ref, {
    name: playerName,
    clan: clanKey,
    online: true,
    lastSeen: serverTimestamp()
  }, { merge: true });

  sessionStorage.setItem('billiards_clan_login_v1', JSON.stringify({ clanKey, playerId, ts: Date.now() }));
  return playerId;
}

// ── Read back a stored login (so a refresh doesn't force re-login mid-session) ──
export function getStoredLogin() {
  try {
    const raw = sessionStorage.getItem('billiards_clan_login_v1');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredLogin() {
  sessionStorage.removeItem('billiards_clan_login_v1');
}

export async function setPlayerOnlineStatus(online) {
  const raw = getStoredLogin();
  if (!raw) return;
  const ref = doc(db, PLAYERS_COL, raw.playerId);
  await updateDoc(ref, { online, lastSeen: serverTimestamp() }).catch(() => {});
}

// ── Wipe every clan's leaderboard doc back to zero (end of tournament) ──
// Does NOT touch the `players` collection (login/session records) —
// only the aggregate stats shown on the leaderboard/admin dashboard.
export async function resetLeaderboard() {
  const jobs = Object.keys(CLANS).map((clanKey) => {
    const ref = doc(db, LEADERBOARD_COL, clanKey);
    return setDoc(ref, { clan: clanKey, ...createEmptyClanStats() });
  });
  await Promise.all(jobs);
}
