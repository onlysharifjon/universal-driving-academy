(() => {
  'use strict';
  const region = document.getElementById('category-carousel');
  if (!region) return;
  const slides = [...region.querySelectorAll('[data-carousel-slide]')];
  const selectors = [...region.querySelectorAll('[data-carousel-select]')];
  const previous = region.querySelector('[data-carousel-prev]');
  const next = region.querySelector('[data-carousel-next]');
  const toggle = region.querySelector('[data-carousel-toggle]');
  const announcement = region.querySelector('[data-carousel-announcement]');
  if (!slides.length || !previous || !next || !toggle || !announcement) return;

  const { t } = window.UDA_I18N;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer = null, userPaused = false, hovered = false, focused = false;
  let visible = !('IntersectionObserver' in window);
  let touch = null;
  let pointerIntent = null;
  const interpolate = (key, values) => t(key).replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  const valuesFor = number => ({
    current: number + 1,
    total: slides.length,
    category: slides[number].dataset.category,
    name: t('offerings.category' + slides[number].dataset.category)
  });
  const slideLabel = number => interpolate('carousel.slideLabel', valuesFor(number));
  const mayRotate = () => slides.length > 1 && !userPaused && !reducedMotion.matches && visible && !hovered && !document.hidden;

  function stopTimer() { if (timer !== null) clearTimeout(timer); timer = null; }
  function playbackLabel() {
    // Hover and visibility suspend playback temporarily without changing user intent.
    const playing = !userPaused && !reducedMotion.matches && slides.length > 1;
    toggle.dataset.playing = String(playing);
    toggle.hidden = reducedMotion.matches || slides.length < 2;
    toggle.disabled = reducedMotion.matches || slides.length < 2;
    toggle.setAttribute('aria-label', t(playing ? 'carousel.pause' : 'carousel.play'));
  }
  function syncPlayback() {
    playbackLabel();
    if (!mayRotate()) { stopTimer(); return; }
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      if (!mayRotate()) return;
      show(index + 1, false);
      syncPlayback();
    }, 6000);
  }
  function show(number, manual) {
    const target = ((number % slides.length) + slides.length) % slides.length;
    const changed = target !== index;
    index = target;
    slides.forEach((slide, position) => { slide.hidden = position !== index; });
    selectors.forEach(button => button.setAttribute('aria-current', String(Number(button.dataset.carouselSelect) === index)));
    // Load the active image and one ahead, without fetching the whole gallery upfront.
    for (const position of new Set([index, (index + 1) % slides.length])) {
      const image = slides[position].querySelector('img');
      if (image) image.loading = 'eager';
    }
    if (manual) {
      userPaused = true;
      if (changed) announcement.textContent = slideLabel(index);
      syncPlayback();
    }
  }
  function localize() {
    region.setAttribute('role', 'region');
    region.setAttribute('aria-roledescription', t('carousel.kind'));
    region.setAttribute('aria-label', t('carousel.region'));
    slides.forEach((slide, position) => {
      if (!slide.id) slide.id = 'category-carousel-slide-' + slide.dataset.category.toLowerCase();
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', t('carousel.slideKind'));
      slide.setAttribute('aria-label', slideLabel(position));
    });
    selectors.forEach(button => {
      const position = Number(button.dataset.carouselSelect);
      if (!Number.isInteger(position) || !slides[position]) return;
      button.setAttribute('aria-label', interpolate('carousel.selectLabel', valuesFor(position)));
      button.setAttribute('aria-controls', slides[position].id);
    });
    previous.setAttribute('aria-label', t('carousel.prev'));
    next.setAttribute('aria-label', t('carousel.next'));
    previous.disabled = next.disabled = slides.length < 2;
    playbackLabel();
  }

  previous.addEventListener('click', () => show(index - 1, true));
  next.addEventListener('click', () => show(index + 1, true));
  selectors.forEach(button => button.addEventListener('click', () => {
    const target = Number(button.dataset.carouselSelect);
    if (Number.isInteger(target) && target >= 0 && target < slides.length) show(target, true);
  }));
  toggle.addEventListener('pointerdown', event => {
    if (event.isPrimary === false || (event.button !== undefined && event.button !== 0)) return;
    // Pointer focus pauses first; keep the action the button offered before focus.
    pointerIntent = { id: event.pointerId, paused: !userPaused };
  });
  toggle.addEventListener('pointercancel', () => { pointerIntent = null; });
  toggle.addEventListener('keydown', () => { pointerIntent = null; });
  toggle.addEventListener('click', event => {
    const intent = event.detail > 0 ? pointerIntent : null;
    pointerIntent = null;
    if (reducedMotion.matches || slides.length < 2) return;
    userPaused = intent ? intent.paused : !userPaused;
    announcement.textContent = '';
    syncPlayback();
  });
  region.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/i.test(event.target.tagName)) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(index + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  region.addEventListener('focusin', () => {
    // Moving focus within the carousel must not cancel an explicit Play action.
    if (!focused) { focused = true; userPaused = true; syncPlayback(); }
  });
  region.addEventListener('focusout', event => {
    if (!region.contains(event.relatedTarget)) focused = false;
    if (!toggle.contains(event.relatedTarget)) pointerIntent = null;
  });
  region.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovered = true; syncPlayback(); } });
  region.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch') { hovered = false; syncPlayback(); } });
  region.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch' || event.isPrimary === false || !slides[index].contains(event.target)) return;
    touch = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  region.addEventListener('pointerup', event => {
    if (!touch || touch.id !== event.pointerId) return;
    const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.4) show(index + (dx < 0 ? 1 : -1), true);
  });
  region.addEventListener('pointercancel', () => { touch = null; });
  document.addEventListener('pointerup', event => {
    if (pointerIntent?.id === event.pointerId && !toggle.contains(event.target)) pointerIntent = null;
  });
  document.addEventListener('pointercancel', () => { pointerIntent = null; });
  document.addEventListener('visibilitychange', syncPlayback);
  document.addEventListener('uda:languagechange', () => {
    localize();
    // Labels change language, but only a deliberate slide change is announced.
    announcement.textContent = '';
  });
  reducedMotion.addEventListener('change', syncPlayback);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.target === region) visible = entry.isIntersecting;
      syncPlayback();
    }, { threshold: 0 });
    observer.observe(region);
  }

  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  localize();
  show(index, false);
  const toolbar = region.querySelector('.carousel-toolbar');
  if (toolbar) toolbar.hidden = false;
  syncPlayback();
})();
