/* ADONIS · site behaviour */
(function () {
  var root = document.documentElement, body = document.body;
  var cfg = window.ADONIS_CONFIG || {};

  /* Header: solid once the page scrolls */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-solid', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var toggle = document.querySelector('.menu-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = !root.classList.contains('menu-open');
      root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { root.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) { root.classList.remove('menu-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); }
    });
  }

  /* Hero entrance after the intro (or right away) */
  function loaded() { body.classList.add('is-loaded'); }
  if (document.getElementById('intro') && !window.__adonisIntroDone) {
    document.addEventListener('adonis:introreveal', function () { setTimeout(loaded, 250); });
    document.addEventListener('adonis:introdone', function () { setTimeout(loaded, 80); });
    // safety net
    setTimeout(loaded, 9000);
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(loaded); });
  }

  /* Reveal on scroll */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* Collection filter */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var target = document.querySelector(group.getAttribute('data-filter-group'));
    if (!target) return;
    group.querySelectorAll('.tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('.tab').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        var f = btn.getAttribute('data-filter');
        target.querySelectorAll('.card').forEach(function (card) {
          card.hidden = !(f === 'all' || card.getAttribute('data-line') === f);
        });
      });
    });
  });

  /* Product gallery */
  document.querySelectorAll('[data-gallery]').forEach(function (g) {
    var imgs = g.querySelectorAll('.gallery-main img');
    var thumbs = g.querySelectorAll('.thumbs button');
    thumbs.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        imgs.forEach(function (im, j) { im.classList.toggle('active', i === j); });
        thumbs.forEach(function (b, j) { b.setAttribute('aria-current', i === j ? 'true' : 'false'); });
      });
    });
  });

  /* Reserve page: preselect the model from ?model= and swap the preview image */
  var modelSelect = document.getElementById('f-model');
  if (modelSelect) {
    var m = new URLSearchParams(location.search).get('model');
    if (m && modelSelect.querySelector('option[value="' + m + '"]')) modelSelect.value = m;
    var preview = document.getElementById('reserve-preview'), previewName = document.getElementById('reserve-preview-name');
    var sync = function () {
      var opt = modelSelect.options[modelSelect.selectedIndex];
      if (preview && opt && opt.getAttribute('data-img')) { preview.src = opt.getAttribute('data-img'); preview.alt = opt.textContent; }
      if (previewName && opt) previewName.textContent = opt.value === 'undecided' ? 'The Mission Collection' : opt.textContent;
    };
    modelSelect.addEventListener('change', sync); sync();
  }

  /* Forms: reservation list and newsletter */
  document.querySelectorAll('form[data-adonis-form]').forEach(function (form) {
    var msg = form.querySelector('.form-msg') || (form.parentNode && form.parentNode.querySelector('.form-msg'));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var hp = form.querySelector('.hp input');
      if (hp && hp.value) return; // bot
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k !== '_gotcha') data[k] = v; });
      data.form = form.getAttribute('data-adonis-form');
      data.page = location.pathname;
      var btn = form.querySelector('[type="submit"]');
      var set = function (text, cls) { if (msg) { msg.textContent = text; msg.className = 'form-msg ' + (cls || ''); } };
      if (!cfg.formEndpoint) {
        console.warn('ADONIS: set formEndpoint in assets/js/config.js to start collecting reservations.');
        set('Reservations open very soon. Please check back shortly.', 'err');
        return;
      }
      if (btn) { btn.disabled = true; btn.dataset.label = btn.dataset.label || btn.textContent; btn.textContent = 'Sending'; }
      fetch(cfg.formEndpoint, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) {
          if (!r.ok) throw new Error('bad status');
          form.reset();
          set(form.getAttribute('data-success') || 'Thank you. You are on the list.', 'ok');
        })
        .catch(function () { set('Something went wrong. Please try again in a moment.', 'err'); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; } });
    });
  });

  /* Social links from config */
  document.querySelectorAll('[data-social]').forEach(function (a) {
    var url = cfg[a.getAttribute('data-social')];
    if (url) a.href = url; else a.parentNode && a.remove();
  });

  /* Replay intro */
  document.querySelectorAll('[data-replay-intro]').forEach(function (a) {
    a.addEventListener('click', function () { try { sessionStorage.removeItem('adonis-intro'); } catch (e) {} });
  });

  /* Year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
