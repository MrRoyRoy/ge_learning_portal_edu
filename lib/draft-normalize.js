/**
 * lib/draft-normalize.js
 * Pure helpers that clean a Gemini "Draft / Refine with Gemini" reply so it matches the
 * conventions of the seeded playbooks before it reaches the admin case form:
 *   - prompt variables use {{UPPER_SNAKE}} tokens (legacy [VARIABLE] brackets are converted);
 *   - category / promptType / features / connectors only use values the portal understands;
 *   - ids are snake_case; steps are arrays of trimmed strings with NO {{VARIABLES}} (steps are not substituted).
 * No I/O, no mutation of the input.
 */
'use strict';

const CATEGORIES = Object.freeze(['academic', 'student', 'operational', 'administrative']);
const PROMPT_TYPES = Object.freeze(['general', 'notebooklm', 'deep_research', 'agent_designer', 'canvas', 'image', 'video']);
const FEATURES = Object.freeze(['Agent Designer', 'Gemini Notebook', 'Deep Research', 'Canvas Mode', 'Image Generation', 'Video Generation']);
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

/** Old product names Gemini may still use, mapped to the portal's names (case-insensitive keys). */
const LEGACY_NAMES = Object.freeze({ notebooklm: 'Gemini Notebook' });

/** Rename legacy product names inside free text ("NotebookLM" -> "Gemini Notebook"). Pure. */
const renameLegacyProducts = (text) =>
  typeof text !== 'string' ? text : text.replace(/NotebookLM/gi, LEGACY_NAMES.notebooklm);

/** Keep only allowed names (case-insensitive, legacy names mapped), returned in their canonical spelling. */
const pickAllowed = (list, allowed) =>
  Array.isArray(list)
    ? [...new Set(list.map(x => {
      const key = String(x).toLowerCase().trim();
      const name = LEGACY_NAMES[key] || key;
      return allowed.find(a => a.toLowerCase() === name.toLowerCase());
    }).filter(Boolean))]
    : undefined;

/*
 * Step instructions are shown as-is (only prompts get the "Fill in the variables" substitution), so a
 * {{VARIABLE}} in a step would stay visible as a raw token. plainStepText turns any {{KEY}} / [KEY] token
 * (plus the quotes around it) into plain words in the step's language:
 *   en    {{DEPARTMENT_NAME}} -> "your department",  {{COURSE_CODE}} -> "your course code"
 *   zh-TW 「{{DEPARTMENT_NAME}}」 -> "你的科系"        zh-CN -> "你的院系"
 * A trailing NAME is dropped ("department name" reads as "department"). Words without a Chinese entry
 * stay in lowercase English. This is a fallback; DRAFT_CONVENTIONS asks Gemini not to write them at all.
 */
const STEP_WORDS = Object.freeze({
  DEPARTMENT: ['科系', '院系'], COURSE: ['課程', '课程'], PROGRAM: ['課程', '课程'], PROGRAMME: ['課程', '课程'],
  INSTITUTION: ['院校', '院校'], SCHOOL: ['學校', '学校'], UNIVERSITY: ['大學', '大学'], FACULTY: ['學院', '学院'],
  TOPIC: ['主題', '主题'], RESEARCH: ['研究', '研究'], EVENT: ['活動', '活动'], CLUB: ['學會', '社团'],
  TEAM: ['團隊', '团队'], STUDENT: ['學生', '学生'], ASSIGNMENT: ['作業', '作业'], TYPE: ['類型', '类型'],
  WEEKLY: ['每週', '每周'], CODE: ['代碼', '代码'], TEMPLATE: ['範本', '模板'], FRAMEWORK: ['框架', '框架'],
  SYLLABUS: ['課程大綱', '课程大纲'], POLICY: ['政策', '政策'], BUDGET: ['預算', '预算'], DEADLINE: ['截止日期', '截止日期']
});
// Token = {{KEY}} or legacy [KEY]. Optional English article before it, optional MATCHING quote pair around it
// (「」, “”, "", '') so an apostrophe such as "{{COURSE_NAME}}'s" is kept. Case-sensitive on purpose: only
// ALL-CAPS tokens are variables ("[Note]" stays).
const TOKEN_SRC = String.raw`\{\{\s*[A-Z][A-Z0-9_]*\s*\}\}|\[[A-Z][A-Z0-9_ ]{1,48}[A-Z0-9]\](?!\()`;
const STEP_RE = new RegExp(String.raw`(\b(?:[Tt]he|[Aa]n?)\s+)?(?:「(TOKEN)」|“(TOKEN)”|"(TOKEN)"|'(TOKEN)'|(TOKEN))`.replace(/TOKEN/g, TOKEN_SRC), 'g');
const tokenKey = (token) => token.replace(/^\{\{\s*|\s*\}\}$|^\[|\]$/g, '');

