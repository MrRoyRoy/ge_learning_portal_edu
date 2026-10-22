/**
 * lib/similarity.js
 * Pure keyword similarity used by "Convert to Playbook" to find existing playbooks that
 * look like a feedback idea before Gemini (optionally) re-ranks them.
 *
 * Tokenising:
 *   - Latin text: lowercase words of 3+ letters, minus a small stop-word list, with a
 *     naive plural/suffix trim ("rubrics" -> "rubric", "grading"/"grade" -> "grad").
 *   - CJK text: overlapping character bigrams ("評分標準" -> 評分, 分標, 標準), because
 *     Chinese has no spaces and bigrams are a robust cheap proxy for words.
 * Scoring: cosine similarity over term-frequency vectors, scaled to 0-100.
 */
'use strict';

const STOP = new Set(('the and for with that this from into your you our are was were can will would should could ' +
  'have has had not but all any use using used make help want need like just also more some them they their ' +
  'there what when where which who how about would please idea ideas playbook playbooks case cases gemini ' +
  'portal feature new add suggest suggestion maybe very much each other than then its it\'s get got').split(/\s+/));

/** Trim common English suffixes so "rubrics"/"rubric" and "grading"/"graded" meet. */
const stem = (w) => w.replace(/(ing|ed|es|s|e)$/, '').replace(/(.)\1$/, '$1') || w;

/** Text -> array of tokens (Latin stems + CJK bigrams). Pure. */
const tokenize = (text) => {
  const s = String(text || '').toLowerCase();
  const latin = (s.match(/[a-z][a-z0-9]{2,}/g) || []).filter(w => !STOP.has(w)).map(stem).filter(w => w.length >= 3);
  const cjk = (s.match(/[\u3400-\u9fff]+/g) || []).flatMap(run =>
    run.length === 1 ? [run] : Array.from({ length: run.length - 1 }, (_, i) => run.slice(i, i + 2)));
  return latin.concat(cjk);
};

/** Token list -> Map(token -> count). */
const termFreq = (tokens) => tokens.reduce((m, t) => m.set(t, (m.get(t) || 0) + 1), new Map());

/** Cosine similarity of two term-frequency maps, 0..1. */
const cosine = (a, b) => {
  let dot = 0;
  a.forEach((v, k) => { if (b.has(k)) dot += v * b.get(k); });
  const norm = (m) => Math.sqrt([...m.values()].reduce((s, v) => s + v * v, 0));
  const d = norm(a) * norm(b);
  return d ? dot / d : 0;
};

/** 0-100 similarity between two free texts. */
const similarityScore = (textA, textB) =>
  Math.round(cosine(termFreq(tokenize(textA)), termFreq(tokenize(textB))) * 100);

/**
 * Rank candidate documents [{id, text, ...}] against a query text.
 * Returns the top `limit` items with a `score` (0-100), highest first; zero scores dropped.
 */
const rankBySimilarity = (query, docs, limit = 8) => {
  const q = termFreq(tokenize(query));
  return (docs || [])
    .map(d => ({ ...d, score: Math.round(cosine(q, termFreq(tokenize(d.text))) * 100) }))
    .filter(d => d.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
};

/**
 * Stage 1 of the two-stage similarity check: choose which playbooks Gemini gets to see.
 *
 * Small catalogues (<= max) go to Gemini whole: ~60 tokens per playbook (id + title + 280-char summary),
 * so 40 playbooks ≈ 2.5k input tokens, and Gemini catches paraphrased / cross-language matches that
 * keywords miss. Larger catalogues are cut to the `max` best keyword matches (docs carry en + zh text,
 * so Chinese ideas still hit English playbooks through their zh title / summary). Keyword-zero docs fill
 * any remaining slots in their original order, so Gemini always sees a full shortlist.
 * Returns { docs, prefiltered } with docs in their original shape (no score).
 */
const shortlistForRerank = (query, docs, max = 40) => {
  const all = docs || [];
  if (all.length <= max) return { docs: all, prefiltered: false };
  const q = termFreq(tokenize(query));
  const scored = all.map((d, i) => ({ d, i, s: cosine(q, termFreq(tokenize(d.text))) }));
  const picked = scored.sort((x, y) => y.s - x.s || x.i - y.i).slice(0, max).map(x => x.d);
  return { docs: picked, prefiltered: true };
};

module.exports = { tokenize, similarityScore, rankBySimilarity, shortlistForRerank };
