(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Preloader, then hero staggers in */
  var pre = $('#preloader'), pct = $('#pct'), n = 0, entered = false;
  function enter() {
    if (entered) return; entered = true;
    pre.classList.add('done');
    document.body.classList.remove('loading');
    $$('[data-count]').forEach(countUp);
  }
  var timer = setInterval(function () {
    n = Math.min(100, n + Math.ceil(Math.random() * 16));
    pct.textContent = n + '%';
    if (n === 100) { clearInterval(timer); setTimeout(enter, 300); }
  }, 100);
  setTimeout(enter, 4000); /* failsafe */

  function countUp(el) {
    var end = +el.dataset.count, t0 = null;
    (function step(t) {
      t0 = t0 || t;
      var p = Math.min((t - t0) / 1400, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  /* Typed headline */
  var words = ['Packaging Designer', 'Label Designer', 'Amazon Branding Specialist', 'Print Production Expert'];
  var typed = $('#typed'), wi = 0, ci = 0, del = false;
  (function type() {
    var w = words[wi];
    ci += del ? -1 : 1;
    typed.textContent = w.slice(0, ci);
    var wait = del ? 35 : 70;
    if (!del && ci === w.length) { del = true; wait = 1500; }
    else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; wait = 350; }
    setTimeout(type, reduce ? 99999 : wait);
  })();

  /* Hero sheet tilts toward the pointer (desktop only) */
  var tilt = $('#tilt');
  if (tilt && !reduce && window.matchMedia('(hover:hover)').matches) {
    var art = tilt.parentNode;
    art.addEventListener('mousemove', function (e) {
      var r = art.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = 'rotateY(' + x * 12 + 'deg) rotateX(' + -y * 10 + 'deg)';
    });
    art.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
  }

  /* Scroll reveal */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(function (el) {
    var sibs = $$('.rv', el.parentNode).filter(function (s) { return s.parentNode === el.parentNode; });
    el.style.setProperty('--sd', (sibs.indexOf(el) % 4) * 0.1 + 's');
    io.observe(el);
  });

  /* Scroll-driven: progress, header, timeline, active nav */
  var bar = $('#progress'), header = $('#header'), totop = $('#totop'),
      steps = $('.steps'), nav = $('#nav'),
      links = $$('#nav a[href^="#"]:not(.btn)'),
      secs = links.map(function (a) { return $(a.getAttribute('href')); }),
      lastY = 0, ticking = false;

  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    header.classList.toggle('stuck', y > 40);
    header.classList.toggle('hide', y > lastY && y > 400 && !nav.classList.contains('open'));
    totop.classList.toggle('show', y > 700);
    lastY = y;
    if (steps) {
      var r = steps.getBoundingClientRect();
      steps.style.setProperty('--p', Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height)));
    }
    var cur = -1;
    secs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Mobile menu */
  var burger = $('#burger');
  function menu(open) {
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  }
  burger.addEventListener('click', function () { menu(!nav.classList.contains('open')); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });

  /* FAQ */
  $$('.q button').forEach(function (b) {
    b.addEventListener('click', function () {
      var item = b.parentNode, open = !item.classList.contains('open');
      $$('.q.open').forEach(function (o) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open);
    });
  });

  /* Modal: industry galleries and image viewer, both using your own images */
  var imgs = ['/shaver%20box.jpeg', '/ladu%20shaver.jpeg', '/lady%20shaver%203.jpeg', '/streamer%20box.jpeg', '/steamer%20box.jpeg'];
  var data = {
    food: ['Food & Beverage', 'Packaging designed to stand out on the shelf and keep products fresh.', 3],
    health: ['Health Supplements', 'Clean, trustworthy labels for health and wellness products.', 2],
    cosmetics: ['Cosmetics', 'Elegant, modern packaging that reflects your brand.', 0],
    baby: ['Baby Products', 'Safe, friendly packaging for growing baby brands.', 1],
    electronics: ['Electronics', 'Packaging that protects products and presents technology clearly.', 4],
    household: ['Household Products', 'Practical, attractive packaging for everyday essentials.', 2],
    pet: ['Pet Products', 'Fun, memorable packaging that pet owners trust.', 3]
  };
  var modal = $('#modal'), box = $('.box', modal), gal = $('#gal'), last = null;

  function show(title, desc, list, single, from) {
    last = from;
    $('#mTitle').textContent = title;
    $('#mDesc').textContent = desc;
    box.classList.toggle('single', !!single);
    gal.innerHTML = '';
    list.forEach(function (src, i) {
      var a = document.createElement('a');
      a.href = src; a.target = '_blank'; a.rel = 'noopener';
      a.innerHTML = '<img alt="' + title + ' ' + (i + 1) + '" src="' + src + '">';
      gal.appendChild(a);
    });
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('.x', modal).focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (last && last.focus) last.focus();
  }
  $$('.card').forEach(function (c) {
    c.addEventListener('click', function () {
      var d = data[c.dataset.industry]; if (!d) return;
      var list = imgs.slice(d[2]).concat(imgs.slice(0, d[2]));
      show(d[0], d[1], list, false, c);
    });
  });
  $$('.work figure').forEach(function (f) {
    f.addEventListener('click', function () {
      var im = $('img', f);
      show($('figcaption', f).textContent, 'Selected packaging project.', [im.getAttribute('src')], true, f);
    });
  });
  $$('[data-close]').forEach(function (c) { c.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  /* Contact form (connect to Formspree, Netlify Forms or your backend to receive messages) */
  $('#form').addEventListener('submit', function (e) {
    e.preventDefault();
    var b = $('button', this);
    b.textContent = 'Message sent ✓';
    b.disabled = true;
  });
})();