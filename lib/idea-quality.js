/**
 * Idea quality: shared, side-effect-free checks for feedback / use case ideas.
 *
 * Two levels:
 *   1. assessFeedback(text)  - the submit gate (client + POST /api/feedbacks). Rejects text that is
 *      too short to act on, or that only says generic things ("great, thanks!", "test", "很好用").
 *      Deliberately lenient: real bug reports like "Search is slow on mobile" must pass.
 *   2. assessIdea(text)      - the stricter "can we build a playbook from this?" check used at
 *      conversion time when Gemini is unavailable. Returns which facts are missing
 *      (audience / task / output) so the admin can ask the author.
 *
 * Length is measured in "effective words" so Chinese (no spaces) and English get comparable limits:
 *   effectiveWords = Latin/number words + ceil(CJK characters / 2)   (≈ 2 CJK characters per word)
 *
 * Loaded two ways:
 *   - Node (server.js):     const IdeaQuality = require('./lib/idea-quality');
 *   - Browser (index.html): <script src="lib/idea-quality.js"> → window.IdeaQuality
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IdeaQuality = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Submit gate limits. */
  const MIN_EFFECTIVE_WORDS = 4;
  const MIN_MEANINGFUL_TOKENS = 2;
  const MAX_LENGTH = 4000;

  /** Conversion check: fewer effective words than this is never enough to draft a playbook. */
  const MIN_IDEA_WORDS = 8;

  /** Function words that carry no meaning on their own. */
  const STOP = new Set(('the and for with that this from into your you our are was were can will would should could ' +
    'have has had not but all any use using used make makes help want need just also more some them they their ' +
    'there what when where which who how about please maybe very much each other than then its get got been being ' +
    'is it in on of to a an be do does did so if or as at by we me my i us one thing things stuff really').split(/\s+/));

  /** Words that only express sentiment, thanks or testing. A text made only of these is "vague". */
  const GENERIC = new Set(('good great nice cool awesome amazing excellent perfect fantastic wonderful brilliant super ' +
    'love loved like liked thanks thank thx ty cheers ok okay fine well done job work works working wow yay ' +
    'bad poor terrible awful hate useless useful helpful easy hard better best worse worst ' +
    'test testing tested hello hi hey asdf qwerty lol haha hmm yes no nope yeah portal app website site page ' +
    'feedback idea ideas suggestion suggestions comment comments improve improvement improvements everything nothing something').split(/\s+/));

  /** Chinese phrases with the same role as GENERIC (zh-TW + zh-CN), plus pronouns that say nothing alone. */
  const GENERIC_CJK = ['很好', '好用', '不錯', '不错', '謝謝', '谢谢', '感謝', '感谢', '多謝', '多谢', '非常', '喜歡', '喜欢',
    '測試', '测试', '你好', '讚好', '赞好', '一般', '還好', '还好', '好的', '可以', '方便', '有用', '實用', '实用', '改善', '改進',
    '改进', '建議', '建议', '意見', '意见', '網站', '网站', '平台', '系統', '系统', '很棒', '太棒', '不好', '難用', '难用',
    '你們', '你们', '我們', '我们', '大家', '希望', '覺得', '觉得', '真的', '好好', '很', '好', '讚', '赞', '棒', '謝', '谢'];
  /** Single-character particles that end or join phrases ("的", "了", "嗎"...). */
  const CJK_PARTICLES = /[的了啊呀吧嗎吗呢喔哦啦嘛也都很]/g;

  const CJK_RUN = /[\u3400-\u9fff\uf900-\ufaff]+/g;

  /** Overlapping 2-character bigrams of a CJK run ("評分標準" -> 評分, 分標, 標準). */
  const bigramsOf = (r) => (r.length === 1 ? [r] : Array.from({ length: r.length - 1 }, (_, i) => r.slice(i, i + 2)));

  /*
   * Text -> { latinWords:[lowercase], cjkChars:n, bigrams:[..] }. Pure.
   * `bigrams` come from the CJK text with generic phrases and particles cut out first (longest phrases
   * first), so "非常好用，謝謝你們" leaves nothing, rather than artefacts like "常好" / "謝你" that a plain
   * bigram split would count as meaningful.
   */
  const analyse = (text) => {
    const s = String(text || '').toLowerCase();
    const latinWords = s.match(/[a-z0-9][a-z0-9'’-]*/g) || [];
    const runs = s.match(CJK_RUN) || [];
    const cjkChars = runs.reduce((n, r) => n + r.length, 0);
    const byLength = [...GENERIC_CJK].sort((x, y) => y.length - x.length);
    const content = runs
      .map(r => byLength.reduce((acc, g) => acc.split(g).join(' '), r).replace(CJK_PARTICLES, ' '))
      .flatMap(r => r.split(/\s+/))
      .filter(r => r.length >= 2);
    const bigrams = content.flatMap(bigramsOf);
    return { latinWords, cjkChars, bigrams };
  };

  /** Latin words + ≈ CJK words. */
  const effectiveWords = (a) => a.latinWords.length + Math.ceil(a.cjkChars / 2);

  /** Words / bigrams that say something specific (not a stop word, not generic praise, not a lone number). */
  const meaningfulTokens = (a) => [
    ...a.latinWords.map(w => w.replace(/['’-]/g, '')).filter(w => w.length >= 3 && !/^\d+$/.test(w) && !STOP.has(w) && !GENERIC.has(w)),
    ...a.bigrams
  ];

  /** "aaaaaaa", "!!!!!!", "hahahaha": the same 1-2 characters make up most of the text. */
  const isRepetitive = (text) => {
    const compact = String(text || '').replace(/\s+/g, '');
    if (compact.length < 6) return false;
    return /(.{1,2})\1{4,}/u.test(compact) && new Set(compact).size <= 3;
  };

  /**
   * Submit gate. Returns { ok, code, words, meaningful } where code is
   *   null | 'empty' | 'too_long' | 'too_short' | 'too_vague'.
   */
  const assessFeedback = (text) => {
    const raw = String(text || '').trim();
    if (!raw) return { ok: false, code: 'empty', words: 0, meaningful: 0 };
    if (raw.length > MAX_LENGTH) return { ok: false, code: 'too_long', words: 0, meaningful: 0 };
    const a = analyse(raw);
    const words = effectiveWords(a);
    const meaningful = new Set(meaningfulTokens(a)).size;
    if (words < MIN_EFFECTIVE_WORDS) return { ok: false, code: 'too_short', words, meaningful };
    if (meaningful < MIN_MEANINGFUL_TOKENS || isRepetitive(raw)) return { ok: false, code: 'too_vague', words, meaningful };
    return { ok: true, code: null, words, meaningful };
  };

  /*
   * Keyword cues for the three facts a playbook needs. Matching is a cheap heuristic (only used when
   * Gemini can't judge): it errs towards "present" so we don't nag about ideas that are fine.
   */
  const CUES = {
    audience: /\b(teach|teacher|lecturer|professor|tutor|tas?\b|staff|student|parent|dean|leader|admin|administrator|officer|advisor|adviser|finance|security|it (?:team|admin|staff)|class|cohort|department|faculty|counsel)/i,
    audienceCjk: /(老師|老师|教師|教师|講師|讲师|教授|助教|學生|学生|家長|家长|職員|职员|同事|院長|院长|主任|部門|部门|學系|学系|班|財務|财务|保安|安保|輔導|辅导)/,
    output: /\b(email|letter|report|summary|summar|quiz|test|exam|rubric|plan|lesson|slide|deck|presentation|newsletter|checklist|table|list|draft|feedback|agent|workflow|form|template|schedule|timetable|policy|guide|faq|script|poster|image|video|notice|memo|minutes|proposal|analysis|dashboard)/i,
    outputCjk: /(電郵|电邮|郵件|邮件|信|報告|报告|報表|报表|摘要|總結|总结|測驗|测验|考試|考试|評分|评分|計劃|计划|教案|簡報|简报|通訊|通讯|清單|清单|表格|草稿|範本|范本|模板|時間表|时间表|政策|指南|海報|海报|圖片|图片|影片|视频|通告|會議記錄|会议记录|建議書|建议书|分析)/,
    task: /\b(create|write|draft|generate|summari[sz]e|grade|mark|plan|prepare|analy[sz]e|translate|review|check|track|schedule|answer|explain|design|build|turn|convert|organi[sz]e|compare|find|research|reply|automate|remind)/i,
    taskCjk: /(製作|制作|撰寫|撰写|寫|写|生成|總結|总结|評分|评分|批改|規劃|规划|準備|准备|分析|翻譯|翻译|審閱|审阅|檢查|检查|追蹤|追踪|安排|回答|解釋|解释|設計|设计|整理|比較|比较|研究|回覆|回复|自動|自动|提醒|轉換|转换)/
  };

  /**
   * Stricter conversion check (fallback when Gemini can't assess). Returns
   *   { actionable, missing:['audience'|'task'|'output'], words }
   * A text is actionable when it passes the submit gate, has MIN_IDEA_WORDS, and names at least
   * two of the three facts. `missing` lists the facts the client turns into clarification questions.
   */
  const assessIdea = (text) => {
    const gate = assessFeedback(text);
    const s = String(text || '');
    const missing = ['audience', 'task', 'output'].filter(k => !(CUES[k].test(s) || CUES[`${k}Cjk`].test(s)));
    const actionable = gate.ok && gate.words >= MIN_IDEA_WORDS && missing.length <= 1;
    return { actionable, missing: actionable ? missing : (missing.length ? missing : ['task', 'output']), words: gate.words };
  };

  return Object.freeze({
    MIN_EFFECTIVE_WORDS, MIN_MEANINGFUL_TOKENS, MIN_IDEA_WORDS, MAX_LENGTH,
    analyse, effectiveWords, meaningfulTokens, isRepetitive, assessFeedback, assessIdea
  });
});
