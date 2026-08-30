// ══════════════════════════════════════════════════
//  ADMIN — LOGIN GATE + LIVE CLAN LEADERBOARD
//
//  Phase 1 (login gate) — client-side credential check.
//  NOTE ON SECURITY: credentials are checked client-side.
//  For real production use, move this to a Cloud Function
//  / Firebase custom-claim check and lock the
//  `leaderboard`/`players` collections down with
//  firestore.rules.
//
//  Phase 2 — the dashboard renders the "Clan Leaderboard
//  Portal" table with dashboard-wide totals + a Leading
//  Clan card.
//
//  DATA SOURCE: this now reads LIVE from Firestore
//  (leaderboard/{clanKey} docs) via database.js, the same
//  collection game.html writes to. Every laptop/device
//  writes to and reads from this one shared Firestore
//  project, so the dashboard here reflects matches played
//  anywhere — not just the one browser it happens to be
//  open in.
// ══════════════════════════════════════════════════
import { CLANS, ensureLeaderboardDocs, subscribeLeaderboard, resetLeaderboard } from './core.js';

const ADMIN_USER = 'AJ-SIVA';
const ADMIN_PASS = '0406';
const SESSION_KEY = 'billiards_admin_session_v1';

function createEmptyClanStats() {
  return { games: 0, wins: 0, losses: 0, playerPooled: 0, cpuPooled: 0, totalPooled: 0 };
}

const leaderboard = {};
for (const key of Object.keys(CLANS)) leaderboard[key] = createEmptyClanStats();

let unsubscribeLeaderboard = null;
let liveStarted = false;

function startLiveLeaderboard() {
  if (liveStarted) return;
  liveStarted = true;
  ensureLeaderboardDocs()
    .then(() => {
      unsubscribeLeaderboard = subscribeLeaderboard((clanKey, data) => {
        leaderboard[clanKey] = data;
        if (sessionStorage.getItem(SESSION_KEY) === '1') renderDashboard();
      });
    })
    .catch((err) => {
      console.error('Firestore leaderboard unavailable in admin dashboard:', err);
      document.getElementById('admin-err').textContent =
        'Could not reach Firestore — showing local data only. Check your network/Firebase config.';
    });
}

function renderDashboard() {
  const body = document.getElementById('admin-body');
  body.innerHTML = '';

  let totalGames = 0, totalWins = 0, totalPooled = 0;
  let leader = null;

  Object.entries(CLANS).forEach(([key, clan]) => {
    const stat = leaderboard[key] || createEmptyClanStats();
    totalGames += stat.games;
    totalWins += stat.wins;
    totalPooled += stat.totalPooled;

    if (!leader || stat.wins > leader.wins ||
        (stat.wins === leader.wins && stat.totalPooled > leader.totalPooled)) {
      leader = { name: clan.name, wins: stat.wins, totalPooled: stat.totalPooled };
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="clan-cell">
          <img class="clan-logo" src="${clan.logo}" alt="${clan.name}" onerror="this.style.display='none'">
          <span class="clan-name">${clan.badge} ${clan.name}</span>
        </div>
      </td>
      <td>${stat.games}</td>
      <td>${stat.wins}</td>
      <td>${stat.losses}</td>
      <td>${stat.playerPooled}</td>
      <td>${stat.cpuPooled}</td>
      <td>${stat.totalPooled}</td>
    `;
    body.appendChild(row);
  });

  document.getElementById('admin-total-games').textContent = String(totalGames);
  document.getElementById('admin-total-wins').textContent = String(totalWins);
  document.getElementById('admin-total-pooled').textContent = String(totalPooled);
  document.getElementById('admin-leading-clan').textContent =
    leader && leader.wins > 0 ? leader.name : '-';

  document.getElementById('admin-empty').style.display = totalGames > 0 ? 'none' : 'block';
}

function showDashboard() {
  document.getElementById('admin-login-wrap').style.display = 'none';
  document.getElementById('dashboard-placeholder').style.display = 'block';
  renderDashboard();
}

function showLogin() {
  document.getElementById('admin-login-wrap').style.display = 'flex';
  document.getElementById('dashboard-placeholder').style.display = 'none';
}

function tryLogin() {
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value;
  const err = document.getElementById('admin-err');

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, '1');
    startLiveLeaderboard();
    showDashboard();
  } else {
    err.textContent = 'Invalid admin credentials.';
  }
}

function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
}

async function handleReset() {
  const sure = confirm(
    'Reset the tournament?\n\nThis wipes games, wins, losses and balls pooled for ALL clans back to zero. This cannot be undone.'
  );
  if (!sure) return;

  const typed = prompt('Type RESET to confirm.');
  if (typed !== 'RESET') return;

  const btn = document.getElementById('admin-reset');
  btn.disabled = true;
  btn.textContent = 'Resetting…';
  try {
    await resetLeaderboard();
    btn.textContent = 'Reset Tournament';
  } catch (err) {
    console.error('Failed to reset leaderboard:', err);
    alert('Reset failed — check your connection/Firebase config and try again.');
    btn.textContent = 'Reset Tournament';
  } finally {
    btn.disabled = false;
  }
}

document.getElementById('admin-login-btn').addEventListener('click', tryLogin);
document.getElementById('admin-pass').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tryLogin();
});
document.getElementById('admin-signout').addEventListener('click', signOut);
document.getElementById('admin-reset').addEventListener('click', handleReset);

// Restore an existing admin session on refresh.
if (sessionStorage.getItem(SESSION_KEY) === '1') {
  startLiveLeaderboard();
  showDashboard();
}
