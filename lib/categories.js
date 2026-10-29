/**
 * Category core: shared, side-effect-free audience logic.
 *
 * A playbook targets one or more of the 8 user categories below. A user account
 * gets one or more categories from the admin. A user sees a playbook when the
 * two lists share at least one category. A user with no categories sees nothing.
 *
 * Loaded two ways:
 *   - Node (server.js):     const CategoryCore = require('./lib/categories');
 *   - Browser (index.html): <script src="lib/categories.js"> → window.CategoryCore
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CategoryCore = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Ordered category catalogue. `roles` are the legacy profile roles that a category groups. */
  const CATEGORIES = Object.freeze([
    { id: 'teaching', roles: ['Lecturer', 'TA'], icon: 'school',
      label: { en: 'Teaching', 'zh-TW': '教學', 'zh-CN': '教学' } },
    { id: 'research', roles: ['Researcher'], icon: 'biotech',
      label: { en: 'Research', 'zh-TW': '學術研究', 'zh-CN': '学术研究' } },
    { id: 'leadership', roles: ['Program Leader', 'Dean'], icon: 'account_balance',
      label: { en: 'Programme & Faculty Leadership', 'zh-TW': '課程及學院領導', 'zh-CN': '课程及学院领导' } },
    { id: 'student_affairs', roles: ['SAO'], icon: 'diversity_3',
      label: { en: 'Student Affairs', 'zh-TW': '學生事務', 'zh-CN': '学生事务' } },
    { id: 'finance', roles: ['Finance'], icon: 'payments',
      label: { en: 'Finance', 'zh-TW': '財務', 'zh-CN': '财务' } },
    { id: 'security', roles: ['Security'], icon: 'shield',
      label: { en: 'Campus Security', 'zh-TW': '校園保安', 'zh-CN': '校园安保' } },
    { id: 'it_admin', roles: ['IT Admin'], icon: 'dns',
      label: { en: 'IT Administration', 'zh-TW': '資訊科技管理', 'zh-CN': '信息技术管理' } },
    { id: 'students', roles: ['Student'], icon: 'backpack',
      label: { en: 'Students', 'zh-TW': '學生', 'zh-CN': '学生' } }
  ].map(c => Object.freeze(c)));

  const CATEGORY_IDS = Object.freeze(CATEGORIES.map(c => c.id));

  /** Legacy single-value categories (pre-v7 `use_cases.category`) mapped to the new ids. */
  const LEGACY_CATEGORY_MAP = Object.freeze({
    academic: ['teaching'], student: ['students'],
    operational: ['it_admin'], administrative: ['leadership']
  });

  const byId = (id) => CATEGORIES.find(c => c.id === id) || null;

  /** "Lecturer" -> "teaching"; unknown role -> null. */
  const categoryForRole = (role) => {
    const hit = CATEGORIES.find(c => c.roles.includes(role));
    return hit ? hit.id : null;
  };

  /** ["teaching","finance"] -> ["Lecturer","TA","Finance"] (catalogue order, unique). */
  const rolesForCategories = (ids) =>
    CATEGORIES.filter(c => (ids || []).includes(c.id)).flatMap(c => c.roles);

  /**
   * Accepts an array, a JSON string, a comma-separated string or null and
   * returns a unique, catalogue-ordered list of valid ids. Legacy values
   * ("academic") and role names ("Lecturer") are mapped too.
   */
  const normalizeCategories = (input) => {
    let list = input;
    if (typeof list === 'string') {
      const s = list.trim();
      try { list = s.startsWith('[') ? JSON.parse(s) : s.split(','); } catch (_) { list = s.split(','); }
    }
    if (!Array.isArray(list)) return [];
    const wanted = new Set(list.flatMap(v => {
      const raw = String(v == null ? '' : v).trim();
      const key = raw.toLowerCase();
      if (CATEGORY_IDS.includes(key)) return [key];
      if (LEGACY_CATEGORY_MAP[key]) return LEGACY_CATEGORY_MAP[key];
      const fromRole = categoryForRole(raw);
      return fromRole ? [fromRole] : [];
    }));
    return CATEGORY_IDS.filter(id => wanted.has(id));
  };

  /** True when the playbook's and the user's categories intersect. Empty user list -> false. */
  const isVisibleTo = (caseCats, userCats) => {
    const u = normalizeCategories(userCats);
    return u.length > 0 && normalizeCategories(caseCats).some(id => u.includes(id));
  };

  /** Localised label; falls back to English, then the raw id. */
  const categoryLabel = (id, lang) => {
    const c = byId(id);
    return c ? (c.label[lang] || c.label.en) : String(id || '');
  };

  return {
    CATEGORIES, CATEGORY_IDS, LEGACY_CATEGORY_MAP,
    byId, categoryForRole, rolesForCategories, normalizeCategories, isVisibleTo, categoryLabel
  };
});
