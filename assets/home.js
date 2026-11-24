(function () {
  /* ---------- Language ---------- */
  var I = window.MC_I18N, LS = 'mc-lang';
  function pickLang() {
    var saved = null;
    try { saved = localStorage.getItem(LS); } catch (e) {}
    if (saved && I.langs.indexOf(saved) > -1) return saved;
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i]).toLowerCase();
      if (l.indexOf('zh') === 0) return /hant|tw|hk|mo/.test(l) ? 'zh-Hant' : 'zh-Hans';
      var base = l.split('-')[0];
      if (['en', 'ja', 'ko', 'es', 'pt'].indexOf(base) > -1) return base;
    }
    return 'en';
  }
  function applyLang(lang) {
    var n = I.langs.indexOf(lang); if (n < 0) { lang = 'en'; n = 0; }
    var t = function (k) { var v = I.t[k]; return v ? (v[n] || v[0]) : null; };
    document.documentElement.lang = I.htmlLang[lang];
    document.querySelectorAll('[data-i18n]').forEach(function (el) { var v = t(el.getAttribute('data-i18n')); if (v != null) el.textContent = v; });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) { var v = t(el.getAttribute('data-i18n-html')); if (v != null) el.innerHTML = v; });
    // Show the other name next to the tagline when the local name differs from the English one
    document.querySelectorAll('[data-alt]').forEach(function (el) {
      var key = el.getAttribute('data-alt'), local = t('name.' + key), en = I.t['name.' + key][0];
      el.textContent = local === en ? '' : (key === 'picki' ? local : en) + ' · ';
    });
    var time = document.querySelector('.site-footer time');
    if (time && window.Intl) {
      try { time.textContent = new Intl.DateTimeFormat(I.htmlLang[lang], { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(time.getAttribute('datetime') + 'T12:00:00')); } catch (e) {}
    }
    document.querySelectorAll('[data-carousel]').forEach(function (root) {
      var caps = root.querySelectorAll('.slide figcaption strong');
      root.querySelectorAll('.dots button').forEach(function (b, i) { if (caps[i]) b.setAttribute('aria-label', caps[i].textContent); });
    });
    document.querySelectorAll('[data-l10n-art]').forEach(function (img) {
      img.src = img.getAttribute('data-l10n-art') + (lang === 'en' ? '' : '.' + lang) + '.svg';
    });
    var sel = document.getElementById('lang-select'); if (sel) sel.value = lang;
  }
  if (I) {
    var sel = document.getElementById('lang-select');
    if (sel) {
      I.langs.forEach(function (l) { var o = document.createElement('option'); o.value = l; o.textContent = I.names[l]; sel.appendChild(o); });
      sel.addEventListener('change', function () { try { localStorage.setItem(LS, sel.value); } catch (e) {} applyLang(sel.value); });
    }
    applyLang(pickLang());
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal sections as they scroll into view */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Auto-playing feature carousels */
  var INTERVAL = 4200;
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var slides = root.querySelectorAll('.slide');
    var dotsBox = root.querySelector('.dots');
    var index = 0, timer = null, paused = false, visible = false;

    var dots = Array.prototype.map.call(slides, function (slide, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', slide.querySelector('figcaption strong').textContent);
      b.innerHTML = '<i></i>';
      b.addEventListener('click', function () { go(i); restart(); });
      dotsBox.appendChild(b);
      return b;
    });
    root.style.setProperty('--interval', INTERVAL + 'ms');

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === index);
        s.setAttribute('aria-hidden', k === index ? 'false' : 'true');
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-active', k === index);
        d.setAttribute('aria-selected', k === index ? 'true' : 'false');
        // restart the progress fill animation
        var bar = d.firstChild; bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      });
    }
    function tick() { go(index + 1); }
    function start() { if (!timer && !paused && visible && !reduce) timer = setInterval(tick, INTERVAL); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    root.addEventListener('mouseenter', function () { paused = true; root.classList.add('is-paused'); stop(); });
    root.addEventListener('mouseleave', function () { paused = false; root.classList.remove('is-paused'); restart(); });
    root.addEventListener('focusin', function () { paused = true; root.classList.add('is-paused'); stop(); });
    root.addEventListener('focusout', function () { paused = false; root.classList.remove('is-paused'); restart(); });

    // swipe
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); restart(); }
    });

    // only play while on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        root.classList.toggle('is-playing', visible && !reduce);
        visible ? start() : stop();
      }, { threshold: 0.3 }).observe(root);
    } else { visible = true; start(); }

    if (reduce) root.classList.add('is-paused');
    go(0);

    // mode buttons elsewhere in the same section jump to a slide
    var section = root.closest('section');
    var modes = section ? section.querySelectorAll('[data-go]') : [];
    modes.forEach(function (b) {
      b.addEventListener('click', function () { go(+b.getAttribute('data-go')); restart(); });
    });
    var baseGo = go;
    go = function (i) { baseGo(i); modes.forEach(function (b, k) { b.classList.toggle('is-active', k === index); }); };
    go(0);
  });
})();
