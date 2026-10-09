(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const { t } = window.UDA_I18N;
  const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const text = key => escape(t(key));
  const arrow = '<svg aria-hidden="true"><use href="#arrow"/></svg>';
  const menu = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function menuLabel() { menu.setAttribute('aria-label', t(menu.getAttribute('aria-expanded') === 'true' ? 'ui.menuClose' : 'ui.menuOpen')); }
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menuLabel();
    mobileNav.hidden = true;
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menuLabel();
    mobileNav.hidden = !open;
  });
  menuLabel();
  $$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width:1101px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  $$('.faq-list details').forEach(details => details.addEventListener('toggle', () => {
    if (details.open) $$('.faq-list details').forEach(other => { if (other !== details) other.open = false; });
  }));
  $('#year').textContent = String(new Date().getFullYear());

  const contact = window.UDA_CONTACT || {};
  const contactLinks = [];
  if (contact.phone && /^\+?[\d ()-]{7,25}$/.test(contact.phone)) contactLinks.push({ href: 'tel:' + contact.phone.replace(/[^+\d]/g, ''), text: contact.phone });
  if (contact.telegram && /^https:\/\/t\.me\/[A-Za-z0-9_]+$/.test(contact.telegram)) contactLinks.push({ href: contact.telegram, key: 'ui.telegram' });
  function renderContact() {
    if (!contactLinks.length && !contact.address) return;
    const target = $('#contact-info');
    target.replaceChildren();
    contactLinks.forEach(item => {
      const link = document.createElement('a'); link.href = item.href; link.textContent = item.key ? t(item.key) : item.text;
      if (item.href.startsWith('https:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      target.append(link);
    });
    if (contact.address) { const address = document.createElement('span'); address.className = 'contact-address'; address.textContent = contact.address; target.append(address); }
  }
  renderContact();

  const dialog = $('#guide-dialog');
  const content = $('#quiz-content');
  const next = $('.quiz-next');
  const back = $('.quiz-back');
  const error = $('#quiz-error');
  const steps = [
    { name: 'experience', options: ['new', 'some', 'experienced'] },
    { name: 'goal', options: ['beginner', 'practice', 'international'] },
    { name: 'category', options: ['A', 'B', 'C', 'D', 'BE', 'DE', 'CE', 'undecided'] },
    { name: 'language', options: ['uz', 'ru', 'en'] },
    { name: 'time', options: ['weekday', 'weekend', 'flexible'] }
  ];
  $('.quiz-progress').innerHTML = steps.map(() => '<span></span>').join('');
  let state = { step: 0, answers: {}, opener: null, resultText: '', result: false };
  function headingFocus() {
    requestAnimationFrame(() => {
      dialog.scrollTop = 0;
      const heading = $('#guide-title');
      if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
    });
  }
  function showStep() {
    state.result = false;
    const item = steps[state.step];
    const prefix = 'q.' + item.name;
    error.textContent = '';
    content.innerHTML = '<h2 id="guide-title">' + text(prefix + '.title') + '</h2><p>' + text(prefix + '.subtitle') + '</p><fieldset class="quiz-options' + (item.name === 'category' ? ' category-options' : '') + '" aria-labelledby="guide-title">' + item.options.map(value => '<label class="quiz-option"><input type="radio" name="' + item.name + '" value="' + value + '" ' + (state.answers[item.name] === value ? 'checked' : '') + '><span><strong>' + text(prefix + '.' + value + '.title') + '</strong><small>' + text(prefix + '.' + value + '.caption') + '</small></span></label>').join('') + '</fieldset>';
    $('.quiz-actions').hidden = false;
    back.disabled = state.step === 0;
    back.textContent = t('ui.back');
    next.innerHTML = text(state.step === steps.length - 1 ? 'ui.result' : 'ui.next') + ' ' + arrow;
    $$('.quiz-progress span').forEach((bar, index) => bar.classList.toggle('complete', index <= state.step));
    $$('input', content).forEach(input => input.addEventListener('change', () => { state.answers[item.name] = input.value; error.textContent = ''; }));
    headingFocus();
  }
  function openQuiz(opener) {
    state = { step: 0, answers: {}, opener, resultText: '', result: false };
    const preset = opener.dataset.preset;
    if (steps[1].options.includes(preset)) state.answers.goal = preset;
    if (steps[2].options.includes(opener.dataset.category)) state.answers.category = opener.dataset.category;
    if (preset === 'beginner') state.answers.experience = 'new';
    if (preset === 'practice') state.answers.experience = 'some';
    closeMenu();
    document.body.classList.add('dialog-open');
    dialog.showModal();
    showStep();
  }
  $$('[data-open-quiz]').forEach(button => button.addEventListener('click', () => openQuiz(button)));
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    $('.toast').classList.remove('visible');
    $('.toast').textContent = '';
    if (state.opener && mobileNav.contains(state.opener) && mobileNav.hidden) menu.focus();
    else state.opener?.focus();
  });
  next.addEventListener('click', () => {
    const item = steps[state.step];
    if (!item.options.includes(state.answers[item.name])) { error.textContent = t('ui.chooseOne'); $('input', content)?.focus(); return; }
    if (state.step < steps.length - 1) { state.step++; showStep(); } else showResult();
  });
  back.addEventListener('click', () => { if (state.step > 0) { state.step--; showStep(); } });

  function showResult() {
    state.result = true;
    let key = state.answers.goal;
    if (key === 'practice' && state.answers.experience === 'new') key = 'beginner';
    const route = 'route.' + key;
    const preferences = ['category', 'language', 'time'].map(name => ({ label: t('result.' + name), value: t('q.' + name + '.' + state.answers[name] + '.title') }));
    const questions = [1, 2, 3].map(number => t(route + '.q' + number));
    state.resultText = 'UNIVERSAL DRIVING ACADEMY\n' + t('result.title') + '\n\n' + t('result.direction') + ': ' + t(route + '.title') + '\n' + t(route + '.body') + '\n\n' + preferences.map(item => item.label + ': ' + item.value).join('\n') + '\n' + t('result.scheduleNote') + '\n' + t('result.instructorPolicy') + '\n\n' + t('result.questions') + '\n' + questions.map((question, index) => (index + 1) + '. ' + question).join('\n') + '\n\n' + t('result.fullDisclaimer') + '\n';
    content.innerHTML = '<div class="quiz-result-tag"><svg aria-hidden="true"><use href="#check"/></svg> ' + text('result.tag') + '</div><h2 id="guide-title">' + text(route + '.title') + '</h2><p>' + text(route + '.body') + '</p><dl class="result-preferences">' + preferences.map(item => '<div><dt>' + escape(item.label) + '</dt><dd>' + escape(item.value) + '</dd></div>').join('') + '</dl><p class="result-note">' + text('result.scheduleNote') + '</p><p class="result-note">' + text('result.instructorPolicy') + '</p><div class="result-checklist"><p>' + text('result.beforeEnroll') + '</p><ul>' + questions.map(question => '<li>' + escape(question) + '</li>').join('') + '</ul></div><div class="result-actions"><button class="button" id="download-plan">' + text('ui.save') + ' ' + arrow + '</button><button class="text-link" id="copy-plan">' + text('ui.copy') + '</button></div><p class="result-note">' + text('result.disclaimer') + '</p><button class="quiz-restart" id="restart-quiz">' + text('ui.restart') + '</button>';
    $('.quiz-actions').hidden = true;
    error.textContent = '';
    if (contactLinks.length) {
      const link = document.createElement('a'); link.className = 'button'; link.href = contactLinks[0].href; link.textContent = t('ui.contact'); $('.result-actions').prepend(link);
    }
    $('#download-plan').addEventListener('click', () => {
      const blob = new Blob(['\uFEFF' + state.resultText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'UDA-plan-' + window.UDA_I18N.language + '.txt'; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); notify(t('ui.saved'));
    });
    $('#copy-plan').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(state.resultText); notify(t('ui.copied')); }
      catch { notify(t('ui.copyFailed')); }
    });
    $('#restart-quiz').addEventListener('click', () => { state.step = 0; state.answers = {}; showStep(); });
    headingFocus();
  }
  document.addEventListener('uda:languagechange', () => {
    menuLabel();
    renderContact();
    $('.toast').textContent = '';
    if (dialog.open) { if (state.result) showResult(); else showStep(); }
  });
  let toastTimer;
  function notify(message) {
    const toast = $('.toast'); toast.textContent = message; toast.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }
})();

