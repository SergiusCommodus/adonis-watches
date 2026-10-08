/* Adonis opening sequence: a spear flies in, sweeping around in a spinning arc,
   strikes, and the light of the strike cuts the night open to reveal the site. */
(function () {
  var root = document.documentElement;
  var intro = document.getElementById('intro');
  if (!intro) return;

  var params = new URLSearchParams(location.search);
  var debug = params.has('introdebug');
  if (root.classList.contains('no-intro') && !debug) { intro.remove(); finish(true); return; }
  try { sessionStorage.setItem('adonis-intro', '1'); } catch (e) {}

  root.classList.add('intro-active');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Elements
  var q = function (s) { return intro.querySelector(s); };
  var top = q('.intro-top'), bot = q('.intro-bottom'), scene = q('.intro-scene');
  var fx = q('.intro-fx'), fxSpear = q('#fx-spear'), trail = q('#fx-trail'), trailGrad = q('#fx-trail-grad');
  var trailWide = q('#fx-trail-wide');
  var flash = q('#fx-flash'), flashCore = q('#fx-flash-core');
  var seamL = q('#fx-seam-l'), seamR = q('#fx-seam-r'), seamGL = q('#fx-seam-gl'), seamGR = q('#fx-seam-gr');
  var glowFilter = q('#fx-glow'), glowFilter2 = q('#fx-glow-wide');
  var laurel = q('.intro-laurel'), letters = intro.querySelectorAll('.intro-word span'), tag = q('.intro-tag');
  var meander = q('.intro-meander'), skipBtn = q('.intro-skip');

  // Timeline (ms)
  var T = {
    starsIn: [0, 800], flight: [350, 2750], impact: 2750, seam: [2780, 3200],
    spearOut: [3150, 3550], laurel: [3250, 3950], word: [3400, 4100], tag: [3700, 4250],
    split: [4600, 5700], end: 5750
  };
  if (reduce) {
    T = { starsIn: [0, 400], flight: [0, 0], impact: -1, seam: [0, 0], spearOut: [0, 0],
      laurel: [200, 800], word: [300, 900], tag: [500, 1000], split: [1700, 2500], end: 2550 };
  }

  // Math helpers
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function prog(t, r) { return r[1] <= r[0] ? (t >= r[1] ? 1 : 0) : clamp((t - r[0]) / (r[1] - r[0]), 0, 1); }
  function eIO(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eOut(t) { return 1 - Math.pow(1 - t, 3); }
  function eIn(t) { return t * t * t; }
  function eOutBack(t) { var c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  var D = Math.PI / 180;

  // Layout
  var W, H, seamY, layoutDone = false, revealFired = false;
  var P = { x: 0, y: 0 }, RX = 0, RY = 0, SC = 1;
  var TIP = 312; // spear tip in spear design units

  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    var mobile = W < 720;
    seamY = Math.round(H * (mobile ? 0.5 : 0.47));
    P = { x: W / 2, y: seamY };                          // the strike point
    RX = W * (mobile ? .38 : .36);                       // orbit size, kept inside the screen
    RY = mobile ? Math.min(H * .28, RX * 1.5) : Math.min(H * .36, RX * .8);
    SC = clamp(Math.min(W, H * 1.6) / 1500, .36, .6);   // spear size
    top.style.height = seamY + 'px';
    bot.style.top = seamY + 'px'; bot.style.height = (H - seamY) + 'px';
    fx.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    [glowFilter, glowFilter2].forEach(function (f) {
      f.setAttribute('x', -50); f.setAttribute('y', -50); f.setAttribute('width', W + 100); f.setAttribute('height', H + 100);
    });
    paintSky();
    layoutDone = true;
  }

  // Starfield and moon, painted once and shared by both halves so the cut is seamless
  function paintSky() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var c = document.createElement('canvas');
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    var g = c.getContext('2d'); g.scale(dpr, dpr);
    var bg = g.createRadialGradient(W * .5, H * .55, 0, W * .5, H * .55, Math.max(W, H) * .8);
    bg.addColorStop(0, '#0d0c0b'); bg.addColorStop(1, '#030304');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var n = Math.round(W * H / 5200);
    for (var i = 0; i < n; i++) {
      var x = rnd() * W, y = rnd() * H * .92, r = Math.pow(rnd(), 3) * 1.5 + .25, a = .25 + rnd() * .7;
      g.fillStyle = rnd() < .18 ? 'rgba(236,206,150,' + a + ')' : 'rgba(255,250,240,' + a + ')';
      g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    }
    // Moon
    var mx = W * .8, my = H * .2, mr = Math.min(W, H) * .075;
    var halo = g.createRadialGradient(mx, my, mr * .8, mx, my, mr * 3);
    halo.addColorStop(0, 'rgba(240,226,196,.10)'); halo.addColorStop(1, 'rgba(240,226,196,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(mx, my, mr * 3, 0, 6.283); g.fill();
    var mg = g.createRadialGradient(mx - mr * .35, my - mr * .35, mr * .1, mx, my, mr);
    mg.addColorStop(0, 'rgba(244,236,218,.62)'); mg.addColorStop(1, 'rgba(176,160,132,.42)');
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.fill();
    g.save(); g.beginPath(); g.arc(mx, my, mr, 0, 6.283); g.clip();
    seed = 99;
    for (var k = 0; k < 22; k++) {
      var cr = mr * (.05 + rnd() * .2), ang = rnd() * 6.283, dist = Math.sqrt(rnd()) * mr * .9;
      g.fillStyle = 'rgba(70,60,48,' + (.12 + rnd() * .18) + ')';
      g.beginPath(); g.arc(mx + Math.cos(ang) * dist, my + Math.sin(ang) * dist, cr, 0, 6.283); g.fill();
    }
    var sh = g.createLinearGradient(mx - mr, my - mr, mx + mr, my + mr);
    sh.addColorStop(.45, 'rgba(3,3,4,0)'); sh.addColorStop(1, 'rgba(3,3,4,.75)');
    g.fillStyle = sh; g.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    g.restore();
    var url = 'url(' + c.toDataURL('image/jpeg', .9) + ')';
    top.style.backgroundImage = url; bot.style.backgroundImage = url;
    top.style.backgroundSize = bot.style.backgroundSize = W + 'px ' + H + 'px';
    top.style.backgroundPosition = '0 0'; bot.style.backgroundPosition = '0 ' + (-seamY) + 'px';
  }


  // The flight: an inward spiral around the strike point. The spear enters from the left,
  // sweeps one and a quarter turns around the centre and dives in. It always points along
  // its path, so it visibly turns through the whole circle as it flies.
  var TURNS = 1.1, A0 = Math.PI * .92, SPINS = 2.75, MID = 69, HALF = 245;
  function flightPos(u) {
    // clockwise on screen; the turning eases off at the end so the final dive runs straight in
    var a = A0 + TURNS * Math.PI * 2 * (1 - Math.pow(1 - u, 1.9));
    // the orbit tightens as it goes; it starts wider so the spear enters from off screen
    var k = Math.pow(1 - u, 1.05) * (1 + .75 * Math.pow(1 - clamp(u / .22, 0, 1), 2));
    return { x: P.x + Math.cos(a) * RX * k, y: P.y + Math.sin(a) * RY * k };
  }
  function flightAngle(u) {
    var a = flightPos(Math.max(0, u - .004)), b = flightPos(Math.min(1, u + .004));
    if (u >= .996) { a = flightPos(.988); b = flightPos(1); }
    return Math.atan2(b.y - a.y, b.x - a.x);
  }
  // time to path position: quick entry, a gliding orbit, then an accelerating dive
  function flightU(p) { return .55 * p + .45 * p * p; }
  // perspective: smaller far away, full size at the strike
  function flightScale(u) { return SC * lerp(.68, 1, eIO(u)); }

  function spinAt(u) { return SPINS * Math.PI * 2 * Math.pow(1 - clamp(u / .9, 0, 1), 2.2); }
  // place the spear by its centre, so it spins about its balance point
  function setSpearMid(c, ang, sc) {
    var gx = c.x - Math.cos(ang) * MID * sc, gy = c.y - Math.sin(ang) * MID * sc;
    fxSpear.setAttribute('transform', 'translate(' + gx.toFixed(2) + ' ' + gy.toFixed(2) + ') rotate(' + (ang / D).toFixed(3) + ') scale(' + sc.toFixed(4) + ')');
  }
  function setSpear(tip, ang, sc) {
    var gx = tip.x - Math.cos(ang) * TIP * sc, gy = tip.y - Math.sin(ang) * TIP * sc;
    fxSpear.setAttribute('transform', 'translate(' + gx.toFixed(2) + ' ' + gy.toFixed(2) + ') rotate(' + (ang / D).toFixed(3) + ') scale(' + sc.toFixed(4) + ')');
  }

  function render(t) {
    if (!layoutDone || W !== window.innerWidth || H !== window.innerHeight) layout();
    // Sky
    var s = eOut(prog(t, T.starsIn));
    top.style.opacity = bot.style.opacity = s;
    meander.style.opacity = (.55 * s).toFixed(3);

    if (!reduce) {
      var started = t >= T.flight[0];
      fxSpear.style.display = started ? '' : 'none';
      if (started) {
        var p = prog(t, T.flight), u = flightU(p), tip, ang, sc;
        if (t < T.impact) {
          sc = flightScale(u);
          var ang1 = flightAngle(1), path = flightPos(u);
          ang = flightAngle(u) + spinAt(u);
          // the centre leads in along the path; near the end it shifts back so the tip lands on the mark
          var back = eIO(clamp((u - .7) / .3, 0, 1)) * HALF * sc;
          setSpearMid({ x: path.x - Math.cos(ang1) * back, y: path.y - Math.sin(ang1) * back }, ang, sc);
        } else {
          ang = flightAngle(1); sc = flightScale(1);
          var since = t - T.impact, sink = eOut(clamp(since / 120, 0, 1)) * 16 * sc;
          tip = { x: P.x + Math.cos(ang) * sink, y: P.y + Math.sin(ang) * sink };
          ang += Math.sin(since / 22) * Math.exp(-since / 140) * 3 * D;   // the shaft quivers
          setSpear(tip, ang, sc);
        }
        fxSpear.style.opacity = (clamp(p * 6, 0, 1) * (1 - eIO(prog(t, T.spearOut)))).toFixed(3);

        // Light trail along the last stretch of the spiral
        var uu = Math.min(u, 1), u0 = Math.max(0, uu - .16), steps = 36, pts = [];
        for (var i = 0; i <= steps; i++) { var q2 = flightPos(lerp(u0, uu, i / steps)); pts.push(q2.x.toFixed(1) + ' ' + q2.y.toFixed(1)); }
        var d = 'M' + pts.join(' L');
        trail.setAttribute('d', d); if (trailWide) trailWide.setAttribute('d', d);
        var a0 = flightPos(u0), a1 = flightPos(uu);
        trailGrad.setAttribute('x1', a0.x); trailGrad.setAttribute('y1', a0.y);
        trailGrad.setAttribute('x2', a1.x); trailGrad.setAttribute('y2', a1.y);
        var trailFade = (t < T.impact ? clamp(p * 4, 0, 1) : 1 - eOut(clamp((t - T.impact) / 380, 0, 1)));
        trail.style.opacity = trailFade.toFixed(3);
        if (trailWide) trailWide.style.opacity = (trailFade * .5).toFixed(3);

        // Impact
        var fi = t >= T.impact ? clamp((t - T.impact) / 520, 0, 1) : -1;
        if (fi >= 0) {
          var R = Math.max(W, H) * .42 * eOut(fi);
          flash.setAttribute('cx', P.x); flash.setAttribute('cy', P.y); flash.setAttribute('r', Math.max(R, 1));
          flash.style.opacity = (1 - fi) * .95;
          flashCore.setAttribute('cx', P.x); flashCore.setAttribute('cy', P.y);
          flashCore.setAttribute('r', Math.max(4, 70 * eOutBack(clamp(fi * 2.2, 0, 1)) * (1 - fi * .6)));
          flashCore.style.opacity = (1 - eIn(fi));
          var el = t - T.impact, shake = el < 240 ? Math.sin(el / 14) * 6 * (1 - el / 240) : 0;
          scene.style.transform = 'translate(' + (shake * .4).toFixed(2) + 'px,' + shake.toFixed(2) + 'px)';
        } else {
          flash.style.opacity = 0; flashCore.style.opacity = 0; scene.style.transform = '';
        }
        drawSeam(P.x, eOut(prog(t, T.seam)));
      } else {
        trail.style.opacity = 0; if (trailWide) trailWide.style.opacity = 0;
        flash.style.opacity = 0; flashCore.style.opacity = 0;
        drawSeam(P.x, 0);
      }
    } else {
      fxSpear.style.display = 'none';
      drawSeam(W * .5, eOut(prog(t, T.laurel)));
    }

    // Brand
    var lp = eOut(prog(t, T.laurel));
    laurel.style.opacity = lp; laurel.style.transform = 'scale(' + lerp(.72, 1, lp).toFixed(4) + ')';
    for (var j = 0; j < letters.length; j++) {
      var st = T.word[0] + j * 70, lpj = eOut(clamp((t - st) / 520, 0, 1));
      letters[j].style.opacity = lpj; letters[j].style.transform = 'translateY(' + ((1 - lpj) * 14).toFixed(2) + 'px)';
    }
    var tp = eOut(prog(t, T.tag)); tag.style.opacity = tp * .9;

    // Split
    var sp2 = eIO(prog(t, T.split));
    if (t >= T.split[0]) {
      intro.classList.add('edges', 'leaving');
      scene.style.opacity = (1 - clamp((t - T.split[0]) / 160, 0, 1)).toFixed(3);
      root.classList.add('intro-revealing');
      if (!revealFired && !debug) { revealFired = true; document.dispatchEvent(new CustomEvent('adonis:introreveal')); }
    } else {
      intro.classList.remove('edges', 'leaving');
      scene.style.opacity = 1;
    }
    top.style.transform = 'translateY(' + (-sp2 * (seamY + 40)).toFixed(2) + 'px)';
    bot.style.transform = 'translateY(' + (sp2 * (H - seamY + 40)).toFixed(2) + 'px)';
  }

  function drawSeam(x, p) {
    var lenL = x, lenR = W - x;
    [[seamL, 0, lenL], [seamGL, 0, lenL], [seamR, W, lenR], [seamGR, W, lenR]].forEach(function (s) {
      var el = s[0];
      el.setAttribute('x1', x); el.setAttribute('y1', seamY); el.setAttribute('x2', s[1]); el.setAttribute('y2', seamY);
      el.setAttribute('stroke-dasharray', Math.max(s[2], 1));
      el.setAttribute('stroke-dashoffset', (s[2] * (1 - p)).toFixed(2));
      el.style.opacity = p > 0 ? 1 : 0;
    });
  }

  // Playback
  var start = null, raf = 0, done = false, offset = 0;
  function tick(now) {
    if (start === null) start = now;
    var t = now - start + offset;
    render(t);
    if (t >= T.end) { finish(false); return; }
    raf = requestAnimationFrame(tick);
  }

  function finish(skippedEarly) {
    if (done) return; done = true;
    cancelAnimationFrame(raf);
    if (intro && intro.parentNode) intro.remove();
    root.classList.remove('intro-active');
    root.classList.add('intro-revealing');
    setTimeout(function () { root.classList.remove('intro-revealing'); }, skippedEarly ? 0 : 1300);
    window.__adonisIntroDone = true;
    document.dispatchEvent(new CustomEvent('adonis:introdone'));
  }

  function skip() {
    if (done) return;
    var now = performance.now();
    var t = start === null ? 0 : now - start + offset;
    if (t < T.split[0]) { offset += T.split[0] - t; }
  }
  skipBtn.addEventListener('click', skip);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !intro.classList.contains('gated')) skip(); });
  window.addEventListener('resize', function () { if (!done) layout(); });

  layout();
  if (debug) {
    window.__adonisIntro = { seek: function (t) { render(t); }, T: T };
    render(0);
    return;
  }
  var go = function () { intro.classList.add('ready'); raf = requestAnimationFrame(tick); };
  function begin() {
    if (document.fonts && document.fonts.ready) {
      var started = false, kick = function () { if (!started) { started = true; go(); } };
      document.fonts.ready.then(kick); setTimeout(kick, 700);
    } else go();
  }

  // Entry gate: browsers only allow sound after a click, so the first click
  // starts the soundtrack and the opening sequence together.
  var snd = window.__adonisAudio;
  if (!snd || snd.isPlaying() || snd.isMuted()) { begin(); return; }
  intro.classList.add('gated'); root.classList.add('intro-gated');
  var gate = document.createElement('div');
  gate.className = 'intro-gate';
  gate.innerHTML = '<div class="intro-gate-in">' +
    '<p class="intro-gate-eyebrow">Adonis</p>' +
    '<button class="intro-gate-enter" type="button">Enter</button>' +
    '<p class="intro-gate-note">Best experienced with sound</p>' +
    '<button class="intro-gate-quiet" type="button">Enter without sound</button></div>';
  intro.appendChild(gate);
  var entered = false;
  function enter(withSound) {
    if (entered) return; entered = true;
    if (withSound) snd.start(); else snd.stop();
    gate.classList.add('out');
    intro.classList.remove('gated'); root.classList.remove('intro-gated');
    setTimeout(function () { gate.remove(); }, 700);
    begin();
  }
  gate.querySelector('.intro-gate-enter').addEventListener('click', function () { enter(true); });
  gate.querySelector('.intro-gate-quiet').addEventListener('click', function () { enter(false); });
  document.addEventListener('keydown', function (e) { if (!entered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); enter(true); } });
  // If the browser lets the music start on its own (returning visitor), drop the gate.
  if (snd.onplay) snd.onplay(function () { if (!entered) enter(true); });
  gate.querySelector('.intro-gate-enter').focus({ preventScroll: true });
})();
