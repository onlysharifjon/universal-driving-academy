(() => {
  'use strict';
  const supported = ['uz', 'ru', 'en'];
  const messages = window.UDA_MESSAGES;
  for (const lang of supported) Object.assign(messages[lang], window.UDA_QUIZ_MESSAGES[lang]);
  let language = 'uz';
  try {
    const saved = localStorage.getItem('uda-language');
    if (supported.includes(saved)) language = saved;
  } catch { /* The site also works when browser storage is unavailable. */ }
  const requested = new URLSearchParams(window.location.search).get('lang');
  if (supported.includes(requested)) language = requested;
  const t = key => messages[language][key] ?? messages.uz[key] ?? key;
  function applyLanguage(next, persist = true) {
    if (!supported.includes(next)) return;
    language = next;
    document.documentElement.lang = language;
    document.title = t('meta.title');
    document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    // HTML translations are fixed local copy; visitor input never enters this path.
    document.querySelectorAll('[data-i18n-html]').forEach(node => { node.innerHTML = t(node.dataset.i18nHtml); });
    for (const attr of ['aria-label', 'title', 'alt', 'content']) {
      document.querySelectorAll(`[data-i18n-${attr}]`).forEach(node => {
        node.setAttribute(attr, t(node.getAttribute(`data-i18n-${attr}`)));
      });
    }
    document.getElementById('site-language').value = language;
    if (persist) { try { localStorage.setItem('uda-language', language); } catch { /* Optional preference. */ } }
    document.dispatchEvent(new CustomEvent('uda:languagechange', { detail: { language } }));
  }
  window.UDA_I18N = { t, setLanguage: applyLanguage, get language() { return language; } };
  document.getElementById('site-language').addEventListener('change', event => applyLanguage(event.target.value));
  applyLanguage(language, false);
})();
