/**
 * lib/leaderboard.js
 * Pure scoring for the Idea Leaderboard (user portal) and the admin Analytics podium.
 * The server gathers per-contributor counts for a time window; this module turns them into points, ranks
 * and display names. No I/O, no mutation of the input.
 *
 * Points (shown to users under "How points work"):
 *   idea submitted (feedback that passed the quality gate) ............ 2
 *   idea turned into a playbook credited to you ....................... 20
 *   each like on your playbooks ........................................ 5
 *   every 10 views of your playbooks ................................... 1
 */
'use strict';

const POINTS = Object.freeze({ idea: 2, playbook: 20, like: 5, viewsPerPoint: 10 });
const TOP_N = 10;

/** Points for one contributor's counts. Pure. */
const pointsFor = ({ ideas = 0, playbooks = 0, likes = 0, views = 0 }) =>
  ideas * POINTS.idea + playbooks * POINTS.playbook + likes * POINTS.like + Math.floor(views / POINTS.viewsPerPoint);

/**
 * Name shown on the board. Users see only the part before "@" ("ge-student"), so the board never lists full
 * addresses; admins (full = true) see the stored value. Free-text creators ("Dr Chan") are shown as-is.
 * `clashes` holds short names used by more than one address; those get the first domain label
 * ("ge-staff (mastermind)") so two people never look like one.
 */
const displayName = (id, full = false, clashes = null) => {
  const s = String(id || '').trim();
  if (full || !s.includes('@')) return s;
  const [local, domain] = s.split('@');
  return clashes && clashes.has(local.toLowerCase()) ? `${local} (${(domain || '').split('.')[0]})` : local;
};

/** Short names (part before "@") shared by more than one distinct address. Pure. */
const shortNameClashes = (ids) => {
  const seen = new Map();
  [...new Set((ids || []).map(i => String(i || '').trim().toLowerCase()).filter(i => i.includes('@')))]
    .forEach(addr => { const local = addr.split('@')[0]; seen.set(local, (seen.get(local) || 0) + 1); });
  return new Set([...seen].filter(([, n]) => n > 1).map(([local]) => local));
};

/**
 * Merge per-metric maps { key -> count } into ranked contributors.
 * Keys are lower-cased contributor ids (email or free-text creator name).
 * Ties: more points, then playbooks, likes, views, ideas, then name. Ranks run 1, 2, 3... so the podium always
 * has three distinct places.
 * @returns {Array<{key, points, ideas, playbooks, likes, views, rank}>} every contributor with > 0 points
 */
const rankContributors = ({ ideas = {}, playbooks = {}, likes = {}, views = {} }) => {
  const keys = new Set([...Object.keys(ideas), ...Object.keys(playbooks), ...Object.keys(likes), ...Object.keys(views)]);
  const rows = [...keys].map(key => {
    const c = {
      key,
      ideas: Math.max(0, ideas[key] || 0),
      playbooks: Math.max(0, playbooks[key] || 0),
      likes: Math.max(0, likes[key] || 0),
      views: Math.max(0, views[key] || 0)
    };
    return { ...c, points: pointsFor(c) };
  }).filter(c => c.points > 0)
    .sort((a, b) => b.points - a.points || b.playbooks - a.playbooks || b.likes - a.likes ||
      b.views - a.views || b.ideas - a.ideas || a.key.localeCompare(b.key));
  return rows.map((c, i) => ({ ...c, rank: i + 1 }));
};

/**
 * The viewer's standing: their row (or a zero row when they have no points yet) plus how many points they need
 * to move up one place. Pure.
 */
const standingFor = (ranked, viewerKey) => {
  const key = String(viewerKey || '').toLowerCase();
  if (!key) return null;
  const i = ranked.findIndex(c => c.key === key);
  if (i === -1) {
    // No points yet: one submitted idea puts them on the board
    return { key, points: 0, ideas: 0, playbooks: 0, likes: 0, views: 0, rank: null, toNext: POINTS.idea, nextRank: null };
  }
  const me = ranked[i];
  const above = ranked.slice(0, i).reverse().find(c => c.points > me.points);
  return { ...me, toNext: above ? above.points - me.points + 1 : 0, nextRank: above ? above.rank : null };
};

module.exports = { POINTS, TOP_N, pointsFor, displayName, shortNameClashes, rankContributors, standingFor };
