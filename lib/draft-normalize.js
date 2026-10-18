/**
 * lib/draft-normalize.js
 * Pure helpers that clean a Gemini "Draft / Refine with Gemini" reply so it matches the
 * conventions of the seeded playbooks before it reaches the admin case form:
 *   - prompt variables use {{UPPER_SNAKE}} tokens (legacy [VARIABLE] brackets are converted);
 *   - category / promptType / features / connectors only use values the portal understands;
 *   - ids are snake_case; steps are arrays of trimmed strings.
 * No I/O, no mutation of the input.
 */
'use strict';

const CATEGORIES = Object.freeze(['academic', 'student', 'operational', 'administrative']);
const PROMPT_TYPES = Object.freeze(['general', 'notebooklm', 'deep_research', 'agent_designer', 'canvas', 'image', 'video']);
const FEATURES = Object.freeze(['Agent Designer', 'NotebookLM', 'Deep Research', 'Canvas Mode', 'Image Generation', 'Video Generation']);
const CONNECTORS = Object.freeze(['Drive Connector', 'Email Connector', 'LMS Connector', 'Calendar Connector']);
const LANGS = Object.freeze(['en', 'zh-TW', 'zh-CN']);

/**
 * Convert legacy square-bracket placeholders to {{UPPER_SNAKE}} tokens.
 * Only ALL-CAPS Latin tokens of 3+ chars are converted ("[COURSE_NAME]", "[COURSE NAME]"), so
 * markdown links "[text](url)", option labels like "[A]" and ordinary bracketed prose are left alone.
 */
const toCurlyVariables = (text) =>
  typeof text !== 'string' ? text
    : text.replace(/\[([A-Z][A-Z0-9_ ]{1,48}[A-Z0-9])\](?!\()/g, (_, key) => `{{${key.trim().replace(/\s+/g, '_')}}}`);

/** "Lab Safety-Agent v2" -> "lab_safety_agent_v2". */
const toSnakeId = (id) =>
  String(id || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);

/** Map loose category labels onto the four stored values; unknown values become undefined. */
const normalizeCategory = (c) => {
  const v = String(c || '').toLowerCase().trim();
  if (v === 'admin' || v === 'administration') return 'administrative';
  if (v === 'operations') return 'operational';
  return CATEGORIES.includes(v) ? v : undefined;
};

/** Keep only allowed names (case-insensitive), returned in their canonical spelling. */
const pickAllowed = (list, allowed) =>
  Array.isArray(list)
    ? [...new Set(list.map(x => allowed.find(a => a.toLowerCase() === String(x).toLowerCase().trim())).filter(Boolean))]
    : undefined;

/** Clean one language profile: tokens in every text field, steps as trimmed non-empty strings. */
const normalizeProfile = (p) => {
  if (!p || typeof p !== 'object') return p;
  const steps = Array.isArray(p.steps) ? p.steps.map(s => toCurlyVariables(String(s).trim())).filter(Boolean) : p.steps;
  return {
    ...p,
    title: typeof p.title === 'string' ? p.title.trim() : p.title,
    summary: toCurlyVariables(p.summary),
    steps,
    prompt: toCurlyVariables(p.prompt),
    proTip: toCurlyVariables(p.proTip)
  };
};

/** Normalise a whole draft reply. Unknown enum values are dropped so the form keeps its current value. */
const normalizeDraft = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const out = { ...raw };
  if (raw.id !== undefined) out.id = toSnakeId(raw.id);
  if (raw.category !== undefined) out.category = normalizeCategory(raw.category);
  if (raw.promptType !== undefined) {
    // Accept feature-style labels too: "Canvas Mode" -> canvas, "Agent Designer" -> agent_designer,
    // "Image Generation" -> image (drop the trailing " mode" / " generation", then snake_case).
    const t = String(raw.promptType).toLowerCase().trim()
      .replace(/\s+(mode|generation)$/, '').replace(/[\s-]+/g, '_');
    out.promptType = PROMPT_TYPES.includes(t) ? t : undefined;
  }
  if (raw.features !== undefined) out.features = pickAllowed(raw.features, FEATURES);
  if (raw.connectors !== undefined) out.connectors = pickAllowed(raw.connectors, CONNECTORS);
  LANGS.forEach(l => { if (raw[l]) out[l] = normalizeProfile(raw[l]); });
  return out;
};

module.exports = {
  CATEGORIES, PROMPT_TYPES, FEATURES, CONNECTORS,
  toCurlyVariables, toSnakeId, normalizeCategory, normalizeDraft
};
