/* Adonis opening sequence: a hoplite throws a spear, the strike cuts the night open, the site is revealed. */
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
  var hopWrap = q('.intro-hoplite'), glow = q('.intro-glow');
  var jRoot = q('#h-root'), jTorso = q('#h-torso'), jHead = q('#h-head'), jCloak = q('#h-cloak');
  var jUarm = q('#h-uarm'), jFarm = q('#h-farm'), spearIn = q('#h-spear');
  var jBT = q('#h-bthigh'), jBS = q('#h-bshin'), jFT = q('#h-fthigh'), jFS = q('#h-fshin'), jShadow = q('#h-shadow');
  var jCrest = q('#h-crest'), blurFe = q('#h-blur-fe');
  var footMark = q('#h-ffoot');
  var fx = q('.intro-fx'), dustG = q('#fx-dust'), fxSpear = q('#fx-spear'), trail = q('#fx-trail'), trailGrad = q('#fx-trail-grad');
  var flash = q('#fx-flash'), flashCore = q('#fx-flash-core');
  var seamL = q('#fx-seam-l'), seamR = q('#fx-seam-r'), seamGL = q('#fx-seam-gl'), seamGR = q('#fx-seam-gr');
  var glowFilter = q('#fx-glow'), glowFilter2 = q('#fx-glow-wide');
  var laurel = q('.intro-laurel'), letters = intro.querySelectorAll('.intro-word span'), tag = q('.intro-tag');
  var meander = q('.intro-meander'), skipBtn = q('.intro-skip');

  // Timeline (ms)
  var T = {
    starsIn: [0, 900], hopIn: [500, 2000], windup: [2000, 2650], throwP: [2650, 2870],
    follow: [2870, 3600], flight: [2870, 3270], impact: 3270, seam: [3300, 3720],
    dim: [3560, 4160], spearOut: [3660, 4060], laurel: [3760, 4460], word: [3900, 4600], tag: [4200, 4750],
    split: [5100, 6200], end: 6250
  };
  if (reduce) {
    T = { starsIn: [0, 400], hopIn: [0, 0], windup: [0, 0], throwP: [0, 0], follow: [0, 0], flight: [0, 0], impact: -1, seam: [0, 0],
      dim: [0, 0], spearOut: [0, 0], laurel: [200, 800], word: [300, 900], tag: [500, 1000], split: [1700, 2500], end: 2550 };
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
  var W, H, seamY, figH, runDist = 0, layoutDone = false, rel = null, revealFired = false;
  var TIP = 312;
  var JT = { HIP: [272, 352], BHIP: [258, 356], BKNEE: [224, 446], FHIP: [286, 356], FKNEE: [338, 432],
    SHOULDER: [262, 246], ELBOW: [222, 206], NECK: [290, 228], CREST: [292, 158] };
  var dust = [];

  function layout() {
    W = window.innerWidth; H = window.innerHeight;
    var mobile = W < 720;
    seamY = Math.round(H * (mobile ? 0.5 : 0.47));
    figH = Math.min(H * (mobile ? 0.52 : 0.68), W * (mobile ? 1.05 : 0.6));
    var figW = figH * 480 / 530;
    runDist = cx + figW * .9;
    var cx = W * (mobile ? 0.3 : 0.22);
    var left = cx - figW * 0.46;
    var bottom = H * (mobile ? 0.07 : 0.06);
    hopWrap.style.width = figW + 'px'; hopWrap.style.height = figH + 'px';
    hopWrap.style.left = left + 'px'; hopWrap.style.top = (H - bottom - figH) + 'px';
    var gs = figH * 1.15;
    glow.style.width = glow.style.height = gs + 'px';
    glow.style.left = (cx - gs / 2) + 'px'; glow.style.top = (H - bottom - figH / 2 - gs / 2) + 'px';

    top.style.height = seamY + 'px';
    bot.style.top = seamY + 'px'; bot.style.height = (H - seamY) + 'px';
    fx.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    [glowFilter, glowFilter2].forEach(function (f) {
      f.setAttribute('x', -50); f.setAttribute('y', -50); f.setAttribute('width', W + 100); f.setAttribute('height', H + 100);
    });
    paintSky();
    rel = null; // release point must be recomputed
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

  // Hoplite pose: joint angles in degrees (positive = clockwise on screen), root shift in design px
  var KEYS = ['torso','uarm','farm','head','root','rooty','bt','bs','ft','fs','cloak','spear'];
  function mk(o) { var r = {}; KEYS.forEach(function (k) { r[k] = o[k] || 0; }); return r; }
  var P_RUN  = mk({ torso: 9, uarm: 4, farm: -28, head: -4, spear: -8, cloak: 14 });          // carrying the spear at the shoulder
  var P_SET  = mk({ torso: 2, uarm: -6, farm: -4, head: -1, root: 0, bt: 2, bs: 4, ft: -4, fs: -2, cloak: 4, spear: -16 });
  var P_BACK = mk({ torso: -11, uarm: -26, farm: -12, head: -4, root: -16, bt: 6, bs: 10, ft: -6, fs: -4, cloak: -6, spear: -13 });
  var P_REL  = mk({ torso: 15, uarm: 76, farm: 52, head: 6, root: 30, bt: 15, bs: 32, ft: -2, fs: 9, cloak: 22, spear: -27 });
  var P_END  = mk({ torso: 17, uarm: 124, farm: 26, head: 7, root: 38, bt: 16, bs: 40, ft: 0, fs: 12, cloak: 8, spear: -27 });
  function mixPose(a, b, t, tf) {
    var o = {};
    for (var k in a) o[k] = lerp(a[k], b[k], tf && tf[k] ? tf[k](t) : t);
    return o;
  }
  var STRIDES = 2.5;
  function runPose(u) {
    // u 0..1 across the run up; the legs cycle, the body bobs, the last stride settles into the set position
    var ph = u * STRIDES * Math.PI * 2, s = Math.sin(ph), c = Math.cos(ph);
    var amp = 30 * (1 - Math.pow(u, 6));
    var p = mk({});
    for (var k in P_RUN) p[k] = P_RUN[k];
    p.bt = -s * amp; p.bs = Math.max(0, -c) * amp * 1.6 + 6;
    p.ft = s * amp; p.fs = Math.max(0, c) * amp * 1.6 + 6;
    p.rooty = -Math.abs(Math.sin(ph)) * 7 * (1 - u * .5);
    p.cloak = 14 + s * 5;
    p.head = -4 + Math.abs(s) * 2;
    return p;
  }
  function pose(t) {
    if (t < T.hopIn[0]) return runPose(0);
    if (t < T.hopIn[1]) {
      var u = prog(t, T.hopIn), rp = runPose(u), blend = eIO(clamp((u - .72) / .28, 0, 1));
      return mixPose(rp, P_SET, blend);
    }
    if (t < T.throwP[0]) return mixPose(P_SET, P_BACK, eIO(prog(t, T.windup)));
    if (t < T.follow[0]) {
      var th = prog(t, T.throwP), tt = eIn(th) * .6 + th * .4;
      return mixPose(P_BACK, P_REL, tt, { farm: function (v) { return Math.pow(v, 1.7); }, cloak: function (v) { return v * v; }, head: function (v) { return Math.sqrt(v); } });
    }
    return mixPose(P_REL, P_END, eOut(prog(t, T.follow)), { bs: function (v) { return eIO(v); }, cloak: function (v) { return eOut(v); } });
  }
  function rot(el, a, p) { el.setAttribute('transform', 'rotate(' + a.toFixed(3) + ' ' + p[0] + ' ' + p[1] + ')'); }
  // Secondary motion: cloak and crest lag behind the body
  var lag = { cloak: null, crest: 0, lastT: 0, lastTorso: 0 };
  function applyPose(p, t) {
    var dt = t === undefined ? 16 : clamp(t - lag.lastT, 0, 50); if (t !== undefined) lag.lastT = t;
    var cl = p.cloak;
    if (lag.cloak === null || dt === 0) lag.cloak = cl; else lag.cloak += (cl - lag.cloak) * Math.min(1, dt / 110);
    var torsoVel = (p.torso - lag.lastTorso); lag.lastTorso = p.torso;
    lag.crest += ((-torsoVel * 1.8) - lag.crest) * Math.min(1, dt / 90);
    jRoot.setAttribute('transform', 'translate(' + p.root.toFixed(2) + ' ' + p.rooty.toFixed(2) + ')');
    rot(jTorso, p.torso, JT.HIP); rot(jHead, p.head, JT.NECK); rot(jCloak, lag.cloak, JT.SHOULDER);
    rot(jCrest, clamp(lag.crest, -14, 14), JT.CREST);
    rot(jUarm, p.uarm, JT.SHOULDER); rot(jFarm, p.farm, JT.ELBOW);
    rot(jBT, p.bt, JT.BHIP); rot(jBS, p.bs, JT.BKNEE); rot(jFT, p.ft, JT.FHIP); rot(jFS, p.fs, JT.FKNEE);
    var local = p.spear - (p.torso + p.uarm + p.farm);
    spearIn.setAttribute('transform', 'translate(240 160) rotate(' + local.toFixed(3) + ')');
    jShadow.setAttribute('rx', (120 + p.root * .6).toFixed(1));
    jShadow.setAttribute('opacity', (.6 + p.rooty * .03).toFixed(3));
    // motion blur on the forearm during the whip
    var inThrow = t !== undefined && t > T.throwP[0] + 60 && t < T.throwP[1] + 40;
    blurFe.setAttribute('stdDeviation', inThrow ? '2.2 1.2' : '0 0');
  }

  // Where and how the spear leaves the hand, in screen space
  function release() {
    if (rel) return rel;
    hopWrap.style.transform = 'translateX(0px)';
    applyPose(pose(T.flight[0] - 0.001));
    var m = spearIn.getScreenCTM();
    var ang = Math.atan2(m.b, m.a), sc = Math.hypot(m.a, m.b);
    var p0 = { x: m.e + Math.cos(ang) * TIP * sc, y: m.f + Math.sin(ang) * TIP * sc };
    var tx = clamp(p0.x + W * .4, W * .66, W * .9);
    if (W < 720) tx = clamp(p0.x + W * .3, W * .6, W * .86);
    var tgt = { x: tx, y: seamY };
    var dist = Math.hypot(tgt.x - p0.x, tgt.y - p0.y);
    var k = dist * .3;
    var c = { x: p0.x + Math.cos(ang) * k, y: p0.y + Math.sin(ang) * k };
    rel = { p0: p0, c: c, t: tgt, sc: sc, ang: ang };
    return rel;
  }

  function bez(r, u) {
    var a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, d = u * u;
    return { x: a * r.p0.x + b * r.c.x + d * r.t.x, y: a * r.p0.y + b * r.c.y + d * r.t.y };
  }
  function bezTan(r, u) {
    return Math.atan2(2 * (1 - u) * (r.c.y - r.p0.y) + 2 * u * (r.t.y - r.c.y), 2 * (1 - u) * (r.c.x - r.p0.x) + 2 * u * (r.t.x - r.c.x));
  }

  function setSpear(tip, ang, sc) {
    var gx = tip.x - Math.cos(ang) * TIP * sc, gy = tip.y - Math.sin(ang) * TIP * sc;
    fxSpear.setAttribute('transform', 'translate(' + gx.toFixed(2) + ' ' + gy.toFixed(2) + ') rotate(' + (ang / D).toFixed(3) + ') scale(' + sc.toFixed(4) + ')');
  }

  function render(t) {
    if (!layoutDone) layout();
    // Sky
    var s = eOut(prog(t, T.starsIn));
    top.style.opacity = bot.style.opacity = s;
    meander.style.opacity = (.55 * s * (1 - prog(t, T.split) * 0)).toFixed(3);

    // Hoplite entrance and dimming
    var hu = prog(t, T.hopIn), hi = eOut(hu), dim = eIO(prog(t, T.dim));
    var hopOpacity = reduce ? 0 : clamp(hu * 4, 0, 1) * lerp(1, .14, dim);
    hopWrap.style.opacity = hopOpacity.toFixed(3);
    var runX = (1 - (hu < .72 ? hu / .72 * .85 : .85 + eOut((hu - .72) / .28) * .15)) * -runDist;
    hopWrap.style.transform = 'translateX(' + runX.toFixed(2) + 'px)';
    glow.style.opacity = (hi * lerp(1, .2, dim)).toFixed(3);
    // camera: a slow push in during the throw, released after the strike
    var push = eIO(prog(t, [T.windup[0], T.throwP[1]])) * (1 - eIO(prog(t, [T.impact, T.impact + 700])));
    scene.style.transformOrigin = (W * .3) + 'px ' + (H * .6) + 'px';

    if (!reduce) {
      var released = t >= T.flight[0];
      applyPose(pose(t), t);
      spearIn.style.opacity = released ? 0 : 1;
      if (released) {
        var r = release();
        hopWrap.style.transform = 'translateX(0px)';
        applyPose(pose(t), t);
        fxSpear.style.display = '';
        var u = prog(t, T.flight); u = u * .82 + eIn(u) * .18;
        var tip, ang;
        if (t < T.impact) {
          tip = bez(r, u); ang = bezTan(r, u);
        } else {
          ang = bezTan(r, 1);
          var since = t - T.impact, sink = eOut(clamp(since / 120, 0, 1)) * 14 * r.sc;
          tip = { x: r.t.x + Math.cos(ang) * sink, y: r.t.y + Math.sin(ang) * sink };
          ang += Math.sin(since / 22) * Math.exp(-since / 140) * 2.6 * D;
        }
        setSpear(tip, ang, r.sc);
        drawDust(t);
        fxSpear.style.opacity = (1 - eIO(prog(t, T.spearOut))).toFixed(3);

        // Trail along the arc
        var steps = 28, pts = [], uu = Math.min(u, 1), u0 = Math.max(0, uu - .55);
        for (var i = 0; i <= steps; i++) { var p = bez(r, lerp(u0, uu, i / steps)); pts.push(p.x.toFixed(1) + ' ' + p.y.toFixed(1)); }
        trail.setAttribute('d', 'M' + pts.join(' L'));
        var a0 = bez(r, u0), a1 = bez(r, uu);
        trailGrad.setAttribute('x1', a0.x); trailGrad.setAttribute('y1', a0.y);
        trailGrad.setAttribute('x2', a1.x); trailGrad.setAttribute('y2', a1.y);
        var trailFade = t < T.impact ? 1 : 1 - eOut(clamp((t - T.impact) / 380, 0, 1));
        trail.style.opacity = trailFade.toFixed(3);

        // Impact
        var fi = T.impact >= 0 && t >= T.impact ? clamp((t - T.impact) / 520, 0, 1) : -1;
        if (fi >= 0) {
          var R = Math.max(W, H) * .42 * eOut(fi);
          flash.setAttribute('cx', r.t.x); flash.setAttribute('cy', r.t.y); flash.setAttribute('r', Math.max(R, 1));
          flash.style.opacity = (1 - fi) * .95;
          flashCore.setAttribute('cx', r.t.x); flashCore.setAttribute('cy', r.t.y);
          flashCore.setAttribute('r', Math.max(4, 70 * eOutBack(clamp(fi * 2.2, 0, 1)) * (1 - fi * .6)));
          flashCore.style.opacity = (1 - eIn(fi));
          var shake = (t - T.impact) < 240 ? Math.sin((t - T.impact) / 14) * 6 * (1 - (t - T.impact) / 240) : 0;
          scene.style.transform = 'translate(' + (shake * .4).toFixed(2) + 'px,' + shake.toFixed(2) + 'px) scale(' + (1 + push * .05).toFixed(4) + ')';
        } else {
          flash.style.opacity = 0; flashCore.style.opacity = 0; scene.style.transform = 'scale(' + (1 + push * .05).toFixed(4) + ')';
        }
        // Seam opens from the strike point to both edges
        var sp = eOut(prog(t, T.seam));
        drawSeam(r.t.x, sp);
      } else {
        fxSpear.style.display = 'none'; trail.style.opacity = 0; flash.style.opacity = 0; flashCore.style.opacity = 0;
        scene.style.transform = 'scale(' + (1 + push * .05).toFixed(4) + ')';
        drawSeam(W * .5, 0);
      }
    } else {
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

  function drawDust(t) {
    if (!dustG) return;
    if (!dust.length) {
      var m = footMark.getScreenCTM(); var fxp = { x: m.e, y: m.f };
      for (var i = 0; i < 7; i++) dust.push({ x: fxp.x - 10 - i * 9, y: fxp.y - 2 - (i % 3) * 4, r: 5 + (i % 4) * 3, d: i * 35 });
    }
    var html = '';
    for (var k = 0; k < dust.length; k++) {
      var dd = dust[k], u = clamp((t - T.throwP[0] - 60 - dd.d) / 650, 0, 1);
      if (u <= 0 || u >= 1) continue;
      var e = eOut(u);
      html += '<circle cx="' + (dd.x - e * 26).toFixed(1) + '" cy="' + (dd.y - e * 14).toFixed(1) + '" r="' + (dd.r * (0.4 + e * 1.6)).toFixed(1) + '" fill="#cfae78" opacity="' + ((1 - u) * .22).toFixed(3) + '"/>';
    }
    dustG.innerHTML = html;
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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') skip(); });
  window.addEventListener('resize', function () { if (!done) layout(); });

  layout();
  if (debug) {
    window.__adonisIntro = { seek: function (t) { render(t); }, T: T };
    render(0);
    return;
  }
  intro.classList.add('ready');
  var go = function () { raf = requestAnimationFrame(tick); };
  if (document.fonts && document.fonts.ready) {
    var started = false, kick = function () { if (!started) { started = true; go(); } };
    document.fonts.ready.then(kick); setTimeout(kick, 700);
  } else go();
})();
