(function () {
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
  });
})();
