/* BVM PLAN 3D — projet exemple (maison T4 de plain-pied), plan SVG et textures de sols.
   Toutes les surfaces affichées sur le site sont calculées à partir de ces données. */
(function () {
  'use strict';
  var B = (window.BVM = window.BVM || {});

  var EXT = 0.3, INT = 0.1, H = 2.5;
  var FOOT = { x0: 0, x1: 12, z0: 0, z1: 10 };
  var r2 = function (v) { return Math.round(v * 100) / 100; };
  var fmt = function (v, d) { return v.toFixed(d == null ? 2 : d).replace('.', ','); };
  B.fmt = fmt;

  // Pièces : rectangles d'axes (m). x vers l'est, z vers le sud (z = 0 : façade nord).
  var rooms = [
    { id: 'sejour', name: 'Séjour / cuisine', x0: 0, x1: 7.2, z0: 0, z1: 5.4, floor: 'oak' },
    { id: 'sde', name: "Salle d'eau", x0: 7.2, x1: 12, z0: 0, z1: 1.6, floor: 'tile', minor: true },
    { id: 'suite', name: 'Suite parentale', x0: 7.2, x1: 12, z0: 1.6, z1: 5.4, floor: 'oakLight' },
    { id: 'ch2', name: 'Chambre 2', x0: 0, x1: 3.6, z0: 5.4, z1: 10, floor: 'oakLight' },
    { id: 'hall', name: 'Entrée', x0: 3.6, x1: 12, z0: 5.4, z1: 6.6, floor: 'stone', minor: true },
    { id: 'sdb', name: 'Salle de bains', x0: 3.6, x1: 6.6, z0: 6.6, z1: 10, floor: 'tile' },
    { id: 'ch3', name: 'Chambre 3', x0: 6.6, x1: 12, z0: 6.6, z1: 10, floor: 'oakLight' }
  ];
  function half(v, edge) { return v === edge ? EXT / 2 : INT / 2; }
  rooms.forEach(function (r) {
    r.nx0 = r.x0 + half(r.x0, FOOT.x0); r.nx1 = r.x1 - half(r.x1, FOOT.x1);
    r.nz0 = r.z0 + half(r.z0, FOOT.z0); r.nz1 = r.z1 - half(r.z1, FOOT.z1);
    r.w = r2(r.nx1 - r.nx0); r.d = r2(r.nz1 - r.nz0);
    r.area = r2(r.w * r.d);
    r.cx = (r.nx0 + r.nx1) / 2; r.cz = (r.nz0 + r.nz1) / 2;
  });

  // Murs : axis 'x' = mur courant selon X à z = c ; axis 'z' = mur courant selon Z à x = c.
  // Ouvertures : s/e le long du mur, b/t = allège / linteau (m).
  var walls = [
    { axis: 'x', c: 0, a: -0.15, b: 12.15, t: EXT, ext: true, open: [
      { s: 1.0, e: 3.4, b: 0, t: 2.15, type: 'win' },
      { s: 4.6, e: 6.2, b: 0.95, t: 2.15, type: 'win' },
      { s: 9.4, e: 10.4, b: 1.4, t: 2.15, type: 'win' }] },
    { axis: 'x', c: 10, a: -0.15, b: 12.15, t: EXT, ext: true, open: [
      { s: 0.9, e: 2.5, b: 0.95, t: 2.15, type: 'win' },
      { s: 4.6, e: 5.6, b: 1.3, t: 2.15, type: 'win' },
      { s: 8.4, e: 10.2, b: 0.95, t: 2.15, type: 'win' }] },
    { axis: 'z', c: 0, a: 0.15, b: 9.85, t: EXT, ext: true, open: [
      { s: 1.6, e: 3.4, b: 0.95, t: 2.15, type: 'win' },
      { s: 6.0, e: 7.2, b: 0.95, t: 2.15, type: 'win' }] },
    { axis: 'z', c: 12, a: 0.15, b: 9.85, t: EXT, ext: true, open: [
      { s: 2.6, e: 4.2, b: 0.95, t: 2.15, type: 'win' },
      { s: 5.55, e: 6.45, b: 0, t: 2.15, type: 'door', hinge: 'e', dir: -1 }] },
    { axis: 'z', c: 7.2, a: 0, b: 5.4, t: INT, open: [] },
    { axis: 'x', c: 1.6, a: 7.2, b: 12, t: INT, open: [
      { s: 10.6, e: 11.3, b: 0, t: 2.04, type: 'door', hinge: 'e', dir: -1 }] },
    { axis: 'x', c: 5.4, a: 0, b: 12, t: INT, open: [
      { s: 4.0, e: 5.6, b: 0, t: 2.2, type: 'pass' },
      { s: 8.0, e: 8.83, b: 0, t: 2.04, type: 'door', hinge: 's', dir: -1 }] },
    { axis: 'z', c: 3.6, a: 5.4, b: 10, t: INT, open: [
      { s: 5.6, e: 6.43, b: 0, t: 2.04, type: 'door', hinge: 's', dir: -1 }] },
    { axis: 'x', c: 6.6, a: 3.6, b: 12, t: INT, open: [
      { s: 4.6, e: 5.4, b: 0, t: 2.04, type: 'door', hinge: 's', dir: 1 },
      { s: 9.4, e: 10.23, b: 0, t: 2.04, type: 'door', hinge: 'e', dir: 1 }] },
    { axis: 'z', c: 6.6, a: 6.6, b: 10, t: INT, open: [] }
  ];

  // Mobilier (emprises en m, h = hauteur). m = matériau.
  var furniture = [
    { k: 'rug', x0: 1.0, x1: 3.4, z0: 2.2, z1: 3.6 },
    { k: 'sofa', x0: 1.0, x1: 3.4, z0: 3.75, z1: 4.7, back: 'z1' },
    { k: 'box', m: 'wood', x0: 1.7, x1: 2.7, z0: 2.6, z1: 3.2, h: 0.36 },
    { k: 'box', m: 'dark', x0: 4.2, x1: 6.5, z0: 0.15, z1: 0.8, h: 0.9 },
    { k: 'box', m: 'dark', x0: 6.5, x1: 7.15, z0: 0.15, z1: 0.8, h: 2.2 },
    { k: 'box', m: 'wood', x0: 4.6, x1: 6.4, z0: 1.35, z1: 1.95, h: 0.9 },
    { k: 'table', x0: 4.4, x1: 6.2, z0: 2.75, z1: 3.65, h: 0.75 },
    { k: 'box', m: 'fabric', x0: 4.54, x1: 4.96, z0: 2.3, z1: 2.7, h: 0.46 },
    { k: 'box', m: 'fabric', x0: 5.09, x1: 5.51, z0: 2.3, z1: 2.7, h: 0.46 },
    { k: 'box', m: 'fabric', x0: 5.64, x1: 6.06, z0: 2.3, z1: 2.7, h: 0.46 },
    { k: 'box', m: 'fabric', x0: 4.54, x1: 4.96, z0: 3.7, z1: 4.1, h: 0.46 },
    { k: 'box', m: 'fabric', x0: 5.09, x1: 5.51, z0: 3.7, z1: 4.1, h: 0.46 },
    { k: 'box', m: 'fabric', x0: 5.64, x1: 6.06, z0: 3.7, z1: 4.1, h: 0.46 },
    { k: 'bed', x0: 7.25, x1: 9.25, z0: 2.7, z1: 4.3, head: 'x0' },
    { k: 'box', m: 'wood', x0: 7.25, x1: 7.7, z0: 2.25, z1: 2.65, h: 0.5 },
    { k: 'box', m: 'wood', x0: 7.25, x1: 7.7, z0: 4.35, z1: 4.75, h: 0.5 },
    { k: 'box', m: 'white', x0: 8.0, x1: 10.2, z0: 1.65, z1: 2.25, h: 2.2 },
    { k: 'box', m: 'white', x0: 7.25, x1: 8.35, z0: 0.15, z1: 1.05, h: 0.06 },
    { k: 'glass', x0: 8.33, x1: 8.37, z0: 0.15, z1: 1.05, h: 2.0 },
    { k: 'box', m: 'wood', x0: 8.9, x1: 10.1, z0: 0.15, z1: 0.65, h: 0.85 },
    { k: 'box', m: 'white', x0: 11.25, x1: 11.65, z0: 0.15, z1: 0.8, h: 0.42 },
    { k: 'bed', x0: 0.15, x1: 2.05, z0: 7.9, z1: 9.3, head: 'x0' },
    { k: 'box', m: 'wood', x0: 0.15, x1: 0.55, z0: 9.35, z1: 9.75, h: 0.5 },
    { k: 'box', m: 'wood', x0: 0.4, x1: 1.8, z0: 5.45, z1: 6.05, h: 0.75 },
    { k: 'box', m: 'white', x0: 2.95, x1: 3.55, z0: 7.9, z1: 9.85, h: 2.2 },
    { k: 'box', m: 'wood', x0: 6.8, x1: 7.9, z0: 6.15, z1: 6.55, h: 0.45 },
    { k: 'box', m: 'white', x0: 3.65, x1: 5.35, z0: 9.1, z1: 9.85, h: 0.55 },
    { k: 'box', m: 'wood', x0: 5.95, x1: 6.55, z0: 7.3, z1: 8.7, h: 0.85 },
    { k: 'box', m: 'white', x0: 3.65, x1: 4.3, z0: 7.3, z1: 7.7, h: 0.42 },
    { k: 'bed', x0: 6.65, x1: 8.65, z0: 7.6, z1: 9.2, head: 'x0' },
    { k: 'box', m: 'wood', x0: 6.65, x1: 7.05, z0: 7.15, z1: 7.55, h: 0.5 },
    { k: 'box', m: 'wood', x0: 11.25, x1: 11.85, z0: 7.9, z1: 9.3, h: 0.75 },
    { k: 'box', m: 'white', x0: 10.6, x1: 11.85, z0: 6.65, z1: 7.25, h: 2.2 }
  ];

  var extW = r2(FOOT.x1 - FOOT.x0 + EXT), extD = r2(FOOT.z1 - FOOT.z0 + EXT);
  var shab = r2(rooms.reduce(function (s, r) { return s + r.area; }, 0));
  B.totals = { shab: shab, count: rooms.length, extW: extW, extD: extD, emprise: r2(extW * extD), hsp: H };
  B.H = H; B.rooms = rooms; B.walls = walls; B.furniture = furniture;

  B.wallSpan = function (w) {
    var pad = w.ext ? 0 : w.t / 2;
    return [w.a - pad, w.b + pad];
  };

  // ---------- Plan en SVG (même géométrie que la maquette 3D) ----------
  var n = function (v) { return Math.round(v * 1000) / 1000; };
  function doorPath(w, o) {
    var width = o.e - o.s, h = o.hinge === 's' ? o.s : o.e, other = o.hinge === 's' ? o.e : o.s, d = o.dir, sweep;
    if (w.axis === 'x') {
      sweep = ((d > 0) === (other < h)) ? 1 : 0;
      return 'M' + n(h) + ' ' + n(w.c) + 'L' + n(h) + ' ' + n(w.c + d * width) + 'A' + n(width) + ' ' + n(width) + ' 0 0 ' + sweep + ' ' + n(other) + ' ' + n(w.c);
    }
    sweep = ((d > 0) === (other > h)) ? 1 : 0;
    return 'M' + n(w.c) + ' ' + n(h) + 'L' + n(w.c + d * width) + ' ' + n(h) + 'A' + n(width) + ' ' + n(width) + ' 0 0 ' + sweep + ' ' + n(w.c) + ' ' + n(other);
  }
  function rect(x, y, W, Hh) { return 'M' + n(x) + ' ' + n(y) + 'h' + n(W) + 'v' + n(Hh) + 'h' + n(-W) + 'z'; }
  function cote(x1, y1, x2, y2, label, vertical, hl) {
    var s = '<g class="cote' + (hl ? ' hl' : '') + '">', t = 0.16;
    s += '<line x1="' + n(x1) + '" y1="' + n(y1) + '" x2="' + n(x2) + '" y2="' + n(y2) + '"/>';
    [[x1, y1], [x2, y2]].forEach(function (p) {
      s += '<line x1="' + n(p[0] - t) + '" y1="' + n(p[1] + t) + '" x2="' + n(p[0] + t) + '" y2="' + n(p[1] - t) + '"/>';
    });
    if (vertical) {
      s += '<line x1="12.3" y1="' + n(y1) + '" x2="' + n(x1 + 0.25) + '" y2="' + n(y1) + '"/><line x1="12.3" y1="' + n(y2) + '" x2="' + n(x1 + 0.25) + '" y2="' + n(y2) + '"/>';
      s += '<text x="' + n(x1 - 0.16) + '" y="' + n((y1 + y2) / 2) + '" text-anchor="middle" transform="rotate(-90 ' + n(x1 - 0.16) + ' ' + n((y1 + y2) / 2) + ')">' + label + '</text>';
    } else {
      s += '<line x1="' + n(x1) + '" y1="10.3" x2="' + n(x1) + '" y2="' + n(y1 + 0.25) + '"/><line x1="' + n(x2) + '" y1="10.3" x2="' + n(x2) + '" y2="' + n(y1 + 0.25) + '"/>';
      s += '<text x="' + n((x1 + x2) / 2) + '" y="' + n(y1 - 0.16) + '" text-anchor="middle">' + label + '</text>';
    }
    return s + '</g>';
  }

  B.planSVG = function (o) {
    o = o || {};
    var theme = o.theme || 'ink';
    var s = '<svg class="plan plan--' + theme + (o.floors ? ' plan--floors' : '') + '" viewBox="-0.8 -0.8 15 12.8" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (o.label || 'Plan de niveau de la maison exemple, surface habitable ' + fmt(shab) + ' m²') + '">';
    if (o.floors) rooms.forEach(function (r) {
      s += '<rect class="fl fl-' + r.floor + '" x="' + n(r.nx0) + '" y="' + n(r.nz0) + '" width="' + n(r.w) + '" height="' + n(r.d) + '"/>';
    });
    if (o.furniture) furniture.forEach(function (f) {
      if (f.k === 'glass') return;
      var cls = f.k === 'rug' ? 'furn rug' : 'furn';
      s += '<rect class="' + cls + '" x="' + n(f.x0) + '" y="' + n(f.z0) + '" width="' + n(f.x1 - f.x0) + '" height="' + n(f.z1 - f.z0) + '" rx="0.05"/>';
      if (f.k === 'bed') {
        var pw = (f.z1 - f.z0 - 0.3) / 2;
        s += '<rect class="furn-d" x="' + n(f.x0 + 0.12) + '" y="' + n(f.z0 + 0.1) + '" width="0.4" height="' + n(pw) + '" rx="0.06"/>';
        s += '<rect class="furn-d" x="' + n(f.x0 + 0.12) + '" y="' + n(f.z0 + 0.2 + pw) + '" width="0.4" height="' + n(pw) + '" rx="0.06"/>';
        s += '<line class="furn-d" x1="' + n(f.x0 + 0.75) + '" y1="' + n(f.z0) + '" x2="' + n(f.x0 + 0.75) + '" y2="' + n(f.z1) + '"/>';
      } else if (f.k === 'sofa') {
        s += '<rect class="furn-d" x="' + n(f.x0 + 0.18) + '" y="' + n(f.z0) + '" width="' + n(f.x1 - f.x0 - 0.36) + '" height="' + n(f.z1 - f.z0 - 0.22) + '" rx="0.05"/>';
      }
    });
    var i = 0;
    walls.forEach(function (w, wi) {
      var span = B.wallSpan(w), cur = span[0], hl = o.highlight === wi ? ' hl' : '';
      var segs = [];
      w.open.slice().sort(function (p, q) { return p.s - q.s; }).forEach(function (op) {
        if (op.s > cur) segs.push([cur, op.s]);
        cur = Math.max(cur, op.e);
      });
      if (cur < span[1]) segs.push([cur, span[1]]);
      segs.forEach(function (sg) {
        var d = w.axis === 'x' ? rect(sg[0], w.c - w.t / 2, sg[1] - sg[0], w.t) : rect(w.c - w.t / 2, sg[0], w.t, sg[1] - sg[0]);
        s += '<path class="wall' + hl + '" style="--i:' + (i++) + '" pathLength="1" d="' + d + '"/>';
      });
      w.open.forEach(function (op) {
        if (op.type === 'win') {
          if (w.axis === 'x') {
            s += '<rect class="win" x="' + n(op.s) + '" y="' + n(w.c - w.t / 2) + '" width="' + n(op.e - op.s) + '" height="' + n(w.t) + '"/>';
            s += '<line class="win" x1="' + n(op.s) + '" y1="' + n(w.c) + '" x2="' + n(op.e) + '" y2="' + n(w.c) + '"/>';
          } else {
            s += '<rect class="win" x="' + n(w.c - w.t / 2) + '" y="' + n(op.s) + '" width="' + n(w.t) + '" height="' + n(op.e - op.s) + '"/>';
            s += '<line class="win" x1="' + n(w.c) + '" y1="' + n(op.s) + '" x2="' + n(w.c) + '" y2="' + n(op.e) + '"/>';
          }
        } else if (op.type === 'door' && o.doors !== false) {
          s += '<path class="door" pathLength="1" d="' + doorPath(w, op) + '"/>';
        }
      });
    });
    if (o.labels) rooms.forEach(function (r) {
      var area = fmt(r.area) + ' m²';
      if (r.d < 1.6) {
        s += '<text class="rname sm" x="' + n(r.cx) + '" y="' + n(r.cz + 0.1) + '" text-anchor="middle">' + r.name + ' <tspan class="rarea">' + area + '</tspan></text>';
      } else {
        s += '<text class="rname" x="' + n(r.cx) + '" y="' + n(r.cz - 0.06) + '" text-anchor="middle">' + r.name + '</text>';
        s += '<text class="rarea" x="' + n(r.cx) + '" y="' + n(r.cz + 0.36) + '" text-anchor="middle">' + area + '</text>';
      }
    });
    if (o.cotes) {
      s += cote(-0.15, 11.2, 12.15, 11.2, fmt(extW), false, false);
      s += cote(13.2, -0.15, 13.2, 10.15, fmt(extD), true, o.highlight === 3);
    }
    if (o.cursor) {
      s += '<g class="cursor"><circle cx="12" cy="10.15" r="0.16"/><line x1="12" y1="9.55" x2="12" y2="10.75"/><line x1="11.4" y1="10.15" x2="12.6" y2="10.15"/></g>';
    }
    return s + '</svg>';
  };

  // ---------- Devis d'exemple par lots (maison T4 ci-dessus, construction neuve) ----------
  // f = part « finitions » du lot : c'est elle qui varie le plus selon la gamme choisie.
  B.devis = {
    tva: 0.20,
    ranges: {
      essentielle: { name: 'Essentielle', s: 0.94, f: 0.82 },
      confort: { name: 'Confort', s: 1, f: 1 },
      premium: { name: 'Premium', s: 1.08, f: 1.35 }
    },
    lots: [
      { name: 'Terrassement et fondations', ht: 14200, f: 0 },
      { name: 'Gros œuvre et maçonnerie', ht: 41800, f: 0 },
      { name: 'Charpente et couverture', ht: 17600, f: 0.3 },
      { name: 'Menuiseries extérieures', ht: 13900, f: 0.6 },
      { name: 'Plâtrerie et isolation', ht: 16300, f: 0.3 },
      { name: 'Électricité', ht: 9800, f: 0.5 },
      { name: 'Plomberie et sanitaires', ht: 11200, f: 0.6 },
      { name: 'Chauffage et ventilation', ht: 12400, f: 0.4 },
      { name: 'Carrelage et faïence', ht: 7600, f: 1 },
      { name: 'Revêtements de sols', ht: 5900, f: 1 },
      { name: 'Peinture', ht: 8300, f: 1 }
    ]
  };
  B.quote = function (rangeKey) {
    var R = B.devis.ranges[rangeKey] || B.devis.ranges.confort;
    var lots = B.devis.lots.map(function (l) {
      var mult = (1 - l.f) * R.s + l.f * R.f;
      return { name: l.name, ht: Math.round(l.ht * mult / 100) * 100 };
    });
    var ht = lots.reduce(function (s, l) { return s + l.ht; }, 0);
    var tva = Math.round(ht * B.devis.tva);
    return { lots: lots, ht: ht, tva: tva, ttc: ht + tva, m2: Math.round((ht + tva) / shab) };
  };
  B.money = function (v) { return Math.round(v).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €'; };

  // ---------- Modèles : 3 volumes × 2 garages × 4 toitures = 24 combinaisons ----------
  B.models = {
    levels: [['pp', 'Plain-pied'], ['r1', 'R+1'], ['partiel', 'Étage partiel']],
    garage: [['sans', 'Sans garage'], ['avec', 'Avec garage']],
    roofs: [['tuiles', 'Tuiles'], ['ardoises', 'Ardoises'], ['plat', 'Toit plat'], ['4pans', '4 pans']],
    roofColor: { tuiles: '#B5563A', ardoises: '#3E454C', plat: '#9AA3A6', '4pans': '#A9533A' },
    number: function (lv, gar, roof) {
      var idx = function (arr, k) { for (var i = 0; i < arr.length; i++) if (arr[i][0] === k) return i; return 0; };
      return idx(B.models.levels, lv) * 8 + idx(B.models.garage, gar) * 4 + idx(B.models.roofs, roof) + 1;
    },
    label: function (lv, gar, roof) {
      var get = function (arr, k) { for (var i = 0; i < arr.length; i++) if (arr[i][0] === k) return arr[i][1]; return ''; };
      return get(B.models.levels, lv) + ' · ' + get(B.models.garage, gar).toLowerCase() + ' · ' + get(B.models.roofs, roof).toLowerCase();
    }
  };
  // Élévation de façade simplifiée (vignettes de la galerie de modèles)
  B.houseSVG = function (lv, gar, roof) {
    var col = B.models.roofColor[roof], g = 80, lh = 21, s = '';
    var top = lv === 'pp' ? g - lh : g - 2 * lh;
    function roofOver(x0, x1, y, small) {
      var o = 4, h = small ? 10 : 16;
      if (roof === 'plat') return '<rect x="' + (x0 - 1) + '" y="' + (y - 3) + '" width="' + (x1 - x0 + 2) + '" height="3" fill="' + col + '"/>';
      if (roof === '4pans') return '<path d="M' + (x0 - o) + ' ' + y + 'H' + (x1 + o) + 'L' + (x1 - h * 0.9) + ' ' + (y - h) + 'H' + (x0 + h * 0.9) + 'Z" fill="' + col + '"/>';
      return '<path d="M' + (x0 - o) + ' ' + y + 'H' + (x1 + o) + 'L' + ((x0 + x1) / 2) + ' ' + (y - h - (roof === 'ardoises' ? 5 : 0)) + 'Z" fill="' + col + '"/>';
    }
    function wins(xs, y) {
      return xs.map(function (cx) { return '<rect x="' + (cx - 3.5) + '" y="' + (y + 6) + '" width="7" height="8" fill="#2E3F47"/>'; }).join('');
    }
    var ground = wins([28, 58, 72], g - lh) + '<rect x="40" y="' + (g - 15) + '" width="8" height="15" fill="#4B3627"/>';
    if (gar === 'avec') s += '<rect x="80" y="62" width="24" height="18" fill="#E2DACB" stroke="#0C171B" stroke-width=".8"/><rect x="84" y="67" width="16" height="13" fill="#6B7479"/><rect x="79" y="60" width="26" height="2.5" fill="#9AA3A6"/>';
    if (lv === 'partiel') {
      s += '<rect x="20" y="' + (g - lh) + '" width="60" height="' + lh + '" fill="#EDE6DA" stroke="#0C171B" stroke-width=".8"/>';
      s += roofOver(52, 80, g - lh, true);
      s += '<rect x="20" y="' + top + '" width="32" height="' + lh + '" fill="#EDE6DA" stroke="#0C171B" stroke-width=".8"/>';
      s += roofOver(20, 52, top, false) + wins([29, 43], top) + ground;
    } else {
      s += '<rect x="20" y="' + top + '" width="60" height="' + (g - top) + '" fill="#EDE6DA" stroke="#0C171B" stroke-width=".8"/>';
      s += roofOver(20, 80, top, false) + ground;
      if (lv === 'r1') s += wins([28, 43, 58, 72], top);
    }
    return '<svg viewBox="0 0 120 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><line x1="6" y1="80.5" x2="114" y2="80.5" stroke="#0C171B" stroke-width=".8"/>' + s + '</svg>';
  };

  // ---------- Textures de sols (canvas 2D, tuilables) ----------
  B.floors = {
    chene: { name: 'Chêne clair', waste: 0.10, tile: 2.0, base: '#C8A479', rough: 0.7 },
    noyer: { name: 'Noyer', waste: 0.10, tile: 2.0, base: '#6E4C35', rough: 0.65 },
    beton: { name: 'Béton ciré', waste: 0, tile: 3.0, base: '#B8B4AC', rough: 0.5 },
    ciment: { name: 'Carreaux ciment', waste: 0.10, tile: 0.8, base: '#E6DFD1', rough: 0.6 }
  };
  B.roomSpec = { W: 5.2, D: 4.0, H: 2.5, door: { w: 0.9, h: 2.1 }, win: { w: 1.4, h: 1.25 }, coats: 2, yield: 10 };

  function rng(seed) {
    var s = seed >>> 0;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function shade(hex, amt) {
    var v = parseInt(hex.slice(1), 16), c = [v >> 16, (v >> 8) & 255, v & 255];
    c = c.map(function (x) { return Math.max(0, Math.min(255, Math.round(amt < 0 ? x * (1 + amt) : x + (255 - x) * amt))); });
    return 'rgb(' + c.join(',') + ')';
  }

  B.floorCanvas = function (key, size) {
    size = size || 512;
    var f = B.floors[key], c = document.createElement('canvas');
    c.width = c.height = size;
    var g = c.getContext('2d'), R = rng(key.charCodeAt(0) * 7919 + key.length * 131), px = size / 512;
    if (key === 'chene' || key === 'noyer') {
      var rows = 11, ph = size / rows;
      for (var i = 0; i < rows; i++) {
        var x = -R() * size * 0.5;
        while (x < size) {
          var L = size * (0.28 + R() * 0.42), col = shade(f.base, (R() - 0.5) * 0.18);
          var xs = [x, x - size, x + size];
          xs.forEach(function (ox) { g.fillStyle = col; g.fillRect(ox, i * ph, L, ph); });
          g.strokeStyle = shade(f.base, -0.4); g.globalAlpha = 0.12; g.lineWidth = Math.max(0.6, px * 0.8);
          for (var k = 0; k < 4; k++) {
            var y = i * ph + ph * (0.15 + R() * 0.7), amp = ph * 0.07 * R(), ph0 = R() * 6;
            xs.forEach(function (ox) {
              g.beginPath(); g.moveTo(ox, y);
              for (var t = 0.1; t <= 1.001; t += 0.1) g.lineTo(ox + L * t, y + Math.sin(t * 5 + ph0) * amp);
              g.stroke();
            });
          }
          g.globalAlpha = 1;
          g.fillStyle = 'rgba(38,22,10,.38)';
          xs.forEach(function (ox) { g.fillRect(ox, i * ph, Math.max(1, px), ph); });
          x += L;
        }
        g.fillStyle = 'rgba(38,22,10,.42)';
        g.fillRect(0, i * ph, size, Math.max(1, px));
      }
    } else if (key === 'beton') {
      g.fillStyle = f.base; g.fillRect(0, 0, size, size);
      for (var b = 0; b < 60; b++) {
        var bx = R() * size, by = R() * size, br = size * (0.06 + R() * 0.2), light = R() > 0.5;
        [-size, 0, size].forEach(function (ox) {
          [-size, 0, size].forEach(function (oy) {
            var gr = g.createRadialGradient(bx + ox, by + oy, 0, bx + ox, by + oy, br);
            gr.addColorStop(0, light ? 'rgba(255,255,255,.09)' : 'rgba(60,54,46,.09)');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = gr; g.fillRect(bx + ox - br, by + oy - br, br * 2, br * 2);
          });
        });
      }
      var dots = Math.round(size * size / 80);
      for (var d = 0; d < dots; d++) {
        g.fillStyle = R() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
        g.fillRect(R() * size, R() * size, 1.2 * px, 1.2 * px);
      }
    } else {
      var nT = 4, t2 = size / nT;
      g.fillStyle = f.base; g.fillRect(0, 0, size, size);
      g.fillStyle = '#2F4C57';
      for (var a = 0; a <= nT; a++) for (var e = 0; e <= nT; e++) {
        g.beginPath(); g.arc(a * t2, e * t2, t2 * 0.34, 0, Math.PI * 2); g.fill();
      }
      for (var p = 0; p < nT; p++) for (var q = 0; q < nT; q++) {
        var cx = (p + 0.5) * t2, cy = (q + 0.5) * t2, rr = t2 * 0.2;
        g.fillStyle = '#C4876A';
        g.beginPath(); g.moveTo(cx, cy - rr); g.lineTo(cx + rr, cy); g.lineTo(cx, cy + rr); g.lineTo(cx - rr, cy); g.closePath(); g.fill();
        g.fillStyle = f.base;
        g.beginPath(); g.arc(cx, cy, t2 * 0.06, 0, Math.PI * 2); g.fill();
      }
      g.strokeStyle = 'rgba(40,36,30,.22)'; g.lineWidth = Math.max(1, px * 1.5);
      for (var l = 0; l <= nT; l++) {
        g.beginPath(); g.moveTo(l * t2, 0); g.lineTo(l * t2, size); g.stroke();
        g.beginPath(); g.moveTo(0, l * t2); g.lineTo(size, l * t2); g.stroke();
      }
    }
    return c;
  };
})();