/** Plain-words replacement for one variable key in the given language. Pure. */
const plainVariable = (key, lang) => {
  const words = key.trim().split(/[_\s]+/).filter(Boolean);
  const core = words.length > 1 && words[words.length - 1] === 'NAME' ? words.slice(0, -1) : words;
  if (lang === 'zh-TW' || lang === 'zh-CN') {
    const i = lang === 'zh-TW' ? 0 : 1;
    return `你的${core.map(w => (STEP_WORDS[w] ? STEP_WORDS[w][i] : w.toLowerCase())).join('')}`;
  }
  return `your ${core.join(' ').toLowerCase()}`;
};

/** Replace every variable token in a step with plain words (see above). Non-strings pass through. Pure. */
const plainStepText = (text, lang) =>
  typeof text !== 'string' ? text
    : text.replace(STEP_RE, (whole, article, ...rest) => {
      const token = rest.slice(0, 5).find(Boolean);
      const offset = rest[5];
      const words = plainVariable(tokenKey(token), lang);
      // English sentence start ("The {{X}} …" or "{{X}} …" after ". ") keeps a capital: "Your x"
      const atStart = /^[A-Z]/.test(article || '') || (!article && /(^|[.!?]\s+)$/.test(text.slice(0, offset)));
      return atStart && /^[a-z]/.test(words) ? words.charAt(0).toUpperCase() + words.slice(1) : words;
    });

/** Clean a steps array for one language: trimmed, non-empty strings without variable tokens. */
const plainSteps = (steps, lang) =>
  Array.isArray(steps) ? steps.map(s => renameLegacyProducts(plainStepText(String(s).trim(), lang))).filter(Boolean) : steps;

/**
 * Apply plainSteps to a playbook's English `steps` column and every translation's steps.
 * @returns {{steps, translations}} new values (input untouched)
 */
const plainStepsForCase = ({ steps, translations }) => ({
  steps: plainSteps(steps, 'en'),
  translations: translations && typeof translations === 'object' && !Array.isArray(translations)
    ? Object.fromEntries(Object.entries(translations).map(([l, t]) =>
      [l, t && typeof t === 'object' && Array.isArray(t.steps) ? { ...t, steps: plainSteps(t.steps, l) } : t]))
    : translations
});

/** Clean one language profile: tokens in every text field, steps as plain non-empty strings (no variables). */
const normalizeProfile = (p, lang = 'en') => {
  if (!p || typeof p !== 'object') return p;
  const clean = (t) => renameLegacyProducts(toCurlyVariables(t));
  return {
    ...p,
    title: typeof p.title === 'string' ? renameLegacyProducts(p.title.trim()) : p.title,
    summary: clean(p.summary),
    steps: plainSteps(p.steps, lang),
    prompt: clean(p.prompt),
    proTip: clean(p.proTip)
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

/** The closing Canvas sentence for document-creating Set up prompts, per language. */
const CANVAS_SENTENCE = Object.freeze({
  en: 'Use Canvas to create this as an editable document.',
  'zh-TW': '請使用 Canvas 將此內容建立為可編輯文件。',
  'zh-CN': '请使用 Canvas 将此内容创建为可编辑文档。'
});
const EN_CANVAS_RE = /\s*Use Canvas to create this as an editable document\.?\s*$/i;
/** Canvas helpers must end with the Canvas sentence in their own language. Gemini sometimes leaves the
 * English sentence on zh prompts, so: strip any trailing English sentence on zh, then append the
 * localised one unless it is already there. Non-canvas prompts are returned unchanged. Pure. */
const ensureCanvasSentence = (prompt, type, lang) => {
  if (type !== 'canvas') return prompt;
  const sentence = CANVAS_SENTENCE[lang] || CANVAS_SENTENCE.en;
  const base = lang === 'en' ? prompt : prompt.replace(EN_CANVAS_RE, '');
  return base.includes(sentence) ? base : `${base.trimEnd()}${lang === 'en' ? ' ' : ''}${sentence}`;
};

/** Clean drafted Set up prompts: per language, at most 5 entries with a prompt, {{VAR}} tokens, valid type. */
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
          title: renameLegacyProducts(String(e.title || '').trim()),
          prompt: ensureCanvasSentence(renameLegacyProducts(toCurlyVariables(String(e.prompt).trim())), type, l)
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
  LANGS.forEach(l => { if (raw[l]) out[l] = normalizeProfile(raw[l], l); });
  return out;
};

module.exports = {
  CATEGORIES, PROMPT_TYPES, FEATURES, CONNECTORS,
  CANVAS_SENTENCE, LEGACY_NAMES, renameLegacyProducts, toCurlyVariables, toSnakeId, normalizeCategory, normalizePromptType,
  ensureCanvasSentence, normalizeHelperPrompts, normalizeDraft,
  plainStepText, plainSteps, plainStepsForCase
};
