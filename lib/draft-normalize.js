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

/** Map a loose prompt-type label onto a stored value ("Canvas Mode" -> canvas); unknown -> undefined. */
const normalizePromptType = (raw) => {
  // Accept feature-style labels too: "Canvas Mode" -> canvas, "Agent Designer" -> agent_designer,
  // "Image Generation" -> image (drop the trailing " mode" / " generation", then snake_case).
  const t = String(raw).toLowerCase().trim()
    .replace(/\s+(mode|generation)$/, '').replace(/[\s-]+/g, '_');
  return PROMPT_TYPES.includes(t) ? t : undefined;
};

/** Clean drafted Set up prompts: per language, at most 5 entries with a prompt, {{VAR}} tokens, valid type. */
/** The closing Canvas sentence for document-creating Set up prompts, per language. */
const CANVAS_SENTENCE = Object.freeze({
  en: 'Use Canvas to create this as an editable document.',
  'zh-TW': '請使用 Canvas 將此內容建立為可編輯文件。',
  'zh-CN': '请使用 Canvas 将此内容创建为可编辑文档。'
});
const EN_CANVAS_RE = /\s*Use Canvas to create this as an editable document\.?\s*$/i;

/**
 * Canvas helpers must end with the Canvas sentence in their own language. Gemini sometimes leaves the
 * English sentence on zh prompts, so: strip any trailing English sentence on zh, then append the
 * localised one unless it is already there. Non-canvas prompts are returned unchanged. Pure.
 */
const ensureCanvasSentence = (prompt, type, lang) => {
  if (type !== 'canvas') return prompt;
  const sentence = CANVAS_SENTENCE[lang] || CANVAS_SENTENCE.en;
  const base = lang === 'en' ? prompt : prompt.replace(EN_CANVAS_RE, '');
  return base.includes(sentence) ? base : `${base.trimEnd()}${lang === 'en' ? ' ' : ''}${sentence}`;
};

const normalizeHelperPrompts = (hp) => {
  if (!hp || typeof hp !== 'object' || Array.isArray(hp)) return undefined;
  return Object.fromEntries(LANGS.filter(l => Array.isArray(hp[l])).map(l => [l,
    hp[l]
      .filter(e => e && typeof e === 'object' && String(e.prompt || '').trim())
      .slice(0, 5)
      .map(e => {
        const type = normalizePromptType(e.type || 'general') || 'general';
        return {
          type,
          title: String(e.title || '').trim(),
          prompt: ensureCanvasSentence(toCurlyVariables(String(e.prompt).trim()), type, l)
        };
      })
  ]));
};

/** Normalise a whole draft reply. Unknown enum values are dropped so the form keeps its current value. */
const normalizeDraft = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const out = { ...raw };
  if (raw.id !== undefined) out.id = toSnakeId(raw.id);
  if (raw.category !== undefined) out.category = normalizeCategory(raw.category);
  if (raw.promptType !== undefined) out.promptType = normalizePromptType(raw.promptType);
  if (raw.features !== undefined) out.features = pickAllowed(raw.features, FEATURES);
  if (raw.connectors !== undefined) out.connectors = pickAllowed(raw.connectors, CONNECTORS);
  if (raw.helperPrompts !== undefined) out.helperPrompts = normalizeHelperPrompts(raw.helperPrompts);
  LANGS.forEach(l => { if (raw[l]) out[l] = normalizeProfile(raw[l]); });
  return out;
};

module.exports = {
  CATEGORIES, PROMPT_TYPES, FEATURES, CONNECTORS,
  CANVAS_SENTENCE, toCurlyVariables, toSnakeId, normalizeCategory, normalizePromptType, ensureCanvasSentence, normalizeHelperPrompts, normalizeDraft
};
