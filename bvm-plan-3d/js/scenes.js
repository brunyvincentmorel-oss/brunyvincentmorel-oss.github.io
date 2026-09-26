/* BVM PLAN 3D — scènes Three.js : maquette de la maison (hero) et séjour configurable (matériaux). */
(function () {
  'use strict';
  var B = window.BVM;
  var T = window.THREE;
  var root = document.documentElement;

  function hasWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }
  if (!B || !T || !hasWebGL()) { root.classList.add('no-webgl'); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lin = function (hex) { return new T.Color(hex).convertSRGBToLinear(); };
  var damp = function (dt, k) { return 1 - Math.exp(-k * dt); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  function makeRenderer(canvas) {
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputEncoding = T.sRGBEncoding;
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;
    r.setClearColor(0x000000, 0);
    return r;
  }
  function boxE(x0, x1, y0, y1, z0, z1, mat) {
    var m = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  function whenVisible(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { threshold: 0.01 }).observe(el);
  }

  /* =========================================================
     Maquette de la maison
     ========================================================= */
  function initHero() {
    var vp = document.getElementById('hero-vp');
    var canvas = document.getElementById('hero-canvas');
    if (!vp || !canvas) return;
    var labelsEl = vp.querySelector('.vp-labels');
    var scaleEl = vp.querySelector('.vp-scale');
    var buttons = Array.prototype.slice.call(vp.querySelectorAll('[data-mode]'));
    var renderer;
    try { renderer = makeRenderer(canvas); } catch (e) { root.classList.add('no-webgl'); return; }

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(20, 1, 0.1, 300);
    var PLAN_SCALE = 0.34;

    var PALETTE = {
      plan: { wall: '#DCE8EB', oak: '#11232A', oakLight: '#11232A', tile: '#11232A', stone: '#11232A', wood: '#1F3A44', dark: '#1F3A44', white: '#1F3A44', fabric: '#1F3A44', rug: '#172D35', deck: '#132730', leaf: '#1D3A40' },
      clay: { wall: '#EEF1EF', oak: '#CBD3CF', oakLight: '#CBD3CF', tile: '#CBD3CF', stone: '#CBD3CF', wood: '#F7F8F7', dark: '#F7F8F7', white: '#F7F8F7', fabric: '#F7F8F7', rug: '#DDE3E0', deck: '#C3CCC8', leaf: '#E3E8E6' },
      finish: { wall: '#EFEBE3', oak: '#B8895C', oakLight: '#CFAE84', tile: '#AEB6B4', stone: '#C3BCB0', wood: '#8A6242', dark: '#2E393E', white: '#F1F2EF', fabric: '#5C7782', rug: '#D5CCBC', deck: '#9C7552', leaf: '#6E8F63' }
    };
    var mats = {}, targets = {};
    Object.keys(PALETTE.clay).forEach(function (k) {
      mats[k] = new T.MeshStandardMaterial({ color: lin(PALETTE.plan[k]), roughness: 0.88, metalness: 0 });
      targets[k] = mats[k].color.clone();
    });
    if (mats.leaf) mats.leaf.flatShading = true;
    var glassMat = new T.MeshStandardMaterial({ color: lin('#8FDDF6'), transparent: true, opacity: 0.3, roughness: 0.1, metalness: 0, depthWrite: false });

    // --- Murs (groupe mis à l'échelle en hauteur : plan coupé ⇄ volume) ---
    var wallGroup = new T.Group();
    scene.add(wallGroup);
    B.walls.forEach(function (w) {
      var span = B.wallSpan(w), cur = span[0];
      function add(s, e, y0, y1, mat) {
        if (e - s < 0.001 || y1 - y0 < 0.001) return null;
        var m = w.axis === 'x'
          ? boxE(s, e, y0, y1, w.c - w.t / 2, w.c + w.t / 2, mat)
          : boxE(w.c - w.t / 2, w.c + w.t / 2, y0, y1, s, e, mat);
        wallGroup.add(m);
        return m;
      }
      w.open.slice().sort(function (p, q) { return p.s - q.s; }).forEach(function (o) {
        add(cur, o.s, 0, B.H, mats.wall);
        if (o.b > 0) add(o.s, o.e, 0, o.b, mats.wall);
        if (o.t < B.H) add(o.s, o.e, o.t, B.H, mats.wall);
        if (o.type === 'win') {
          var g = w.axis === 'x'
            ? boxE(o.s, o.e, o.b, o.t, w.c - 0.012, w.c + 0.012, glassMat)
            : boxE(w.c - 0.012, w.c + 0.012, o.b, o.t, o.s, o.e, glassMat);
          g.castShadow = false; g.receiveShadow = false;
          wallGroup.add(g);
        }
        cur = o.e;
      });
      add(cur, span[1], 0, B.H, mats.wall);
    });
    wallGroup.scale.y = PLAN_SCALE;

    // --- Sols ---
    B.rooms.forEach(function (r) {
      var f = boxE(r.nx0, r.nx1, 0, 0.04, r.nz0, r.nz1, mats[r.floor]);
      f.castShadow = false;
      scene.add(f);
    });
    var deck = boxE(0.4, 4.4, 0, 0.06, -2.6, -0.15, mats.deck);
    deck.castShadow = false;
    scene.add(deck);

    // --- Mobilier ---
    var FL = 0.04;
    B.furniture.forEach(function (f) {
      if (f.k === 'box') {
        scene.add(boxE(f.x0, f.x1, FL, FL + f.h, f.z0, f.z1, mats[f.m]));
      } else if (f.k === 'rug') {
        var rug = boxE(f.x0, f.x1, FL, FL + 0.012, f.z0, f.z1, mats.rug);
        rug.castShadow = false;
        scene.add(rug);
      } else if (f.k === 'table') {
        scene.add(boxE(f.x0, f.x1, FL + f.h - 0.04, FL + f.h, f.z0, f.z1, mats.wood));
        [[f.x0 + 0.06, f.z0 + 0.06], [f.x1 - 0.1, f.z0 + 0.06], [f.x0 + 0.06, f.z1 - 0.1], [f.x1 - 0.1, f.z1 - 0.1]].forEach(function (p) {
          scene.add(boxE(p[0], p[0] + 0.04, FL, FL + f.h - 0.04, p[1], p[1] + 0.04, mats.wood));
        });
      } else if (f.k === 'sofa') {
        scene.add(boxE(f.x0, f.x1, FL, FL + 0.42, f.z0, f.z1, mats.fabric));
        scene.add(boxE(f.x0, f.x1, FL + 0.42, FL + 0.82, f.z1 - 0.22, f.z1, mats.fabric));
        scene.add(boxE(f.x0, f.x0 + 0.18, FL + 0.42, FL + 0.62, f.z0, f.z1, mats.fabric));
        scene.add(boxE(f.x1 - 0.18, f.x1, FL + 0.42, FL + 0.62, f.z0, f.z1, mats.fabric));
      } else if (f.k === 'bed') {
        scene.add(boxE(f.x0, f.x1, FL, FL + 0.3, f.z0, f.z1, mats.wood));
        scene.add(boxE(f.x0 + 0.04, f.x1 - 0.03, FL + 0.3, FL + 0.52, f.z0 + 0.03, f.z1 - 0.03, mats.white));
        scene.add(boxE(f.x0, f.x0 + 0.08, FL, FL + 1.0, f.z0, f.z1, mats.fabric));
        var pw = (f.z1 - f.z0 - 0.3) / 2;
        scene.add(boxE(f.x0 + 0.12, f.x0 + 0.52, FL + 0.52, FL + 0.64, f.z0 + 0.1, f.z0 + 0.1 + pw, mats.white));
        scene.add(boxE(f.x0 + 0.12, f.x0 + 0.52, FL + 0.52, FL + 0.64, f.z0 + 0.2 + pw, f.z0 + 0.2 + 2 * pw, mats.white));
        scene.add(boxE(f.x0 + 0.9, f.x1 - 0.03, FL + 0.52, FL + 0.56, f.z0 + 0.02, f.z1 - 0.02, mats.fabric));
      } else if (f.k === 'glass') {
        var gl = boxE(f.x0, f.x1, FL, FL + f.h, f.z0, f.z1, glassMat);
        gl.castShadow = false;
        scene.add(gl);
      }
    });

    // --- Arbres ---
    [[-2.6, -1.6, 1], [15.0, 1.0, 1.15], [-2.2, 10.2, 0.9]].forEach(function (t) {
      var trunk = new T.Mesh(new T.CylinderGeometry(0.1 * t[2], 0.14 * t[2], 1.5 * t[2], 8), mats.wood);
      trunk.position.set(t[0], 0.75 * t[2], t[1]); trunk.castShadow = true;
      var c1 = new T.Mesh(new T.IcosahedronGeometry(1.25 * t[2], 1), mats.leaf);
      c1.position.set(t[0], 2.35 * t[2], t[1]); c1.castShadow = true;
      var c2 = new T.Mesh(new T.IcosahedronGeometry(0.85 * t[2], 1), mats.leaf);
      c2.position.set(t[0] + 0.3, 3.25 * t[2], t[1] - 0.2); c2.castShadow = true;
      scene.add(trunk, c1, c2);
    });

    // --- Sol extérieur : grille 1 m + ombres ---
    (function () {
      var S = 2048, M = 40, px = S / M, c = document.createElement('canvas');
      c.width = c.height = S;
      var g = c.getContext('2d');
      g.fillStyle = 'rgb(16,33,40)'; g.fillRect(0, 0, S, S);
      for (var i = 0; i <= M; i++) {
        var major = (i + 1) % 5 === 0;
        g.strokeStyle = major ? 'rgba(25,181,232,.30)' : 'rgba(25,181,232,.13)';
        g.lineWidth = major ? 2 : 1.4;
        var p = Math.round(i * px) + 0.5;
        g.beginPath(); g.moveTo(p, 0); g.lineTo(p, S); g.stroke();
        g.beginPath(); g.moveTo(0, p); g.lineTo(S, p); g.stroke();
      }
      g.globalCompositeOperation = 'destination-in';
      var rg = g.createRadialGradient(S / 2, S / 2, S * 0.08, S / 2, S / 2, S / 2);
      rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(0.55, 'rgba(0,0,0,.75)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg; g.fillRect(0, 0, S, S);
      var tex = new T.CanvasTexture(c);
      tex.encoding = T.sRGBEncoding;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      var grid = new T.Mesh(new T.PlaneGeometry(M, M), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      grid.rotation.x = -Math.PI / 2; grid.position.set(6, -0.004, 5);
      scene.add(grid);
      var shadowPlane = new T.Mesh(new T.PlaneGeometry(M, M), new T.ShadowMaterial({ opacity: 0.38 }));
      shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.set(6, -0.002, 5);
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);
    })();

    // --- Lumières ---
    scene.add(new T.HemisphereLight(lin('#E4F1F5'), lin('#1B2A30'), 0.5));
    var sun = new T.DirectionalLight(lin('#FFF3E2'), 0.78);
    sun.position.set(-3, 18, -5);
    sun.target.position.set(6, 0, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    var sc = sun.shadow.camera;
    sc.left = -14; sc.right = 14; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 60;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
    scene.add(sun, sun.target);
    var fill = new T.DirectionalLight(lin('#BFE6F5'), 0.22);
    fill.position.set(26, 12, 30);
    scene.add(fill);

    // --- Cotes (vue en plan) ---
    var coteMat = new T.LineBasicMaterial({ color: lin('#19B5E8'), transparent: true, opacity: 0 });
    (function () {
      var y = 0.03, t = 0.18, pts = [];
      function seg(a, b) { pts.push(new T.Vector3(a[0], y, a[1]), new T.Vector3(b[0], y, b[1])); }
      seg([-0.15, 11.2], [12.15, 11.2]);
      [-0.15, 12.15].forEach(function (x) { seg([x - t, 11.2 + t], [x + t, 11.2 - t]); seg([x, 10.4], [x, 11.45]); });
      seg([13.2, -0.15], [13.2, 10.15]);
      [-0.15, 10.15].forEach(function (z) { seg([13.2 - t, z + t], [13.2 + t, z - t]); seg([12.4, z], [13.45, z]); });
      var lines = new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), coteMat);
      lines.renderOrder = 2;
      scene.add(lines);
    })();

    // --- Étiquettes HTML ---
    var tags = B.rooms.map(function (r) {
      var el = document.createElement('div');
      el.className = 'vp-label' + (r.minor ? ' is-minor' : '');
      el.innerHTML = '<b>' + r.name + '</b><span>' + B.fmt(r.area) + ' m²</span>';
      labelsEl.appendChild(el);
      return { el: el, p: new T.Vector3(r.cx, 0.06, r.cz) };
    });
    [[B.fmt(B.totals.extW), 6, 11.2, ''], [B.fmt(B.totals.extD), 13.2, 5, ' is-v']].forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'vp-cote' + c[3];
      el.textContent = c[0];
      labelsEl.appendChild(el);
      tags.push({ el: el, p: new T.Vector3(c[1], 0.05, c[2]), v: !!c[3] });
    });

    // --- Caméra ---
    var target = new T.Vector3(6.6, 0, 4.5), goalTarget = target.clone();
    var cam = { az: 0, pol: 0.002, rad: 60, fov: 20 };
    var goal = { az: 0, pol: 0.002, rad: 60, fov: 20 };
    var goalScale = PLAN_SCALE, aspect = 1.3, vw = 1, vh = 1, mode = 'plan';
    function nearest(cur, want) { var tau = Math.PI * 2; return want + tau * Math.round((cur - want) / tau); }
    function planGoal() {
      goal.fov = 20;
      var halfH = Math.max(14.8 / 2, (14.6 / 2) / aspect) * 1.05;
      goal.rad = halfH / Math.tan(T.MathUtils.degToRad(goal.fov / 2));
      goal.pol = 0.002;
      goal.az = nearest(cam.az, 0);
      goalTarget.set(6.6, 0, 4.6);
    }
    function orbitGoal() {
      goal.fov = 34;
      goal.rad = 25 * Math.max(1, 1.3 / aspect);
      goalTarget.set(6, 0.3, 4.8);
    }

    function setMode(m, snap) {
      var was = mode;
      mode = m;
      var is3d = m !== 'plan';
      vp.dataset.mode = is3d ? '3d' : 'plan';
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === m)); });
      if (scaleEl) scaleEl.textContent = m === 'plan' ? 'Vue en plan · cotes en m' : m === 'clay' ? 'Maquette blanche' : 'Finitions appliquées';
      Object.keys(mats).forEach(function (k) { targets[k] = lin(PALETTE[m][k]); });
      goalScale = is3d ? 1 : PLAN_SCALE;
      if (is3d) {
        if (was === 'plan') { goal.pol = 0.98; goal.az = cam.az + 0.65; }
        orbitGoal();
      } else {
        planGoal();
      }
      if (snap) {
        cam.az = goal.az; cam.pol = goal.pol; cam.rad = goal.rad; cam.fov = goal.fov;
        target.copy(goalTarget);
        wallGroup.scale.y = goalScale;
        Object.keys(mats).forEach(function (k) { mats[k].color.copy(targets[k]); });
        coteMat.opacity = is3d ? 0 : 1;
      }
      kick();
    }

    // --- Interaction : glisser pour pivoter ---
    var dragging = false, px0 = 0, py0 = 0, lastInteract = 0;
    canvas.addEventListener('pointerdown', function (e) {
      if (mode === 'plan') return;
      dragging = true; px0 = e.clientX; py0 = e.clientY;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* capture optionnelle */ }
      vp.classList.add('is-dragging', 'hint-off');
      lastInteract = performance.now();
      kick();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - px0, dy = e.clientY - py0;
      px0 = e.clientX; py0 = e.clientY;
      goal.az -= dx * 0.008;
      goal.pol = clamp(goal.pol - dy * 0.004, 0.5, 1.25);
      lastInteract = performance.now();
    });
    function endDrag() { dragging = false; vp.classList.remove('is-dragging'); lastInteract = performance.now(); }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    buttons.forEach(function (b) {
      b.addEventListener('click', function () { cancelIntro(); setMode(b.dataset.mode); });
    });

    // --- Boucle de rendu ---
    var running = false, raf = 0, last = performance.now(), v3 = new T.Vector3();
    function updateLabels() {
      tags.forEach(function (t) {
        v3.copy(t.p).project(camera);
        var x = (v3.x * 0.5 + 0.5) * vw, y = (-v3.y * 0.5 + 0.5) * vh;
        t.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) translate(-50%,-50%)' + (t.v ? ' rotate(-90deg)' : '');
        t.el.style.visibility = v3.z > 1 ? 'hidden' : '';
      });
    }
    function step(dt, now) {
      var k = damp(dt, 3.2);
      var is3d = mode !== 'plan';
      if (is3d && !reduce && !dragging && now - lastInteract > 3500) goal.az += dt * 0.07;
      cam.az += (goal.az - cam.az) * k;
      cam.pol += (goal.pol - cam.pol) * k;
      cam.rad += (goal.rad - cam.rad) * k;
      cam.fov += (goal.fov - cam.fov) * k;
      target.lerp(goalTarget, k);
      wallGroup.scale.y += (goalScale - wallGroup.scale.y) * damp(dt, 3);
      var kc = damp(dt, 4);
      Object.keys(mats).forEach(function (key) { mats[key].color.lerp(targets[key], kc); });
      coteMat.opacity += ((is3d ? 0 : 1) - coteMat.opacity) * damp(dt, 5);
    }
    function place() {
      var sp = Math.sin(cam.pol);
      camera.position.set(target.x + cam.rad * sp * Math.sin(cam.az), target.y + cam.rad * Math.cos(cam.pol), target.z + cam.rad * sp * Math.cos(cam.az));
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
      camera.lookAt(target);
    }
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt, now);
      place();
      renderer.render(scene, camera);
      updateLabels();
      if (running) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

    function resize() {
      vw = Math.max(1, canvas.clientWidth); vh = Math.max(1, canvas.clientHeight);
      renderer.setSize(vw, vh, false);
      aspect = vw / vh;
      camera.aspect = aspect;
      if (mode === 'plan') planGoal(); else orbitGoal();
      kick();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();

    var inView = true;
    whenVisible(vp, function (v) { inView = v; running = v && !document.hidden; if (running) kick(); });
    document.addEventListener('visibilitychange', function () { running = inView && !document.hidden; if (running) kick(); });

    // --- Vue figée pour la couverture du dossier de projet ---
    function snapshot() {
      if (B.snapshotURL) return;
      var saved = {};
      Object.keys(mats).forEach(function (k) { saved[k] = mats[k].color.clone(); mats[k].color.copy(lin(PALETTE.finish[k])); });
      var savedScale = wallGroup.scale.y, savedOp = coteMat.opacity;
      wallGroup.scale.y = 1; coteMat.opacity = 0;
      var c2 = new T.PerspectiveCamera(30, aspect, 0.1, 300), tgt = new T.Vector3(6, 0.3, 4.8), r = 27 * Math.max(1, 1.3 / aspect);
      c2.position.set(tgt.x + r * Math.sin(0.95) * Math.sin(0.72), tgt.y + r * Math.cos(0.95), tgt.z + r * Math.sin(0.95) * Math.cos(0.72));
      c2.lookAt(tgt);
      renderer.render(scene, c2);
      try { B.snapshotURL = canvas.toDataURL('image/png'); } catch (e) { B.snapshotURL = null; }
      Object.keys(mats).forEach(function (k) { mats[k].color.copy(saved[k]); });
      wallGroup.scale.y = savedScale; coteMat.opacity = savedOp;
      renderer.render(scene, camera);
      if (B.snapshotURL) document.dispatchEvent(new CustomEvent('bvm:snapshot', { detail: B.snapshotURL }));
    }

    // --- Séquence d'ouverture : plan → volume → finitions ---
    var timers = [];
    function cancelIntro() { timers.forEach(clearTimeout); timers = []; }
    if (reduce) {
      setMode('finish', true);
      setTimeout(snapshot, 300);
    } else {
      setMode('plan', true);
      wallGroup.scale.y = 0.02; goalScale = 0.02;
      timers.push(setTimeout(function () { goalScale = PLAN_SCALE; }, 500));
      timers.push(setTimeout(function () { setMode('clay'); }, 2000));
      timers.push(setTimeout(function () { setMode('finish'); }, 4600));
      setTimeout(snapshot, 6400);
    }
    B.hero = { setMode: function (m) { cancelIntro(); setMode(m); } };
  }

  /* =========================================================
     Séjour configurable (couleurs de murs + revêtements de sol)
     ========================================================= */
  function initRoom() {
    var vp = document.getElementById('room-vp');
    var canvas = document.getElementById('room-canvas');
    if (!vp || !canvas) return;
    var renderer;
    try { renderer = makeRenderer(canvas); } catch (e) { root.classList.add('no-webgl'); return; }
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(34, 1, 0.1, 100);
    var S = B.roomSpec, W = S.W, D = S.D, HH = S.H, TW = 0.16;

    function std(hex, o) {
      var p = { color: lin(hex), roughness: 0.9, metalness: 0 };
      if (o) Object.keys(o).forEach(function (k) { p[k] = o[k]; });
      return new T.MeshStandardMaterial(p);
    }
    var wallInput = document.querySelector('input[name="wall"]:checked');
    var floorInput = document.querySelector('input[name="floor"]:checked');
    var M = {
      paint: std(wallInput ? wallInput.dataset.hex : '#89AC76', { roughness: 0.95 }),
      cut: std('#1B272C', { roughness: 1 }),
      outer: std('#CDD5D1'),
      trim: std('#F4F2EC', { roughness: 0.6 }),
      wood: std('#8A6242', { roughness: 0.7 }),
      darkWood: std('#4B3627', { roughness: 0.65 }),
      fabric: std('#34505C'),
      fabric2: std('#3F5F6C'),
      leather: std('#B08A62', { roughness: 0.6 }),
      rug: std('#E2D9C6', { roughness: 1 }),
      brass: std('#B8955B', { metalness: 0.6, roughness: 0.35 }),
      shade: std('#F3EDE0', { emissive: lin('#6B5A3A'), emissiveIntensity: 0.3, side: T.DoubleSide }),
      pot: std('#CFC4B4'),
      leaf: std('#5D7D52', { flatShading: true }),
      glass: new T.MeshStandardMaterial({ color: lin('#CFEFF8'), transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false })
    };
    var paintTarget = M.paint.color.clone();
    var floorMat = std('#FFFFFF', { roughness: 0.7 });
    var texCache = {}, maxAniso = renderer.capabilities.getMaxAnisotropy();
    function floorTex(key) {
      if (texCache[key]) return texCache[key];
      var f = B.floors[key], tex = new T.CanvasTexture(B.floorCanvas(key, 1024));
      tex.encoding = T.sRGBEncoding;
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      tex.repeat.set((W + TW) / f.tile, (D + TW) / f.tile);
      tex.anisotropy = maxAniso;
      texCache[key] = tex;
      return tex;
    }
    function setFloor(key) {
      if (!B.floors[key]) return;
      floorMat.map = floorTex(key);
      floorMat.roughness = B.floors[key].rough;
      floorMat.needsUpdate = true;
      kick();
    }

    function faced(x0, x1, y0, y1, z0, z1, f) {
      var arr = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(function (k) {
        var v = f[k];
        return v ? (typeof v === 'string' ? M[v] : v) : M.cut;
      });
      var m = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), arr);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      m.castShadow = true; m.receiveShadow = true;
      scene.add(m);
      return m;
    }
    function add(m, noShadow) { if (noShadow) m.castShadow = false; scene.add(m); return m; }

    // Mur du fond (fenêtre 1,40 × 1,25) et mur de gauche (porte 0,90 × 2,10), coupés comme une maquette.
    var WX0 = 2.9, WX1 = WX0 + S.win.w, WY0 = 0.95, WY1 = WY0 + S.win.h;
    var DZ0 = 2.6, DZ1 = DZ0 + S.door.w, DY1 = S.door.h;
    faced(-TW, WX0, 0, HH, -TW, 0, { px: 'paint', pz: 'paint', nz: 'outer' });
    faced(WX0, WX1, 0, WY0, -TW, 0, { py: 'paint', pz: 'paint', nz: 'outer' });
    faced(WX0, WX1, WY1, HH, -TW, 0, { ny: 'paint', pz: 'paint', nz: 'outer' });
    faced(WX1, W, 0, HH, -TW, 0, { nx: 'paint', pz: 'paint', nz: 'outer' });
    faced(-TW, 0, 0, HH, 0, DZ0, { px: 'paint', nx: 'outer', pz: 'paint' });
    faced(-TW, 0, DY1, HH, DZ0, DZ1, { px: 'paint', nx: 'outer', ny: 'paint' });
    faced(-TW, 0, 0, HH, DZ1, D, { px: 'paint', nx: 'outer', nz: 'paint' });
    faced(-TW, W, -0.24, 0, -TW, D, { py: floorMat }).castShadow = false;

    // Plinthes, menuiseries
    add(boxE(0, W, 0, 0.08, 0, 0.012, M.trim), true);
    add(boxE(0, 0.012, 0, 0.08, 0, DZ0, M.trim), true);
    add(boxE(0, 0.012, 0, 0.08, DZ1, D, M.trim), true);
    add(boxE(-TW / 2 - 0.02, -TW / 2 + 0.02, 0, DY1, DZ0 + 0.01, DZ1 - 0.01, M.trim));
    add(boxE(0, 0.02, 0, DY1 + 0.07, DZ0 - 0.07, DZ0, M.trim), true);
    add(boxE(0, 0.02, 0, DY1 + 0.07, DZ1, DZ1 + 0.07, M.trim), true);
    add(boxE(0, 0.02, DY1, DY1 + 0.07, DZ0 - 0.07, DZ1 + 0.07, M.trim), true);
    add(boxE(-0.06, -0.015, 1.0, 1.03, DZ1 - 0.16, DZ1 - 0.06, M.brass), true);
    var fz0 = -TW / 2 - 0.035, fz1 = -TW / 2 + 0.035;
    add(boxE(WX0, WX1, WY0, WY0 + 0.05, fz0, fz1, M.trim));
    add(boxE(WX0, WX1, WY1 - 0.05, WY1, fz0, fz1, M.trim));
    add(boxE(WX0, WX0 + 0.05, WY0, WY1, fz0, fz1, M.trim));
    add(boxE(WX1 - 0.05, WX1, WY0, WY1, fz0, fz1, M.trim));
    add(boxE((WX0 + WX1) / 2 - 0.025, (WX0 + WX1) / 2 + 0.025, WY0, WY1, fz0, fz1, M.trim));
    var glass = add(boxE(WX0 + 0.05, WX1 - 0.05, WY0 + 0.05, WY1 - 0.05, -TW / 2 - 0.005, -TW / 2 + 0.005, M.glass), true);
    glass.receiveShadow = false;
    add(boxE(WX0 - 0.05, WX1 + 0.05, WY0 - 0.03, WY0, -0.02, 0.07, M.trim));

    // Mobilier
    add(boxE(0.9, 3.5, 0, 0.012, 1.2, 3.1, M.rug), true);
    add(boxE(0.5, 2.7, 0, 0.42, 0.05, 1.0, M.fabric));
    add(boxE(0.5, 2.7, 0.42, 0.84, 0.05, 0.28, M.fabric));
    add(boxE(0.5, 0.68, 0.42, 0.62, 0.05, 1.0, M.fabric));
    add(boxE(2.52, 2.7, 0.42, 0.62, 0.05, 1.0, M.fabric));
    add(boxE(0.7, 1.58, 0.42, 0.53, 0.3, 0.97, M.fabric2));
    add(boxE(1.62, 2.5, 0.42, 0.53, 0.3, 0.97, M.fabric2));
    add(boxE(1.2, 2.2, 0.33, 0.37, 1.55, 2.15, M.wood));
    [[1.25, 1.6], [2.11, 1.6], [1.25, 2.06], [2.11, 2.06]].forEach(function (p) { add(boxE(p[0], p[0] + 0.04, 0, 0.33, p[1], p[1] + 0.04, M.darkWood)); });
    add(boxE(3.3, 4.1, 0, 0.42, 2.0, 2.8, M.leather));
    add(boxE(3.92, 4.1, 0.42, 0.86, 2.0, 2.8, M.leather));
    add(boxE(3.3, 3.92, 0.42, 0.6, 2.0, 2.12, M.leather));
    add(boxE(3.3, 3.92, 0.42, 0.6, 2.68, 2.8, M.leather));
    add(boxE(3.0, 4.2, 0.1, 0.7, 0.02, 0.46, M.darkWood));
    [[3.04, 0.06], [4.12, 0.06], [3.04, 0.38], [4.12, 0.38]].forEach(function (p) { add(boxE(p[0], p[0] + 0.04, 0, 0.1, p[1], p[1] + 0.04, M.darkWood)); });
    var vase = add(new T.Mesh(new T.CylinderGeometry(0.06, 0.08, 0.3, 20), M.pot));
    vase.position.set(3.35, 0.85, 0.24);
    add(boxE(3.7, 3.98, 0.7, 0.76, 0.12, 0.34, M.leather));
    var lampBase = add(new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.03, 24), M.brass));
    lampBase.position.set(0.3, 0.015, 1.35);
    var pole = add(new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1.5, 8), M.brass));
    pole.position.set(0.3, 0.78, 1.35);
    var shade = add(new T.Mesh(new T.CylinderGeometry(0.15, 0.22, 0.28, 28, 1, true), M.shade));
    shade.position.set(0.3, 1.62, 1.35);
    var bulb = new T.PointLight(lin('#FFD9A0'), 0.35, 3.2);
    bulb.position.set(0.3, 1.55, 1.35);
    scene.add(bulb);
    var pot = add(new T.Mesh(new T.CylinderGeometry(0.19, 0.15, 0.42, 24), M.pot));
    pot.position.set(4.75, 0.21, 0.45);
    var leaf1 = add(new T.Mesh(new T.IcosahedronGeometry(0.36, 0), M.leaf));
    leaf1.position.set(4.75, 0.8, 0.45);
    var leaf2 = add(new T.Mesh(new T.IcosahedronGeometry(0.26, 0), M.leaf));
    leaf2.position.set(4.62, 1.12, 0.52);
    // Tableau
    (function () {
      var c = document.createElement('canvas'); c.width = 400; c.height = 240;
      var g = c.getContext('2d');
      g.fillStyle = '#EDE6D8'; g.fillRect(0, 0, 400, 240);
      g.fillStyle = '#C4876A'; g.beginPath(); g.arc(270, 88, 44, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2F4C57'; g.beginPath(); g.moveTo(0, 240); g.lineTo(0, 170); g.quadraticCurveTo(170, 96, 400, 160); g.lineTo(400, 240); g.fill();
      g.fillStyle = '#89AC76'; g.fillRect(0, 205, 400, 35);
      var tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
      add(boxE(0.0, 0.03, 1.2, 1.9, 0.9, 2.0, M.darkWood), true);
      var art = new T.Mesh(new T.PlaneGeometry(1.0, 0.6), new T.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
      art.rotation.y = Math.PI / 2;
      art.position.set(0.032, 1.55, 1.45);
      art.receiveShadow = true;
      scene.add(art);
    })();

    // Lumières : soleil par la fenêtre + lumière d'ambiance
    scene.add(new T.HemisphereLight(lin('#FFFFFF'), lin('#C9C0B2'), 0.62));
    var sunR = new T.DirectionalLight(lin('#FFF0D8'), 0.95);
    sunR.position.set(4.9, 4.4, -5.8);
    sunR.target.position.set(3.0, 0, 1.8);
    sunR.castShadow = true;
    sunR.shadow.mapSize.set(2048, 2048);
    var s2 = sunR.shadow.camera;
    s2.left = -5; s2.right = 5; s2.top = 5; s2.bottom = -5; s2.near = 0.5; s2.far = 20;
    sunR.shadow.bias = -0.0004; sunR.shadow.normalBias = 0.02;
    scene.add(sunR, sunR.target);
    var fillR = new T.DirectionalLight(lin('#EAF4F7'), 0.42);
    fillR.position.set(8, 6, 9);
    scene.add(fillR);

    // Caméra : vue de trois quarts dans l'angle, légère parallaxe au pointeur
    var tgt = new T.Vector3(2.35, 1.0, 1.75), base = { az: 0.78, pol: 1.22 }, cur = { az: 0.78, pol: 1.22 }, want = { az: 0.78, pol: 1.22 };
    var aspect = 1.3, hovering = false, t0 = performance.now();
    vp.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = vp.getBoundingClientRect();
      var nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      hovering = true;
      want.az = base.az - nx * 0.16;
      want.pol = base.pol + ny * 0.05;
      kick();
    });
    vp.addEventListener('pointerleave', function () { hovering = false; want.az = base.az; want.pol = base.pol; });

    var running = false, raf = 0, last = performance.now();
    function frame(now) {
      raf = 0;
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!hovering && !reduce) {
        var t = (now - t0) / 1000;
        want.az = base.az + Math.sin(t * 0.22) * 0.07;
      }
      var k = damp(dt, 3);
      cur.az += (want.az - cur.az) * k;
      cur.pol += (want.pol - cur.pol) * k;
      M.paint.color.lerp(paintTarget, damp(dt, 6));
      var rad = 8.4 * Math.max(1, 1.2 / aspect), sp = Math.sin(cur.pol);
      camera.position.set(tgt.x + rad * sp * Math.sin(cur.az), tgt.y + rad * Math.cos(cur.pol), tgt.z + rad * sp * Math.cos(cur.az));
      camera.lookAt(tgt);
      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function resize() {
      var w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
      renderer.setSize(w, h, false);
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      kick();
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();
    setFloor(floorInput ? floorInput.value : 'chene');
    var inView = false;
    whenVisible(vp, function (v) { inView = v; running = v && !document.hidden; if (running) kick(); });
    document.addEventListener('visibilitychange', function () { running = inView && !document.hidden; if (running) kick(); });

    B.room = {
      setWall: function (hex) { paintTarget = lin(hex); if (reduce) M.paint.color.copy(paintTarget); kick(); },
      setFloor: setFloor
    };
  }

  function boot() { initHero(); initRoom(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
