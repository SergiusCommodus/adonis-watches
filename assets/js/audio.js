/* Adonis soundtrack: one looping theme across the whole site.
   Starts as soon as the browser allows (first tap, click or key press),
   remembers position between pages, and stays off if the visitor mutes it. */
(function () {
  'use strict';
  var script = document.currentScript;
  var base = script ? script.src.replace(/js\/audio\.js.*$/, '') : '/assets/';
  var KEY_OFF = 'adonis-sound-off', KEY_POS = 'adonis-anthem-pos';
  var TARGET = 0.55, FADE_MS = 1800;
  var reduce = false;
  function get(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function set(s, k, v) { try { s.setItem(k, v); } catch (e) {} }

  var ua = navigator.userAgent || '';
  var isAppleWebKit = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document) ||
    (/Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|Android/.test(ua));
  var a = document.createElement('audio');
  a.setAttribute('playsinline', '');
  // AAC in an mp4 wrapper is the format iPhones handle most reliably; mp3 is the fallback.
  var aac = a.canPlayType && a.canPlayType('audio/mp4; codecs="mp4a.40.2"');
  a.src = base + (aac === 'probably' || (isAppleWebKit && aac) ? 'audio/anthem.m4a' : 'audio/anthem.mp3');
  a.loop = true; a.preload = 'none'; a.volume = 0;
  try { localStorage.removeItem(KEY_OFF); } catch (e) {}
  var wantOn = get(sessionStorage, KEY_OFF) !== '1';
  var playing = false, fadeTimer = null;

  var pos = parseFloat(get(sessionStorage, KEY_POS));
  if (isFinite(pos) && pos > 0) a.addEventListener('loadedmetadata', function () { if (pos < a.duration) a.currentTime = pos; }, { once: true });

  /* button */
  var css = document.createElement('style');
  css.textContent = '.snd-float{position:fixed;left:clamp(16px,3vw,36px);bottom:calc(3.2vh + 40px);z-index:99999;display:flex;align-items:center;gap:10px;height:40px;padding:0 16px 0 12px;' +
    'background:rgba(8,8,10,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(217,178,115,.5);color:#d9b273;font:500 10.5px/1 "Jost",sans-serif;letter-spacing:.24em;text-transform:uppercase;cursor:pointer;transition:background .25s,color .25s}' +
    '.snd-float:hover,.snd-float:focus-visible{background:#d9b273;color:#050506;outline:none}' +
    '.snd-float svg{width:18px;height:18px;flex:none}.snd-float .bar{transform-origin:center bottom;transform-box:fill-box}' +
    '.snd-float[aria-pressed="true"] .bar{animation:sndbar 1.1s ease-in-out infinite}.snd-float .bar:nth-child(2){animation-delay:.18s}.snd-float .bar:nth-child(3){animation-delay:.36s}.snd-float .bar:nth-child(4){animation-delay:.1s}' +
    '.snd-float{display:none!important}html.intro-active .snd-float{display:flex!important}html.intro-gated .snd-float{opacity:0;pointer-events:none}' +
    '@keyframes sndbar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}' +
    '@media (prefers-reduced-motion:reduce){.snd-float .bar{animation:none!important}}@media (max-width:560px){.snd-float{height:36px;padding:0 12px 0 10px}.snd-float span{display:none}}';
  document.head.appendChild(css);

  /* Floating toggle, shown only while the opening sequence plays. Afterwards the toggle
     lives in the header (.snd-head buttons in every page's markup). */
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'snd snd-float';
  btn.innerHTML = '<svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><rect class="bar" x="1" y="4" width="2" height="10"/><rect class="bar" x="5.5" y="2" width="2" height="14"/><rect class="bar" x="10" y="5" width="2" height="8"/><rect class="bar" x="14.5" y="3" width="2" height="12"/></svg><span></span>';
  function paint() {
    var on = wantOn && playing;
    var text = on ? 'Sound on' : (wantOn ? 'Tap for sound' : 'Sound off');
    var aria = on ? 'Sound on, mute soundtrack' : 'Sound off, play soundtrack';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.querySelector('span').textContent = text;
    btn.setAttribute('aria-label', text + (on ? ', mute soundtrack' : ', play soundtrack'));
    document.querySelectorAll('.snd-head').forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', aria);
      b.title = on ? 'Mute soundtrack' : 'Play soundtrack';
    });
  }
  function mount() { document.body.appendChild(btn); paint(); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  document.addEventListener('adonis:swap', paint);

  function fadeTo(v, ms, done) {
    clearInterval(fadeTimer);
    var from = a.volume, t0 = performance.now();
    fadeTimer = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (v - from) * k));
      if (k >= 1) { clearInterval(fadeTimer); if (done) done(); }
    }, 40);
  }
  var attempt = 0;
  function ok() { playing = true; paint(); fadeTo(TARGET, FADE_MS); removeGestures(); }
  function start() {
    if (!wantOn || playing) return;
    var my = ++attempt, p;
    try { p = a.play(); } catch (e) { return; }
    if (p && p.then) p.then(function () { if (my === attempt || !a.paused) ok(); }, function () { if (my === attempt && a.paused) { playing = false; paint(); } });
    else ok();
  }
  a.addEventListener('playing', function () { if (!playing && wantOn) ok(); });
  function stop() { wantOn = false; set(sessionStorage, KEY_OFF, '1'); fadeTo(0, 500, function () { a.pause(); playing = false; paint(); }); paint(); }
  function resume() { wantOn = true; set(sessionStorage, KEY_OFF, '0'); playing = false; start(); }

  function toggle(e) { e.stopPropagation(); if (wantOn && playing) stop(); else resume(); }
  btn.addEventListener('click', toggle);
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.snd-head'); if (b) toggle(e); });

  var evs = ['click', 'pointerup', 'touchend', 'keydown'];
  function onGesture(e) { if (e.target.closest && e.target.closest('.snd, .intro-gate')) return; if (e.type === 'keydown' && e.key === 'Escape') return; start(); }
  function removeGestures() { evs.forEach(function (n) { window.removeEventListener(n, onGesture, true); }); }
  evs.forEach(function (n) { window.addEventListener(n, onGesture, true); });

  /* pause when the tab is hidden, resume when it returns */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (playing) a.pause(); }
    else if (wantOn && playing) a.play().catch(function () {});
  });
  window.addEventListener('pagehide', function () { set(sessionStorage, KEY_POS, String(a.currentTime || 0)); });
  setInterval(function () { if (playing) set(sessionStorage, KEY_POS, String(a.currentTime || 0)); }, 2000);

  /* Try right away when the browser says sound may autoplay (returning visitors in Chrome
     and Firefox). Otherwise wait for a gesture, so the track is not downloaded for nothing. */
  var policy = '';
  try { if (navigator.getAutoplayPolicy) policy = navigator.getAutoplayPolicy('mediaelement'); } catch (e) {}
  // Safari and iPhones never allow this without a tap, so skip the attempt there.
  if (wantOn && (policy === 'allowed' || (policy === '' && !isAppleWebKit))) start();
  var playCbs = [];
  a.addEventListener('playing', function () { playCbs.forEach(function (f) { f(); }); });
  window.__adonisAudio = { el: a, start: function () { wantOn = true; set(sessionStorage, KEY_OFF, '0'); start(); }, stop: stop,
    isPlaying: function () { return playing; }, isMuted: function () { return !wantOn; }, onplay: function (f) { playCbs.push(f); } };
})();
