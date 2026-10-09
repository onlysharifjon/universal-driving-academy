(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const menu = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Menyuni ochish');
    mobileNav.hidden = true;
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Menyuni yopish' : 'Menyuni ochish');
    mobileNav.hidden = !open;
  });
  $$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  window.matchMedia('(min-width:801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  $$('.faq-list details').forEach(details => details.addEventListener('toggle', () => {
    if (details.open) $$('.faq-list details').forEach(other => { if (other !== details) other.open = false; });
  }));
  $('#year').textContent = String(new Date().getFullYear());

  const contact = window.UDA_CONTACT || {};
  let contactLinks = [];
  if (contact.phone && /^\+?[\d ()-]{7,25}$/.test(contact.phone)) contactLinks.push({ href: 'tel:' + contact.phone.replace(/[^+\d]/g, ''), text: contact.phone });
  if (contact.telegram && /^https:\/\/t\.me\/[A-Za-z0-9_]+$/.test(contact.telegram)) contactLinks.push({ href: contact.telegram, text: 'Telegram orqali bog‘lanish' });
  if (contactLinks.length || contact.address) {
    const target = $('#contact-info');
    target.replaceChildren();
    contactLinks.forEach(item => {
      const link = document.createElement('a'); link.href = item.href; link.textContent = item.text;
      if (item.href.startsWith('https:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      target.append(link);
    });
    if (contact.address) { const address = document.createElement('span'); address.className = 'contact-address'; address.textContent = contact.address; target.append(address); }
  }

  const dialog = $('#guide-dialog');
  const content = $('#quiz-content');
  const next = $('.quiz-next');
  const back = $('.quiz-back');
  const error = $('#quiz-error');
  const steps = [
    { title: 'Tajribangiz qanday?', subtitle: 'Sizga mos boshlanishni aniqlash uchun 3 ta qisqa savol.', name: 'experience', options: [
      ['new', 'Endi boshlayapman', 'Hali haydash tajribam yo‘q.'],
      ['some', 'Bir oz tajribam bor', 'Asosiy ko‘nikmalarimni mustahkamlamoqchiman.'],
      ['experienced', 'Haydashni bilaman', 'Yangi maqsad uchun tayyorlanmoqchiman.']
    ]},
    { title: 'Asosiy maqsadingiz nima?', subtitle: 'Hozir siz uchun eng muhim bo‘lgan yo‘nalishni tanlang.', name: 'goal', options: [
      ['beginner', 'Haydashni o‘rganish', 'Nazariyadan boshlab amaliyotga o‘tish.'],
      ['practice', 'Ishonchimni oshirish', 'Rul ortida erkinroq his qilish.'],
      ['international', 'Xorijda haydashga tayyorlanish', 'Xalqaro yo‘nalish bo‘yicha savollarim bor.']
    ]},
    { title: 'Qaysi payt sizga qulay?', subtitle: 'Tavsiyangizga vaqt bo‘yicha istagingizni ham qo‘shamiz.', name: 'time', options: [
      ['weekday', 'Ish kunlari', 'Hafta davomida vaqt ajrata olaman.'],
      ['weekend', 'Dam olish kunlari', 'Hafta oxiri men uchun qulayroq.'],
      ['flexible', 'Hali aniqlashtirmadim', 'Mavjud jadval bilan tanishmoqchiman.']
    ]}
  ];
  const routes = {
    beginner: { title: 'Ilk qadamlar.', body: 'Siz uchun yo‘l qoidalarini tushunish va avtomobil boshqaruvining asosiy ko‘nikmalaridan boshlash foydali.', checklist: ['Boshlang‘ich dasturga nimalar kiradi?', 'Nazariya va amaliyot qanday taqsimlanadi?', 'Qabul shartlari va o‘qish narxi qanday?'] },
    practice: { title: 'Ko‘proq ishonch.', body: 'Asosiy ko‘nikmalaringizni mustahkamlashga e’tibor qarating. Sizga qiyin bo‘lgan vaziyatlarni oldindan belgilab oling.', checklist: ['Amaliy tayyorgarlik qanday tashkil etiladi?', 'Menga qiyin bo‘lgan vaziyatlarni qanday mashq qilaman?', 'Mashg‘ulot jadvali va narxi qanday?'] },
    international: { title: 'Yangi yo‘llar sari.', body: 'Boradigan mamlakatingiz va mavjud guvohnomangizni belgilang. Keyingi qadam — shu yo‘nalish uchun talablarni aniqlashtirish.', checklist: ['Maqsad mamlakatda qaysi hujjatlar kerak?', 'Mavjud guvohnomam uchun qanday talablar bor?', 'Tayyorgarlik va maslahat tartibi qanday?'] }
  };
  let state = { step: 0, answers: {}, opener: null, resultText: '' };
  function headingFocus() { requestAnimationFrame(() => { dialog.scrollTop = 0; const heading = $('#guide-title'); if (heading) { heading.tabIndex = -1; heading.focus({preventScroll:true}); } }); }
  function showStep() {
    const item = steps[state.step];
    error.textContent = '';
    content.innerHTML = `<h2 id="guide-title">${item.title}</h2><p>${item.subtitle}</p><fieldset class="quiz-options" aria-labelledby="guide-title">${item.options.map(([value, title, caption]) => `<label class="quiz-option"><input type="radio" name="${item.name}" value="${value}" ${state.answers[item.name] === value ? 'checked' : ''}><span><strong>${title}</strong><small>${caption}</small></span></label>`).join('')}</fieldset>`;
    $('.quiz-actions').hidden = false;
    back.disabled = state.step === 0;
    next.innerHTML = (state.step === 2 ? 'Tavsiyani ko‘rish' : 'Davom etish') + ' <svg><use href="#arrow"/></svg>';
    $$('.quiz-progress span').forEach((bar, index) => bar.classList.toggle('complete', index <= state.step));
    $$('input', content).forEach(input => input.addEventListener('change', () => { state.answers[item.name] = input.value; error.textContent = ''; }));
    headingFocus();
  }
  function openQuiz(opener) {
    state = { step: 0, answers: {}, opener, resultText: '' };
    const preset = opener.dataset.preset;
    if (preset) state.answers.goal = preset;
    if (preset === 'beginner') state.answers.experience = 'new';
    if (preset === 'practice') state.answers.experience = 'some';
    closeMenu();
    document.body.classList.add('dialog-open');
    dialog.showModal();
    showStep();
  }
  $$('[data-open-quiz]').forEach(button => button.addEventListener('click', () => openQuiz(button)));
  $('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (state.opener && mobileNav.contains(state.opener) && mobileNav.hidden) menu.focus();
    else state.opener?.focus();
  });
  next.addEventListener('click', () => {
    const name = steps[state.step].name;
    if (!state.answers[name]) { error.textContent = 'Davom etish uchun bitta javobni tanlang.'; $('input', content)?.focus(); return; }
    if (state.step < 2) { state.step++; showStep(); } else showResult();
  });
  back.addEventListener('click', () => { if (state.step > 0) { state.step--; showStep(); } });

  function showResult() {
    let key = state.answers.goal;
    if (key === 'practice' && state.answers.experience === 'new') key = 'beginner';
    const route = routes[key];
    const time = steps[2].options.find(item => item[0] === state.answers.time)[1];
    state.resultText = `UNIVERSAL DRIVING ACADEMY\nShaxsiy tayyorgarlik tavsiyasi\n\nYo‘nalish: ${route.title}\n${route.body}\n\nQulay vaqt: ${time}\n\nAniqlashtiriladigan savollar:\n${route.checklist.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nBu umumiy tavsiya. Ariza yuborilmadi va joy band qilinmadi. Dastur, jadval va qabul shartlari alohida tasdiqlanadi.\n`;
    const checklist = route.checklist.map(item => `<li>${item}</li>`).join('');
    content.innerHTML = `<div class="quiz-result-tag"><svg><use href="#check"/></svg> SIZGA MOS BOSHLANISH</div><h2 id="guide-title">${route.title}</h2><p>${route.body}</p><div class="result-checklist"><p>Yozilishdan oldin aniqlashtiring:</p><ul>${checklist}</ul></div><p class="result-note">Sizga qulay vaqt: ${time}. Jadval alohida tasdiqlanadi.</p><div class="result-actions"><button class="button" id="download-plan">Tavsiyani saqlash <svg><use href="#arrow"/></svg></button><button class="text-link" id="copy-plan">Nusxalash</button></div><p class="result-note">Bu umumiy tavsiya. Ariza yuborilmadi va joy band qilinmadi.</p><button class="quiz-restart" id="restart-quiz">Qayta tanlash</button>`;
    $('.quiz-actions').hidden = true;
    error.textContent = '';
    if (contactLinks.length) {
      const link = document.createElement('a'); link.className = 'button'; link.href = contactLinks[0].href; link.textContent = 'Akademiya bilan bog‘lanish'; $('.result-actions').prepend(link);
    }
    $('#download-plan').addEventListener('click', () => {
      const blob = new Blob(['\uFEFF' + state.resultText], {type: 'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'UDA-mening-tayyorgarlik-rejam.txt'; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); notify('Tavsiya fayli tayyorlandi.');
    });
    $('#copy-plan').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(state.resultText); notify('Tavsiya nusxalandi.'); }
      catch { notify('Nusxalash imkoni bo‘lmadi. Tavsiyani fayl qilib saqlang.'); }
    });
    $('#restart-quiz').addEventListener('click', () => { state.step = 0; state.answers = {}; showStep(); });
    headingFocus();
  }
  let toastTimer;
  function notify(message) { const toast = $('.toast'); toast.textContent = message; toast.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200); }
})();
