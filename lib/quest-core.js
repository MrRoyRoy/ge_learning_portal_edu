/**
 * Quest Run — shared, side-effect-free core logic.
 *
 * Loaded two ways:
 *   - Node (server.js):   const QuestCore = require('./lib/quest-core');
 *   - Browser (index.html): <script src="lib/quest-core.js"> → window.QuestCore
 *
 * Everything here is pure: no DOM, no I/O, no global mutation (other than the
 * UMD export). All functions take explicit inputs so they can be unit-tested
 * from either side.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.QuestCore = api;
    root.getAcademicPosition = api.getAcademicPosition;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Default Hong Kong-style academic calendar (MM-DD, contiguous, wraps the year). */
  const DEFAULT_ACADEMIC_CALENDAR = Object.freeze({
    semA: Object.freeze({ start: '09-01', end: '12-20' }),
    winter: Object.freeze({ start: '12-21', end: '01-11' }),
    semB: Object.freeze({ start: '01-12', end: '05-10' }),
    summer: Object.freeze({ start: '05-11', end: '08-31' })
  });

  /** Terms in chronological order inside one academic year. */
  const TERM_ORDER = Object.freeze(['semA', 'winter', 'semB', 'summer']);
  const SEMESTER_TERMS = Object.freeze(['semA', 'semB']);

  const PHASES = Object.freeze(['sem_start', 'teaching', 'midterm', 'finals', 'winter', 'summer']);
  const TIMINGS = Object.freeze(['anytime'].concat(PHASES));

  const ROLES = Object.freeze([
    'Lecturer', 'TA', 'Researcher', 'Student', 'Program Leader', 'Dean',
    'IT Admin', 'SAO', 'Security', 'Finance'
  ]);

  const HERO_CLASS_BY_ROLE = Object.freeze({
    Lecturer: 'wizard', TA: 'wizard', Researcher: 'wizard', 'Program Leader': 'wizard', Dean: 'wizard',
    Student: 'warrior',
    SAO: 'priest', 'IT Admin': 'priest', Finance: 'priest', Security: 'priest'
  });

  const DAY_MS = 86400000;
  // Cumulative days before each month in a NON-leap year (index 0 = Jan).
  const CUM_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const MONTH_LEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  /**
   * Parses "MM-DD" into {month (1-12), day}. Returns null when malformed or
   * when the date does not exist in a non-leap year (02-29 is rejected so a
   * calendar boundary never disappears in three out of four years).
   */
  function parseMonthDay(md) {
    if (typeof md !== 'string' || !/^\d{2}-\d{2}$/.test(md)) return null;
    const month = Number(md.slice(0, 2));
    const day = Number(md.slice(3, 5));
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > MONTH_LEN[month - 1]) return null;
    return { month, day };
  }

  /** 0-based day-of-year in a non-leap year (Jan 1 → 0, Dec 31 → 364). */
  const doyOf = (md) => CUM_DAYS[md.month - 1] + md.day - 1;

  /**
   * Validates a calendar object. Rules:
   *   1. Every term has valid start/end MM-DD (no 02-29).
   *   2. Terms are contiguous in TERM_ORDER: each term starts exactly one day
   *      after the previous one ends, and summer.end + 1 day === semA.start.
   *      Day arithmetic happens on a 365-day ring so year wrap-around works.
   * Returns { ok, errors: [{ code, term }] }.
   */
  function validateCalendar(cal) {
    const errors = [];
    if (!cal || typeof cal !== 'object') {
      return { ok: false, errors: [{ code: 'invalid_calendar', term: null }] };
    }
    const parsed = {};
    TERM_ORDER.forEach((key) => {
      const t = cal[key];
      const s = t && parseMonthDay(t.start);
      const e = t && parseMonthDay(t.end);
      if (!s || !e) errors.push({ code: 'invalid_date', term: key });
      else parsed[key] = { s: doyOf(s), e: doyOf(e) };
    });
    if (errors.length) return { ok: false, errors };
    TERM_ORDER.forEach((key, i) => {
      const next = TERM_ORDER[(i + 1) % TERM_ORDER.length];
      if ((parsed[key].e + 1) % 365 !== parsed[next].s) {
        errors.push({ code: 'not_contiguous', term: next });
      }
    });
    return { ok: errors.length === 0, errors };
  }

  /** Returns a validated calendar, falling back to the default when invalid. */
  function normalizeCalendar(cal) {
    return validateCalendar(cal).ok
      ? TERM_ORDER.reduce((acc, k) => Object.assign(acc, { [k]: { start: cal[k].start, end: cal[k].end } }), {})
      : JSON.parse(JSON.stringify(DEFAULT_ACADEMIC_CALENDAR));
  }

  /**
   * Day number for a LOCAL calendar date (time-of-day and DST ignored).
   * Using Date.UTC on the local y/m/d makes day differences exact integers.
   */
  const dayNum = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
  const dateDayNum = (date) => dayNum(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const isoFromDayNum = (n) => new Date(n * DAY_MS).toISOString().slice(0, 10);

  /**
   * Concrete instance of a term that starts in `startYear`. A term whose end
   * MM-DD is before its start MM-DD crosses New Year, so its end falls in
   * startYear + 1.
   */
  function termInstance(cal, key, startYear) {
    const s = parseMonthDay(cal[key].start);
    const e = parseMonthDay(cal[key].end);
    const crosses = doyOf(e) < doyOf(s);
    const startN = dayNum(startYear, s.month, s.day);
    const endN = dayNum(crosses ? startYear + 1 : startYear, e.month, e.day);
    return { key, startN, endN };
  }

  /** Finds the term instance containing day number `n` (checks start years y-1 and y). */
  function findTerm(cal, n, year) {
    for (const y of [year - 1, year]) {
      for (const key of TERM_ORDER) {
        const inst = termInstance(cal, key, y);
        if (n >= inst.startN && n <= inst.endN) return inst;
      }
    }
    return null;
  }

  /**
   * Where `date` sits inside the academic calendar.
   *
   * Semester phase heuristic (semA / semB only):
   *   - week <= 3                       → 'sem_start'
   *   - fewer than 21 days remaining    → 'finals'
   *   - 35% <= progress < 60%           → 'midterm'
   *   - otherwise                       → 'teaching'
   * Breaks map directly to 'winter' / 'summer'.
   *
   * Returns { term, week, totalWeeks, phase, pct, termStart, termEnd }.
   */
  function getAcademicPosition(date, calendar) {
    const cal = normalizeCalendar(calendar);
    const d = date instanceof Date ? date : new Date(date);
    const n = dateDayNum(d);
    const inst = findTerm(cal, n, d.getFullYear());
    // A valid contiguous calendar always covers every day; this is defensive.
    if (!inst) return { term: 'semA', week: 1, totalWeeks: 1, phase: 'teaching', pct: 0, termStart: null, termEnd: null };
    const len = inst.endN - inst.startN + 1;
    const elapsed = n - inst.startN;
    const remaining = inst.endN - n;
    const week = Math.floor(elapsed / 7) + 1;
    const totalWeeks = Math.ceil(len / 7);
    const pct = elapsed / len;
    let phase;
    if (!SEMESTER_TERMS.includes(inst.key)) phase = inst.key;
    else if (week <= 3) phase = 'sem_start';
    else if (remaining < 21) phase = 'finals';
    else if (pct >= 0.35 && pct < 0.6) phase = 'midterm';
    else phase = 'teaching';
    return {
      term: inst.key, week, totalWeeks, phase,
      pct: Math.round(pct * 1000) / 1000,
      termStart: isoFromDayNum(inst.startN),
      termEnd: isoFromDayNum(inst.endN)
    };
  }

  /**
   * The academic year containing `date`, laid out as percentages for the
   * timeline: { start, end, todayPct, terms:[{key,startPct,endPct}], months:[{month,year,pct}] }.
   */
  function getAcademicYear(date, calendar) {
    const cal = normalizeCalendar(calendar);
    const d = date instanceof Date ? date : new Date(date);
    const n = dateDayNum(d);
    const sA = parseMonthDay(cal.semA.start);
    // The academic year starts at the most recent semA start on/before today.
    let startYear = d.getFullYear();
    if (n < dayNum(startYear, sA.month, sA.day)) startYear -= 1;
    const yStart = dayNum(startYear, sA.month, sA.day);
    const yEnd = dayNum(startYear + 1, sA.month, sA.day) - 1;
    const span = yEnd - yStart + 1;
    const toPct = (x) => Math.max(0, Math.min(1, (x - yStart) / span));
    // Terms in order; each instance may start in startYear or startYear+1.
    const terms = TERM_ORDER.map((key) => {
      let inst = termInstance(cal, key, startYear);
      if (inst.startN < yStart) inst = termInstance(cal, key, startYear + 1);
      return { key, startPct: toPct(inst.startN), endPct: toPct(inst.endN + 1) };
    });
    // Month ticks on the first day of each month inside the year.
    const months = [];
    const first = new Date(Date.UTC(startYear, sA.month - 1, 1));
    for (let i = 0; i <= 12; i++) {
      const md = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + i, 1));
      const mn = Math.floor(md.getTime() / DAY_MS);
      if (mn >= yStart && mn <= yEnd) months.push({ month: md.getUTCMonth() + 1, year: md.getUTCFullYear(), pct: toPct(mn) });
    }
    return {
      start: isoFromDayNum(yStart), end: isoFromDayNum(yEnd),
      todayPct: toPct(n + 0.5), terms, months
    };
  }

  const heroClassForRole = (role) => HERO_CLASS_BY_ROLE[role] || 'warrior';

  /** Category ids (lib/categories.js) that count as administrative staff for the hero. */
  const ADMIN_STAFF_CATEGORIES = Object.freeze(['leadership', 'student_affairs', 'finance', 'security', 'it_admin']);

  /**
   * Picks the Quest Run hero from a user's categories (ids from lib/categories.js).
   * Precedence, highest first, so a user with several categories gets one stable hero:
   *   1. any 'teaching' or 'research' category -> 'wizard'
   *   2. any administrative staff category  -> 'priest' (ADMIN_STAFF_CATEGORIES)
   *   3. anything else (students only, none, unknown ids) -> 'warrior' (default)
   * Non-array input is treated as "no categories".
   */
  const heroClassForCategories = (cats) => {
    const ids = Array.isArray(cats) ? cats : [];
    if (ids.includes('teaching') || ids.includes('research')) return 'wizard';
    if (ids.some(id => ADMIN_STAFF_CATEGORIES.includes(id))) return 'priest';
    return 'warrior';
  };

  /**
   * Weighted random hint selection for the current phase.
   * Eligible hints: timing contains `phase` (weight 3) or 'anytime' (weight 1).
   * The previously shown hint (`lastId`) is excluded when there is any other
   * choice, so the bubble never repeats back-to-back. If nothing matches the
   * phase at all, every hint becomes eligible with weight 1.
   */
  function pickWeightedHint(hints, phase, lastId, rand) {
    const rnd = typeof rand === 'function' ? rand : Math.random;
    const list = Array.isArray(hints) ? hints : [];
    if (!list.length) return null;
    const weightOf = (h) => {
      const t = Array.isArray(h.timing) && h.timing.length ? h.timing : ['anytime'];
      if (t.includes(phase)) return 3;
      if (t.includes('anytime')) return 1;
      return 0;
    };
    let pool = list.map((h) => ({ h, w: weightOf(h) })).filter((x) => x.w > 0);
    if (!pool.length) pool = list.map((h) => ({ h, w: 1 }));
    if (pool.length > 1 && lastId != null) {
      const without = pool.filter((x) => x.h.id !== lastId);
      if (without.length) pool = without;
    }
    const total = pool.reduce((s, x) => s + x.w, 0);
    let r = rnd() * total;
    for (const x of pool) {
      r -= x.w;
      if (r < 0) return x.h;
    }
    return pool[pool.length - 1].h;
  }

  /**
   * Decides what the bubble shows in rotation slot `slotIndex`.
   *   - Slot 0: a pinned, non-dismissed news item; else the first unseen
   *     non-dismissed item; else a hint.
   *   - Later slots: every 4th slot ((slotIndex+1) % 4 === 0) shows news,
   *     round-robin over non-dismissed items via `newsCursor`; else a hint.
   * Returns { kind: 'news', item, newsCursor } or { kind: 'hint', newsCursor }.
   */
  function planQuestSlot(opts) {
    const o = opts || {};
    const news = Array.isArray(o.news) ? o.news : [];
    const seen = new Set(o.seenIds || []);
    const dismissed = new Set(o.dismissedIds || []);
    const cursor = Number(o.newsCursor) || 0;
    const live = news.filter((n) => !dismissed.has(n.id));
    if (!live.length) return { kind: 'hint', newsCursor: cursor };
    if (o.slotIndex === 0) {
      const pinned = live.find((n) => n.pinned);
      if (pinned) return { kind: 'news', item: pinned, newsCursor: cursor };
      const unseen = live.find((n) => !seen.has(n.id));
      if (unseen) return { kind: 'news', item: unseen, newsCursor: cursor };
      return { kind: 'hint', newsCursor: cursor };
    }
    if ((o.slotIndex + 1) % 4 === 0) {
      const item = live[cursor % live.length];
      return { kind: 'news', item, newsCursor: cursor + 1 };
    }
    return { kind: 'hint', newsCursor: cursor };
  }

  /** "YYYY-MM-DD" for the LOCAL date of `date` (defaults to now). */
  function localDateIso(date) {
    const d = date instanceof Date ? date : new Date();
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  /**
   * Lifecycle status of an announcement for `todayIso`:
   * 'inactive' (switched off), 'scheduled' (before start), 'expired' (after
   * end), or 'live'. ISO date strings compare correctly as plain strings.
   */
  function newsStatus(n, todayIso) {
    const today = todayIso || localDateIso();
    if (!n || !n.active) return 'inactive';
    const s = n.startsAt || n.starts_at || '';
    const e = n.endsAt || n.ends_at || '';
    if (s && today < s) return 'scheduled';
    if (e && today > e) return 'expired';
    return 'live';
  }

  /** Empty / missing audience means "everyone". */
  function audienceIncludes(audience, role) {
    return !Array.isArray(audience) || audience.length === 0 || audience.includes(role);
  }

  return {
    DEFAULT_ACADEMIC_CALENDAR, TERM_ORDER, PHASES, TIMINGS, ROLES, HERO_CLASS_BY_ROLE,
    parseMonthDay, validateCalendar, normalizeCalendar,
    getAcademicPosition, getAcademicYear, heroClassForRole,
    ADMIN_STAFF_CATEGORIES, heroClassForCategories,
    pickWeightedHint, planQuestSlot, newsStatus, localDateIso, audienceIncludes
  };
});
