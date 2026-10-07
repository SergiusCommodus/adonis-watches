/* Adonis soundtrack: one looping theme across the whole site.
   Starts as soon as the browser allows (first tap, click or key press),
   remembers position between pages, and stays off if the visitor mutes it. */
(function () {
  'use strict';
  var script = document.currentScript;
  var base = script ? script.src.replace(/js\/audio\.js.*$/, '') : '/assets/';
  var KEY_OFF = 'adonis-sound-off', KEY_POS = 'adonis-sound-pos';
  var TARGET = 0.55, FADE_MS = 1800;
  var reduce = false;
  function get(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function set(s, k, v) { try { s.setItem(k, v); } catch (e) {} }

  var a = new Audio(base + 'audio/theme.mp3');
  a.loop = true; a.preload = 'auto'; a.volume = 0;
  var wantOn = get(localStorage, KEY_OFF) !== '1';
  var playing = false, fadeTimer = null;

  var pos = parseFloat(get(sessionStorage, KEY_POS));
  if (isFinite(pos) && pos > 0) a.addEventListener('loadedmetadata', function () { if (pos < a.duration) a.currentTime = pos; }, { once: true });

  /* button */
  var css = document.createElement('style');
  css.textContent = '.snd{position:fixed;left:clamp(14px,2.6vw,30px);bottom:clamp(14px,3vh,30px);z-index:99999;display:flex;align-items:center;gap:10px;height:40px;padding:0 16px 0 12px;' +
    'background:rgba(8,8,10,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(217,178,115,.5);color:#d9b273;font:500 10.5px/1 "Jost",sans-serif;letter-spacing:.24em;text-transform:uppercase;cursor:pointer;transition:background .25s,color .25s}' +
    '.snd:hover,.snd:focus-visible{background:#d9b273;color:#050506;outline:none}' +
    '.snd svg{width:18px;height:18px;flex:none}.snd .bar{transform-origin:center bottom;transform-box:fill-box}' +
    '.snd[aria-pressed="true"] .bar{animation:sndbar 1.1s ease-in-out infinite}.snd .bar:nth-child(2){animation-delay:.18s}.snd .bar:nth-child(3){animation-delay:.36s}.snd .bar:nth-child(4){animation-delay:.1s}' +
    '@keyframes sndbar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}' +
    '@media (prefers-reduced-motion:reduce){.snd .bar{animation:none!important}}@media (max-width:560px){.snd{height:36px;padding:0 12px 0 10px}.snd span{display:none}}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'snd';
  btn.setAttribute('aria-label', 'Sound');
  btn.innerHTML = '<svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true"><rect class="bar" x="1" y="4" width="2" height="10"/><rect class="bar" x="5.5" y="2" width="2" height="14"/><rect class="bar" x="10" y="5" width="2" height="8"/><rect class="bar" x="14.5" y="3" width="2" height="12"/></svg><span></span>';
  var label = btn.querySelector('span');
  function paint() {
    var on = wantOn && playing;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    label.textContent = on ? 'Sound on' : (wantOn ? 'Sound on' : 'Sound off');
    if (wantOn && !playing) label.textContent = 'Tap for sound';
    btn.setAttribute('aria-label', on ? 'Mute soundtrack' : 'Play soundtrack');
  }
  function mount() { document.body.appendChild(btn); paint(); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  function fadeTo(v, ms, done) {
    clearInterval(fadeTimer);
    var from = a.volume, t0 = performance.now();
    fadeTimer = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (v - from) * k));
      if (k >= 1) { clearInterval(fadeTimer); if (done) done(); }
    }, 40);
  }
  function start() {
    if (!wantOn || playing) return;
    var p = a.play();
    if (p && p.then) p.then(function () { playing = true; paint(); fadeTo(TARGET, FADE_MS); removeGestures(); }, function () { playing = false; paint(); });
    else { playing = true; paint(); fadeTo(TARGET, FADE_MS); removeGestures(); }
  }
  function stop() { wantOn = false; set(localStorage, KEY_OFF, '1'); fadeTo(0, 500, function () { a.pause(); playing = false; paint(); }); paint(); }
  function resume() { wantOn = true; set(localStorage, KEY_OFF, '0'); playing = false; start(); }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (wantOn && playing) stop(); else resume();
  });

  var evs = ['pointerdown', 'keydown', 'touchend'];
  function onGesture(e) { if (e.target === btn || (btn.contains && btn.contains(e.target))) return; if (e.type === 'keydown' && e.key === 'Escape') return; start(); }
  function removeGestures() { evs.forEach(function (n) { window.removeEventListener(n, onGesture, true); }); }
  evs.forEach(function (n) { window.addEventListener(n, onGesture, true); });

  /* pause when the tab is hidden, resume when it returns */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (playing) a.pause(); }
    else if (wantOn && playing) a.play().catch(function () {});
  });
  window.addEventListener('pagehide', function () { set(sessionStorage, KEY_POS, String(a.currentTime || 0)); });
  setInterval(function () { if (playing) set(sessionStorage, KEY_POS, String(a.currentTime || 0)); }, 2000);

  /* try right away: allowed when the visitor has interacted with the site before */
  if (wantOn) start();
  window.__adonisAudio = { el: a, start: start, stop: stop };
})();
