(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var calm = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ===== Entrance: preloader curtain, then hero sequence ===== */
  var pre = $('#preloader'), pct = $('#pct'), n = 0, entered = false;
  function enter() {
    if (entered) return; entered = true;
    pre.classList.add('done');
    document.body.classList.remove('loading');
    setTimeout(function () { $$('[data-count]').forEach(countUp); }, 1700);
    setTimeout(function () { pre.style.display = 'none'; }, 1800);
  }
  var timer = setInterval(function () {
    n = Math.min(100, n + Math.ceil(Math.random() * 14));
    pct.textContent = n + '%';
    if (n === 100) { clearInterval(timer); setTimeout(enter, 350); }
  }, 90);
  setTimeout(enter, 4000); /* failsafe */

  function countUp(el) {
    var end = +el.dataset.count, t0 = null;
    requestAnimationFrame(function step(t) {
      t0 = t0 || t;
      var p = Math.min((t - t0) / 1400, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    });
  }

  /* ===== Scroll reveal (staggered per row) ===== */
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

  /* ===== Scroll-driven UI ===== */
  var bar = $('#progress'), header = $('#header'), totop = $('#totop'),
      steps = $('.steps'), nav = $('#nav'),
      links = $$('#nav a[href^="#"]:not(.btn)'),
      secs = links.map(function (a) { return $(a.getAttribute('href')); }),
      lastY = 0, ticking = false;

  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
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
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ===== Mobile menu ===== */
  var burger = $('#burger');
  function menu(open) {
    nav.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  }
  burger.addEventListener('click', function () { menu(!nav.classList.contains('open')); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
  addEventListener('resize', function () { if (innerWidth > 1000) menu(false); });

  /* ===== Pointer effects (desktop only): card tilt + magnetic buttons ===== */
  if (fine && !calm) {
    $$('.tilt').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        if (!c.classList.contains('in')) return;
        var r = c.getBoundingClientRect(),
            x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transition = 'border-color .3s,box-shadow .4s';
        c.style.transform = 'perspective(800px) rotateX(' + (-y * 7) + 'deg) rotateY(' + (x * 7) + 'deg) translateY(-6px)';
      });
      c.addEventListener('mouseleave', function () {
        c.style.transition = ''; c.style.transform = '';
      });
    });
    $$('.mag').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * .18 + 'px,' + (e.clientY - r.top - r.height / 2) * .3 + 'px)';
      });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* ===== FAQ ===== */
  $$('.q button').forEach(function (b) {
    b.addEventListener('click', function () {
      var item = b.parentNode, open = !item.classList.contains('open');
      $$('.q.open').forEach(function (o) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open);
    });
  });

  /* ===== Gallery images per industry =====
     Always use forward slashes (/). Spaces are encoded by encodeURI.
     pattern(folder, template, count, exts): template uses {n} for the number.
     files(folder, [names]): exact file names with extension.
     Missing files are skipped automatically. */
  function pattern(folder, templates, count, exts) {
    templates = [].concat(templates);
    exts = exts || ['jpg', 'jpeg', 'png', 'webp'];
    var out = [];
    for (var i = 1; i <= count; i++) {
      var alts = [];
      templates.forEach(function (t) {
        exts.forEach(function (ext) {
          alts.push(encodeURI(folder + '/' + t.replace('{n}', i) + '.' + ext));
        });
      });
      out.push(alts);
    }
    return out;
  }
  function files(folder, names) {
    return names.map(function (name) { return encodeURI(folder + '/' + name); });
  }

  var galleryImages = {
    food: ['assets/packaging/food-1.jpg', 'assets/packaging/food-2.jpg'],
    health: ['assets/packaging/health-1.jpg', 'assets/packaging/health-2.jpg'],
    cosmetics: pattern('assets/MASK', 'MASK ({n})', 10, ['png', 'jpg', 'jpeg']),
    baby: ['assets/packaging/baby-1.jpg', 'assets/packaging/baby-2.jpg'],
    electronics: [].concat(
      pattern('assets/STEAMER-20261021T171919Z-1-001/STEAMER', 'STEAM ({n})', 10, ['png']),
      files('assets/LADY SHAVER', [
        'IMAGE 1 (1) copy.jpg', 'IMAGE 1 (2).png', 'IMAGE 1 (4).png',
        'IMAGE 1 (5).png', 'IMAGE 1 (6).png', 'Firefly_Gemini Flash (4).png'
      ])
    ),
    household: ['assets/packaging/household-1.jpg', 'assets/packaging/household-2.jpg'],
    pet: ['assets/packaging/pet-1.jpg', 'assets/packaging/pet-2.jpg']
  };

  var data = {
    food: ['Food & Beverage', 'Packaging designed to stand out on the shelf and keep products fresh.'],
    health: ['Health Supplements', 'Clean, trustworthy labels for health and wellness products.'],
    cosmetics: ['Cosmetics', 'Elegant, modern packaging that reflects your brand.'],
    baby: ['Baby Products', 'Safe, friendly packaging for growing baby brands.'],
    electronics: ['Electronics', 'Packaging that protects products and presents technology clearly.'],
    household: ['Household Products', 'Practical, attractive packaging for everyday essentials.'],
    pet: ['Pet Products', 'Fun, memorable packaging that pet owners trust.']
  };

  /* ===== Modal ===== */
  var modal = $('#modal'), box = $('.box', modal), gal = $('#gal'), last = null;

  function emptyMessage() {
    if (!gal.children.length) gal.innerHTML = '<p class="muted">Projects for this category are coming soon.</p>';
  }

  function show(title, desc, list, single, from) {
    last = from;
    $('#mTitle').textContent = title;
    $('#mDesc').textContent = desc;
    box.classList.toggle('single', !!single);
    gal.innerHTML = '';
    var seen = {};

    if (!list || !list.length) {
      emptyMessage();
    } else {
      list.forEach(function (item, i) {
        var alts = Array.isArray(item) ? item : [item], k = 0;
        var a = document.createElement('a');
        a.target = '_blank'; a.rel = 'noopener';
        var im = document.createElement('img');
        im.alt = title + ' ' + (i + 1);
        im.onload = function () {
          var key = alts[k];
          if (seen[key]) { a.remove(); emptyMessage(); } else { seen[key] = true; }
        };
        im.onerror = function () {
          k++;
          if (k < alts.length) { a.href = alts[k]; im.src = alts[k]; }
          else { a.remove(); emptyMessage(); }
        };
        a.href = alts[0];
        im.src = alts[0];
        a.appendChild(im);
        gal.appendChild(a);
      });
    }

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
      var key = c.dataset.industry, d = data[key];
      if (d) show(d[0], d[1], galleryImages[key] || [], false, c);
    });
  });

  $$('.work figure').forEach(function (f) {
    f.tabIndex = 0;
    function open() {
      var im = $('img', f);
      show($('figcaption', f).textContent, 'Selected packaging project.', [im.getAttribute('src')], true, f);
    }
    f.addEventListener('click', open);
    f.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(); });
  });

  $$('[data-close]').forEach(function (c) { c.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  /* ===== Contact form (connect to Formspree, Netlify Forms or your backend) ===== */
  $('#form').addEventListener('submit', function (e) {
    e.preventDefault();
    var b = $('button', this);
    b.textContent = 'Message sent ✓';
    b.disabled = true;
  });
})();