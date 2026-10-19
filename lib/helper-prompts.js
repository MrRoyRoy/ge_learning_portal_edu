/**
 * lib/helper-prompts.js
 * Pure helpers for a playbook's "Set up" helper prompts, stored in use_cases.helper_prompts as JSON:
 *   { "en": [{ type, title, prompt }], "zh-TW": [...], "zh-CN": [...] }
 * Entries line up by index across languages (entry 0 in en is entry 0 in zh-TW / zh-CN).
 * NULL in the column means "never set" (the client then falls back to its static seed list);
 * '{}' or empty arrays mean "no helper prompts".
 * No I/O, no mutation of the input.
 */
'use strict';

const HELPER_LANGS = Object.freeze(['en', 'zh-TW', 'zh-CN']);
const HELPER_TYPES = Object.freeze(['general', 'notebooklm', 'deep_research', 'agent_designer', 'canvas', 'image', 'video']);
const MAX_HELPERS = 5;
const MAX_TITLE = 200;
const MAX_PROMPT = 8000;

/** Clean one entry; returns null when it has no prompt text (blank rows from the form are dropped). */
const cleanEntry = (e) => {
  if (!e || typeof e !== 'object') return null;
  const prompt = String(e.prompt || '').trim();
  if (!prompt) return null;
  const type = HELPER_TYPES.includes(e.type) ? e.type : 'general';
  return { type, title: String(e.title || '').trim(), prompt };
};

/**
 * Validate admin / import input. Returns { ok, value, message }.
 * value === undefined when the field was omitted (callers keep the stored value);
 * value === null when explicitly null (stored as NULL).
 */
const validateHelperPrompts = (input) => {
  if (input === undefined) return { ok: true, value: undefined };
  if (input === null) return { ok: true, value: null };
  if (typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, message: 'helperPrompts must be an object keyed by language (en, zh-TW, zh-CN).' };
  }
  const value = {};
  for (const lang of HELPER_LANGS) {
    const list = input[lang];
    if (list === undefined || list === null) continue;
    if (!Array.isArray(list)) return { ok: false, message: `helperPrompts.${lang} must be an array.` };
    const cleaned = list.map(cleanEntry).filter(Boolean);
    if (cleaned.length > MAX_HELPERS) return { ok: false, message: `Up to ${MAX_HELPERS} Set up prompts per language.` };
    const tooLong = cleaned.find(h => h.title.length > MAX_TITLE || h.prompt.length > MAX_PROMPT);
    if (tooLong) return { ok: false, message: `Set up prompt titles are limited to ${MAX_TITLE} characters and prompts to ${MAX_PROMPT}.` };
    if (cleaned.length) value[lang] = cleaned;
  }
  return { ok: true, value };
};

/** Parse the stored column. Returns the object, or null when unset / unreadable. */
const parseHelperPrompts = (text) => {
  if (text === null || text === undefined || text === '') return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch (_) {
    return null;
  }
};

module.exports = { HELPER_LANGS, HELPER_TYPES, MAX_HELPERS, validateHelperPrompts, parseHelperPrompts };
