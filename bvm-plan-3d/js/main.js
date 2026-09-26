/* BVM PLAN 3D — interactions de la page */
(function () {
  'use strict';
  var B = window.BVM || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = B.fmt || function (v, d) { return v.toFixed(d == null ? 2 : d).replace('.', ','); };
  var NB = ' ';
  document.documentElement.lang = 'fr';

  function io(cb, opts) {
    if (!('IntersectionObserver' in window)) return null;
    try { return new IntersectionObserver(cb, Object.assign({ root: document }, opts)); }
    catch (e) { return new IntersectionObserver(cb, opts); }
  }

  /* ---------- Plans SVG ---------- */
  if (B.planSVG) {
    $$('[data-plan]').forEach(function (el) {
      var o = {};
      try { o = JSON.parse(el.getAttribute('data-plan') || '{}'); } catch (e) { /* options par défaut */ }
      el.innerHTML = B.planSVG(o);
    });
  }

  /* ---------- Menu mobile ---------- */
  var burger = $('.burger'), drawer = $('#drawer'), hdr = $('#hdr');
  function setDrawer(open) {
    if (!drawer || !burger) return;
    drawer.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (open) drawer.removeAttribute('inert'); else drawer.setAttribute('inert', '');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) { setDrawer(false); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1040) setDrawer(false); });
  }

  /* ---------- En-tête : masqué en descendant sur mobile ---------- */
  if (hdr) {
    var lastY = window.scrollY, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var open = drawer && drawer.classList.contains('is-open');
        hdr.classList.toggle('is-hidden', window.innerWidth < 1040 && !open && y > lastY && y > 120);
        hdr.classList.toggle('is-scrolled', y > 8);
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Appel à l'action fixe (mobile), hors hero, formulaire et pied de page ---------- */
  var mcta = $('#m-cta');
  if (mcta) {
    var seen = {};
    var ctaObs = io(function (es) {
      es.forEach(function (e) { seen[e.target.id || 'ftr'] = e.isIntersecting; });
      var on = !seen.top && !seen.acces && !seen.ftr;
      mcta.classList.toggle('is-on', on);
      mcta.setAttribute('aria-hidden', String(!on));
      if (on) mcta.removeAttribute('inert'); else mcta.setAttribute('inert', '');
    });
    if (ctaObs) ['#top', '#acces', '.ftr'].forEach(function (s) { var el = $(s); if (el) { seen[el.id || 'ftr'] = true; ctaObs.observe(el); } });
  }

  /* ---------- Lien actif selon la section ---------- */
  var navLinks = $$('.nav a[href^="#"]');
  var spy = io(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  if (spy) navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) spy.observe(s); });

  /* ---------- Apparitions au défilement (contenu visible au repos) ---------- */
  var rv = $$('.rv, .plan-draw');
  if (!reduce) {
    var obs = io(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        if (en.isIntersecting) {
          if (el.dataset.rvSkip) { delete el.dataset.rvSkip; return; }
          el.classList.remove('is-in');
          void el.offsetWidth;
          el.classList.add('is-in');
        } else if (en.boundingClientRect.top > 0) {
          el.classList.remove('is-in');
        }
      });
    }, { rootMargin: '0px 0px 10% 0px' });
    if (obs) {
      var vh = window.innerHeight;
      rv.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh && r.bottom > 0) el.dataset.rvSkip = '1';
        obs.observe(el);
      });
    }
  }

  /* ---------- Étapes (onglets à défilement automatique) ---------- */
  var xp = $('.xp');
  if (xp) {
    var tabs = $$('.xp-tab', xp), scrs = $$('.scr', xp), panes = $$('.pane', xp);
    var app = $('.app', xp), panel = $('#xp-panel'), caption = $('#xp-caption'), view = $('#app-view'), tabList = $('.xp-tabs', xp);
    var VIEWS = ['Modèles', 'Plan 2D', 'Devis'];
    var current = 0;
    var auto = !reduce;
    if (auto) xp.classList.add('is-auto');
    function show(i, focus) {
      current = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, j) {
        var on = j === current;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      scrs.forEach(function (s, j) { s.classList.toggle('is-on', j === current); });
      panes.forEach(function (p, j) { p.classList.toggle('is-on', j === current); });
      if (app) app.dataset.step = String(current);
      if (view) view.textContent = VIEWS[current];
      if (panel) panel.setAttribute('aria-labelledby', tabs[current].id);
      if (caption) caption.textContent = $('.xp-d', tabs[current]).textContent;
      var bar = $('.xp-bar i', tabs[current]);
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      if (tabList && tabList.scrollWidth > tabList.clientWidth) {
        var t = tabs[current];
        tabList.scrollTo({ left: t.offsetLeft - tabList.clientWidth / 2 + t.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
      if (focus) tabs[current].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); show(current + 1, true); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show(current - 1, true); }
        else if (e.key === 'Home') { e.preventDefault(); show(0, true); }
        else if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
      });
      var bar = $('.xp-bar i', t);
      if (bar) bar.addEventListener('animationend', function () { if (auto && i === current) show(current + 1); });
    });
    var hoverPause = false, focusPause = false, outPause = true;
    function syncPause() { xp.classList.toggle('is-paused', hoverPause || focusPause || outPause); }
    if (app) {
      app.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hoverPause = true; syncPause(); } });
      app.addEventListener('pointerleave', function () { hoverPause = false; syncPause(); });
    }
    xp.addEventListener('focusin', function () { focusPause = true; syncPause(); });
    xp.addEventListener('focusout', function () { focusPause = false; syncPause(); });
    var xo = io(function (es) { es.forEach(function (e) { outPause = !e.isIntersecting; syncPause(); }); }, { threshold: 0.35 });
    if (xo) xo.observe(xp); else { outPause = false; }
    syncPause();
    show(0);

  }

  /* ---------- Vignettes de modèles (galerie de l'étape 1) ---------- */
  if (B.houseSVG) {
    $$('[data-house]').forEach(function (el) {
      var p = el.getAttribute('data-house').split(',');
      var num = String(B.models.number(p[0], p[1], p[2])).padStart(2, '0');
      el.innerHTML = B.houseSVG(p[0], p[1], p[2]) + '<span class="mg-n">Modèle ' + num + '</span><span class="mg-l">' + B.models.label(p[0], p[1], p[2]) + '</span>';
    });
  }

  /* ---------- Configurateur de modèles (24 combinaisons) ---------- */
  if (B.models && $('#modeles')) {
    var pick = function (n) { var el = $('input[name="' + n + '"]:checked'); return el ? el.value : ''; };
    var fb = $('#models-fallback');
    var updModel = function () {
      var lv = pick('lv'), gar = pick('gar'), roof = pick('roof');
      var n = String(B.models.number(lv, gar, roof)).padStart(2, '0');
      $('#mod-num').textContent = 'Modèle ' + n + ' / 24';
      $('#mod-label').textContent = B.models.label(lv, gar, roof);
      if (B.modelScene) B.modelScene.build(lv, gar, roof);
      if (fb) fb.innerHTML = B.houseSVG(lv, gar, roof);
    };
    $$('#modeles input[type="radio"]').forEach(function (inp) { inp.addEventListener('change', updModel); });
    updModel();
  }

  /* ---------- Devis d'exemple, recalculé en direct ---------- */
  if (B.quote) {
    var rows = $('#dv-rows'), mini = $('#xp-quote'), shown = {};
    var countTo = function (el, key, value) {
      var from = shown[key + el.dataset.uid] == null ? value : shown[key + el.dataset.uid];
      shown[key + el.dataset.uid] = value;
      if (reduce || from === value) { el.textContent = B.money(value); return; }
      var t0 = performance.now(), dur = 450;
      (function tick(now) {
        var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = B.money(from + (value - from) * e);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    };
    $$('[data-q]').forEach(function (el, i) { el.dataset.uid = String(i); });
    var renderQuote = function (range, animate) {
      var q = B.quote(range);
      var max = Math.max.apply(null, q.lots.map(function (l) { return l.ht; }));
      if (rows) {
        if (!rows.children.length) {
          rows.innerHTML = q.lots.map(function (l) {
            return '<tr><th scope="row">' + l.name + '</th><td class="dv-bar"><i></i></td><td class="dv-amt"></td></tr>';
          }).join('');
        }
        q.lots.forEach(function (l, i) {
          var tr = rows.children[i];
          tr.querySelector('.dv-bar i').style.transform = 'scaleX(' + (l.ht / max).toFixed(3) + ')';
          var amt = tr.querySelector('.dv-amt');
          amt.dataset.uid = 'lot' + i;
          if (animate) countTo(amt, 'lot', l.ht); else { amt.textContent = B.money(l.ht); shown['lot' + amt.dataset.uid] = l.ht; }
        });
      }
      $$('[data-q]').forEach(function (el) {
        var v = q[el.dataset.q];
        if (el.closest('#devis') && animate) countTo(el, el.dataset.q, v);
        else { el.textContent = B.money(v); shown[el.dataset.q + el.dataset.uid] = v; }
      });
      return q;
    };
    if (mini) {
      var base = B.quote('confort');
      mini.innerHTML = base.lots.slice(0, 6).map(function (l) { return '<tr><td>' + l.name + '</td><td>' + B.money(l.ht) + '</td></tr>'; }).join('') +
        '<tr class="more"><td>… ' + (base.lots.length - 6) + ' autres lots</td><td></td></tr>';
    }
    renderQuote('confort', false);
    $$('input[name="gamme"]').forEach(function (inp) { inp.addEventListener('change', function () { renderQuote(inp.value, true); }); });
  }

  /* ---------- Vidéos et captures : vos fichiers, sinon aperçus rendus en 3D ---------- */
  var mediaEls = $$('[data-media]');
  if (mediaEls.length) {
    var fallbacks = [];
    var fillFallback = function (fig) {
      var box = $('.media-box', fig), views = B.views || {};
      var url = views[fig.dataset.shot];
      box.innerHTML = (url ? '<img src="' + url + '" alt="' + (fig.dataset.alt || 'Aperçu de la maquette 3D') + '">' : '') +
        (fig.dataset.media === 'video' ? '<span class="media-soon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Vidéo bientôt en ligne</span>' : '<span class="media-tag">Aperçu</span>');
      fig.classList.add('is-fallback');
    };
    mediaEls.forEach(function (fig) {
      var src = fig.dataset.src;
      var ok = function () {
        var box = $('.media-box', fig);
        if (fig.dataset.media === 'video') {
          var v = document.createElement('video');
          v.controls = true; v.playsInline = true; v.preload = 'metadata';
          if (fig.dataset.poster) v.poster = fig.dataset.poster;
          v.src = src;
          v.setAttribute('aria-label', $('figcaption', fig).textContent);
          box.appendChild(v);
        } else {
          var img = new Image();
          img.loading = 'lazy'; img.decoding = 'async'; img.alt = fig.dataset.alt || ''; img.src = src;
          box.appendChild(img);
        }
      };
      var fail = function () { fallbacks.push(fig); fillFallback(fig); };
      if (!window.fetch || location.protocol === 'file:') { fail(); return; }
      fetch(src, { method: 'HEAD' }).then(function (r) { if (r.ok) ok(); else fail(); }).catch(fail);
    });
    document.addEventListener('bvm:views', function () { fallbacks.forEach(fillFallback); });
  }

  /* ---------- Configurateur matériaux + métrés ---------- */
  var S = B.roomSpec;
  if (S && $('#materiaux')) {
    var floorArea = S.W * S.D, perim = 2 * (S.W + S.D);
    var wallsNet = perim * S.H - S.door.w * S.door.h - S.win.w * S.win.h;
    var paintL = wallsNet * S.coats / S.yield;
    var set = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
    set('q-floor', fmt(floorArea) + NB + 'm²');
    set('q-walls', fmt(wallsNet) + NB + 'm²');
    set('q-paint', '≈' + NB + fmt(paintL, 1) + NB + 'L');
    set('q-plinth', fmt(perim - S.door.w) + NB + 'ml');

    $$('.sw-chip--tex').forEach(function (chip) {
      try { chip.style.backgroundImage = 'url(' + B.floorCanvas(chip.dataset.tex, 96).toDataURL() + ')'; } catch (e) { /* couleur de repli */ }
    });
    function update() {
      var w = $('input[name="wall"]:checked'), f = $('input[name="floor"]:checked');
      if (w) {
        set('q-paint-sub', S.coats + ' couches · ' + w.dataset.code);
        set('cfg-cap-wall', w.dataset.code + ' · ' + w.dataset.name);
      }
      if (f && B.floors[f.value]) {
        var fl = B.floors[f.value];
        set('q-floor-sub', fl.waste ? fmt(floorArea * (1 + fl.waste)) + NB + 'm² à commander (+' + Math.round(fl.waste * 100) + NB + '% de chutes)' : 'Surface à traiter, sans chutes');
        set('cfg-cap-floor', fl.name);
      }
    }
    $$('input[name="wall"]').forEach(function (inp) {
      inp.addEventListener('change', function () { if (B.room) B.room.setWall(inp.dataset.hex); update(); });
    });
    $$('input[name="floor"]').forEach(function (inp) {
      inp.addEventListener('change', function () { if (B.room) B.room.setFloor(inp.value); update(); });
    });
    update();
  }

  /* ---------- Formulaire d'accès anticipé ---------- */
  var form = $('#acces-form');
  if (form) {
    var status = $('.form-status', form);
    var fields = $$('[required]', form);
    var validate = function (el) {
      var v = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
      if (v && el.type === 'email') v = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      var wrap = el.closest('.field, .check');
      if (wrap) wrap.classList.toggle('is-error', !v);
      el.setAttribute('aria-invalid', String(!v));
      return v;
    };
    fields.forEach(function (el) {
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () {
        var w = el.closest('.field, .check');
        if (w && w.classList.contains('is-error')) validate(el);
      });
      el.addEventListener('blur', function () { if (el.type !== 'checkbox') validate(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = fields.filter(function (el) { return !validate(el); });
      status.className = 'form-status';
      if (bad.length) {
        status.textContent = 'Vérifiez les champs signalés.';
        status.classList.add('is-err');
        bad[0].focus();
        return;
      }
      var endpoint = form.getAttribute('data-endpoint');
      var btn = $('button[type="submit"]', form);
      if (!endpoint) {
        status.textContent = "L'inscription en ligne ouvre bientôt : votre demande n'a pas encore été transmise.";
        return;
      }
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      status.textContent = 'Envoi en cours…';
      fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          form.reset();
          status.textContent = 'Merci, votre demande est enregistrée. Nous revenons vers vous à l’ouverture des premières places.';
          status.classList.add('is-ok');
        })
        .catch(function () {
          status.textContent = "L'envoi a échoué. Vérifiez votre connexion puis réessayez.";
          status.classList.add('is-err');
        })
        .then(function () { btn.disabled = false; btn.removeAttribute('aria-busy'); });
    });
  }
})();
