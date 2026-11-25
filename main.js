/* =========================================================
   守夜 · 原型 v3 — 一天，和一天之后
   ========================================================= */

(function () {
  'use strict';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var PARAMS = new URLSearchParams(location.search);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function rr(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.lineTo(a + w - r, b);
    x.quadraticCurveTo(a + w, b, a + w, b + r);
    x.lineTo(a + w, b + h - r);
    x.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
    x.lineTo(a + r, b + h);
    x.quadraticCurveTo(a, b + h, a, b + h - r);
    x.lineTo(a, b + r);
    x.quadraticCurveTo(a, b, a + r, b);
    x.closePath();
  }

  function ellipse(x, cx, cy, rx, ry, rot) {
    x.beginPath();
    x.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2);
  }

  function softShadow(x, cx, cy, rx, ry, a) {
    var g = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
    g.addColorStop(0, 'rgba(88,58,32,' + a + ')');
    g.addColorStop(1, 'rgba(88,58,32,0)');
    x.save();
    x.translate(cx, cy); x.scale(1, ry / Math.max(rx, ry)); x.translate(-cx, -cy);
    x.fillStyle = g;
    x.beginPath(); x.arc(cx, cy, Math.max(rx, ry), 0, 6.3); x.fill();
    x.restore();
  }

  function noiseTile(n) {
    var c = document.createElement('canvas');
    c.width = c.height = n;
    var x = c.getContext('2d');
    var img = x.createImageData(n, n);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = 200 + Math.random() * 55;
      img.data[i] = v; img.data[i + 1] = v - 5; img.data[i + 2] = v - 16;
      img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  var NOISE = noiseTile(96);

  /* ---------- 那张脸 ---------- */

  var FACE = (function () {
    var S = 512;
    var c = document.createElement('canvas');
    c.width = c.height = S;
    var x = c.getContext('2d');
    var R = S * 0.64;

    x.save();
    x.translate(S * 0.5, S * 0.5);
    x.rotate(-0.12);

    var g = x.createRadialGradient(-R * 0.28, -R * 0.4, R * 0.05, 0, 0, R * 1.15);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.34, '#d8cbb8');
    g.addColorStop(0.6, '#5f5548');
    g.addColorStop(0.82, '#161311');
    g.addColorStop(1, '#000');
    x.fillStyle = g;
    x.beginPath(); x.ellipse(0, 0, R * 0.74, R, 0, 0, 6.3); x.fill();

    var sh = x.createLinearGradient(-R * 0.3, 0, R * 0.8, R * 0.3);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(0.5, 'rgba(0,0,0,.5)');
    sh.addColorStop(1, 'rgba(0,0,0,.95)');
    x.fillStyle = sh;
    x.beginPath(); x.ellipse(0, 0, R * 0.74, R, 0, 0, 6.3); x.fill();

    x.fillStyle = '#000';
    x.beginPath(); x.ellipse(-R * 0.30, -R * 0.16, R * 0.25, R * 0.19, -0.1, 0, 6.3); x.fill();
    x.beginPath(); x.ellipse(R * 0.32, -R * 0.20, R * 0.27, R * 0.16, 0.1, 0, 6.3); x.fill();
    x.beginPath(); x.ellipse(R * 0.03, R * 0.44, R * 0.20, R * 0.30, 0.05, 0, 6.3); x.fill();
    x.restore();

    return c;
  })();

  /* ---------- 四束光 ---------- */

  var LIGHTS = [
    {
      time: '09:12', note: '早上有一点雾',
      wallTop: '#f8efe2', wallBot: '#efe4d2',
      floorTop: '#d9bc9a', floorBot: '#b9926d',
      sky: '#fdf8ec', skyAlpha: 0.95, g1: '255,250,238', g2: '255,246,226', ga: 0.72,
      shaft: 0.20, shaftRGB: '255,238,196', lamp: 0.0, vignette: 0.12, warm: 0.0,
      shadowX: 0.055, shadowLen: 1.5, shadowA: 0.13, pool: 0.0, dim: 0, vigRGB: '120,85,50'
    },
    {
      time: '15:42', note: '画面有点软，是正常的',
      wallTop: '#f8ecd8', wallBot: '#eeddc2',
      floorTop: '#d9b489', floorBot: '#b3865a',
      sky: '#fffaef', skyAlpha: 1.0, g1: '255,248,232', g2: '255,242,214', ga: 0.85,
      shaft: 0.32, shaftRGB: '255,238,196', lamp: 0.0, vignette: 0.15, warm: 0.02,
      shadowX: 0.032, shadowLen: 1.1, shadowA: 0.16, pool: 0.12, dim: 0, vigRGB: '120,85,50'
    },
    {
      time: '19:05', note: '灯已经开了',
      wallTop: '#e8cfae', wallBot: '#cda87f',
      floorTop: '#b2845b', floorBot: '#7f5b39',
      sky: '#7d8894', skyAlpha: 0.9, g1: '150,162,176', g2: '140,152,166', ga: 0.16,
      shaft: 0.0, shaftRGB: '255,238,196', lamp: 1.0, vignette: 0.30, warm: 0.06,
      shadowX: 0.0, shadowLen: 0.62, shadowA: 0.30, pool: 0.55, dim: 0, vigRGB: '90,58,30'
    },
    {
      time: '23:40', note: '画面里没有人',
      wallTop: '#252a30', wallBot: '#1d2227',
      floorTop: '#26211b', floorBot: '#171410',
      sky: '#111c28', skyAlpha: 0.9, g1: '96,126,158', g2: '84,110,140', ga: 0.30,
      shaft: 0.05, shaftRGB: '120,156,196', lamp: 0.0, vignette: 0.50, warm: 0,
      shadowX: 0.035, shadowLen: 1.25, shadowA: 0.34, pool: 0.0, dim: 0.86, vigRGB: '0,0,0'
    }
  ];

  /* ---------- 狗 ---------- */

  function drawDog(x, w, h, LEN, baseY, L, breath) {
    var cx = w * 0.475;

    softShadow(x, cx + w * L.shadowX * 1.2, baseY + LEN * 0.012,
      LEN * 0.42 * L.shadowLen, LEN * 0.05, L.shadowA);
    x.fillStyle = 'rgba(84,56,30,' + (0.10 + L.shadowA * 0.55).toFixed(2) + ')';
    ellipse(x, cx - LEN * 0.02, baseY + LEN * 0.006, LEN * 0.30, LEN * 0.020);
    x.fill();

    x.save();
    x.translate(cx, baseY);
    x.scale(1, breath);

    var BODY = '#a8804f', HEAD = '#b48c5e', SNOUT = '#c49b6c', EAR = '#87623e', DARK = '#4a3726';

    x.strokeStyle = BODY;
    x.lineWidth = LEN * 0.055;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(LEN * 0.33, -LEN * 0.16);
    x.quadraticCurveTo(LEN * 0.46, -LEN * 0.14, LEN * 0.44, -LEN * 0.02);
    x.stroke();

    x.fillStyle = BODY;
    x.beginPath();
    x.moveTo(-LEN * 0.30, -LEN * 0.02);
    x.quadraticCurveTo(-LEN * 0.35, -LEN * 0.19, -LEN * 0.20, -LEN * 0.21);
    x.quadraticCurveTo(-LEN * 0.02, -LEN * 0.31, LEN * 0.12, -LEN * 0.26);
    x.quadraticCurveTo(LEN * 0.30, -LEN * 0.22, LEN * 0.34, -LEN * 0.10);
    x.quadraticCurveTo(LEN * 0.36, -LEN * 0.01, LEN * 0.24, 0);
    x.lineTo(-LEN * 0.26, 0);
    x.closePath();
    x.fill();

    x.strokeStyle = 'rgba(255,238,204,.35)';
    x.lineWidth = Math.max(1, LEN * 0.012);
    x.beginPath();
    x.moveTo(-LEN * 0.20, -LEN * 0.21);
    x.quadraticCurveTo(-LEN * 0.02, -LEN * 0.31, LEN * 0.12, -LEN * 0.26);
    x.quadraticCurveTo(LEN * 0.30, -LEN * 0.22, LEN * 0.34, -LEN * 0.10);
    x.stroke();

    x.fillStyle = HEAD;
    rr(x, -LEN * 0.50, -LEN * 0.075, LEN * 0.16, LEN * 0.062, LEN * 0.03);
    x.fill();

    x.fillStyle = HEAD;
    ellipse(x, -LEN * 0.33, -LEN * 0.125, LEN * 0.115, LEN * 0.092, -0.10);
    x.fill();

    x.fillStyle = SNOUT;
    ellipse(x, -LEN * 0.445, -LEN * 0.085, LEN * 0.085, LEN * 0.052, -0.16);
    x.fill();

    x.fillStyle = EAR;
    x.beginPath();
    x.moveTo(-LEN * 0.285, -LEN * 0.205);
    x.quadraticCurveTo(-LEN * 0.20, -LEN * 0.215, -LEN * 0.225, -LEN * 0.075);
    x.quadraticCurveTo(-LEN * 0.265, -LEN * 0.03, -LEN * 0.30, -LEN * 0.10);
    x.closePath();
    x.fill();

    x.fillStyle = DARK;
    ellipse(x, -LEN * 0.505, -LEN * 0.095, LEN * 0.022, LEN * 0.017, -0.2);
    x.fill();

    x.strokeStyle = DARK;
    x.lineWidth = Math.max(1, LEN * 0.009);
    x.beginPath();
    x.moveTo(-LEN * 0.385, -LEN * 0.152);
    x.quadraticCurveTo(-LEN * 0.36, -LEN * 0.135, -LEN * 0.335, -LEN * 0.15);
    x.stroke();

    x.restore();
  }

  /* ---------- 站着的那个人 ---------- */

  function drawFigure(x, w, h, cx, feetY, hh, a) {
    var headR = hh * 0.070;
    var headY = feetY - hh + headR;
    var neckY = headY + headR * 1.02;
    var shoulderY = neckY + hh * 0.028;
    var hipY = feetY - hh * 0.47;
    var shW = hh * 0.142;
    var waistW = hh * 0.100;
    var hipW = hh * 0.112;

    x.save();
    x.fillStyle = 'rgba(5,6,8,' + a + ')';

    // 腿
    function leg(sign) {
      x.beginPath();
      x.moveTo(cx + sign * hipW * 0.95, hipY - hh * 0.015);
      x.lineTo(cx + sign * hipW * 0.06, hipY - hh * 0.015);
      x.lineTo(cx + sign * hipW * 0.01, feetY);
      x.lineTo(cx + sign * hipW * 0.60, feetY);
      x.closePath();
      x.fill();
    }
    leg(-1); leg(1);

    // 脖子
    x.fillRect(cx - headR * 0.50, neckY - headR * 0.3, headR * 1.00, hh * 0.05);

    // 手臂（先画，压在躯干后面）
    x.strokeStyle = 'rgba(5,6,8,' + a + ')';
    x.lineWidth = hh * 0.040;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(cx - shW * 0.80, shoulderY + hh * 0.045);
    x.lineTo(cx - waistW * 1.05, hipY + hh * 0.055);
    x.stroke();
    x.beginPath();
    x.moveTo(cx + shW * 0.80, shoulderY + hh * 0.045);
    x.lineTo(cx + waistW * 1.05, hipY + hh * 0.055);
    x.stroke();

    // 躯干
    x.fillStyle = 'rgba(5,6,8,' + a + ')';
    x.beginPath();
    x.moveTo(cx - shW * 0.96, shoulderY + hh * 0.006);
    x.quadraticCurveTo(cx - shW * 0.46, shoulderY - hh * 0.014, cx - headR * 0.52, shoulderY - hh * 0.004);
    x.lineTo(cx + headR * 0.52, shoulderY - hh * 0.004);
    x.quadraticCurveTo(cx + shW * 0.46, shoulderY - hh * 0.014, cx + shW * 0.96, shoulderY + hh * 0.006);
    x.quadraticCurveTo(cx + shW * 1.02, shoulderY + hh * 0.10, cx + waistW * 1.02, (shoulderY + hipY) / 2);
    x.quadraticCurveTo(cx + hipW * 1.00, hipY - hh * 0.05, cx + hipW * 0.98, hipY);
    x.lineTo(cx - hipW * 0.98, hipY);
    x.quadraticCurveTo(cx - hipW * 1.00, hipY - hh * 0.05, cx - waistW * 1.02, (shoulderY + hipY) / 2);
    x.quadraticCurveTo(cx - shW * 1.02, shoulderY + hh * 0.10, cx - shW * 0.96, shoulderY + hh * 0.006);
    x.closePath();
    x.fill();

    // 头
    ellipse(x, cx, headY, headR * 0.92, headR * 1.04);
    x.fill();

    if (a > 0.8) {
      x.fillStyle = 'rgba(196,202,210,' + ((a - 0.8) * 2.2).toFixed(3) + ')';
      ellipse(x, cx - headR * 0.34, headY - headR * 0.03, headR * 0.13, headR * 0.075);
      x.fill();
      ellipse(x, cx + headR * 0.34, headY - headR * 0.03, headR * 0.13, headR * 0.075);
      x.fill();
    }

    // 窗外那点冷光（只留在头部边缘）
    x.strokeStyle = 'rgba(140,172,208,' + (a * 0.16) + ')';
    x.lineWidth = Math.max(1, hh * 0.0035);
    x.beginPath();
    x.arc(cx - headR * 0.08, headY, headR * 1.03, Math.PI * 0.90, Math.PI * 1.46);
    x.stroke();

    x.restore();
  }

  /* ---------- 客厅 ---------- */

  function room(x, w, h, t, L, o) {
    o = o || {};
    var HOR = 0.58;

    var wall = x.createLinearGradient(0, 0, 0, h * HOR);
    wall.addColorStop(0, L.wallTop);
    wall.addColorStop(1, L.wallBot);
    x.fillStyle = wall;
    x.fillRect(0, 0, w, h * HOR);

    var wx = w * 0.075, wy = h * 0.13, ww = w * 0.215, wh = h * 0.34;
    var glowR = ww * (0.9 + 0.9 * L.skyAlpha);
    var glow = x.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, glowR);
    glow.addColorStop(0, 'rgba(' + L.g1 + ',' + (L.ga * L.skyAlpha).toFixed(2) + ')');
    glow.addColorStop(0.5, 'rgba(' + L.g2 + ',' + (L.ga * 0.38 * L.skyAlpha).toFixed(2) + ')');
    glow.addColorStop(1, 'rgba(' + L.g2 + ',0)');
    x.fillStyle = glow;
    x.fillRect(wx - ww, wy - wh * 0.7, ww * 3, wh * 2.4);

    x.fillStyle = L.sky;
    rr(x, wx, wy, ww, wh, w * 0.006); x.fill();
    x.strokeStyle = 'rgba(220,200,166,.55)'; x.lineWidth = Math.max(1, w * 0.003);
    rr(x, wx, wy, ww, wh, w * 0.006); x.stroke();
    x.beginPath();
    x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh);
    x.moveTo(wx, wy + wh * 0.44); x.lineTo(wx + ww, wy + wh * 0.44);
    x.stroke();

    x.fillStyle = '#d9c4a1';
    rr(x, w * 0.60, h * 0.15, w * 0.12, h * 0.15, w * 0.004); x.fill();
    x.fillStyle = '#ecdcbf';
    rr(x, w * 0.615, h * 0.165, w * 0.09, h * 0.12, w * 0.003); x.fill();

    // 吊灯
    x.strokeStyle = 'rgba(120,90,55,.35)';
    x.lineWidth = Math.max(1, w * 0.0025);
    x.beginPath(); x.moveTo(w * 0.435, 0); x.lineTo(w * 0.435, h * 0.148); x.stroke();

    var lit = L.lamp > 0.05;
    x.fillStyle = lit ? '#f3e0bd' : '#ddcaa8';
    x.beginPath();
    x.moveTo(w * 0.392, h * 0.212); x.lineTo(w * 0.478, h * 0.212);
    x.lineTo(w * 0.462, h * 0.148); x.lineTo(w * 0.408, h * 0.148);
    x.closePath(); x.fill();
    x.fillStyle = lit ? 'rgba(255,236,196,.55)' : 'rgba(120,92,58,.22)';
    x.beginPath();
    x.ellipse(w * 0.435, h * 0.212, w * 0.043, h * 0.009, 0, 0, 6.3); x.fill();

    if (lit) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      var R = w * (0.14 + 0.10 * L.lamp);
      var lampGlow = x.createRadialGradient(w * 0.435, h * 0.220, 0, w * 0.435, h * 0.220, R);
      lampGlow.addColorStop(0, 'rgba(255,240,208,' + (0.55 * L.lamp).toFixed(2) + ')');
      lampGlow.addColorStop(0.30, 'rgba(255,226,176,' + (0.26 * L.lamp).toFixed(2) + ')');
      lampGlow.addColorStop(0.66, 'rgba(255,216,158,' + (0.08 * L.lamp).toFixed(2) + ')');
      lampGlow.addColorStop(1, 'rgba(255,214,150,0)');
      x.fillStyle = lampGlow;
      x.beginPath(); x.arc(w * 0.435, h * 0.220, R, 0, 6.3); x.fill();
      x.restore();
    }

    var floor = x.createLinearGradient(0, h * HOR, 0, h);
    floor.addColorStop(0, L.floorTop);
    floor.addColorStop(1, L.floorBot);
    x.fillStyle = floor;
    x.fillRect(0, h * HOR, w, h * (1 - HOR));

    x.fillStyle = 'rgba(255,240,214,.45)';
    x.fillRect(0, h * HOR, w, h * 0.012);

    x.strokeStyle = 'rgba(110,76,44,.12)';
    x.lineWidth = 1;
    for (var i = 1; i < 6; i++) {
      var yy = h * (HOR + 0.072 * i);
      x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke();
    }

    // 地毯
    x.fillStyle = '#e8d6b9';
    x.beginPath();
    x.moveTo(w * 0.285, h * 0.705); x.lineTo(w * 0.725, h * 0.705);
    x.lineTo(w * 0.785, h * 0.955); x.lineTo(w * 0.225, h * 0.955);
    x.closePath(); x.fill();
    x.strokeStyle = '#d6bf9d';
    x.lineWidth = Math.max(1, w * 0.004);
    x.beginPath();
    x.moveTo(w * 0.315, h * 0.725); x.lineTo(w * 0.695, h * 0.725);
    x.lineTo(w * 0.745, h * 0.93); x.lineTo(w * 0.265, h * 0.93);
    x.closePath(); x.stroke();

    // 沙发
    softShadow(x, w * (0.78 + L.shadowX), h * 0.755, w * 0.24 * L.shadowLen, h * 0.03, L.shadowA + 0.03);
    x.fillStyle = '#cfc4ad';
    rr(x, w * 0.575, h * 0.395, w * 0.405, h * 0.215, w * 0.014); x.fill();
    x.fillStyle = '#e3d8c2';
    rr(x, w * 0.625, h * 0.425, w * 0.145, h * 0.115, w * 0.012); x.fill();
    rr(x, w * 0.785, h * 0.425, w * 0.145, h * 0.115, w * 0.012); x.fill();
    x.fillStyle = '#ded3bb';
    rr(x, w * 0.545, h * 0.585, w * 0.465, h * 0.115, w * 0.012); x.fill();
    x.fillStyle = '#d3c7ae';
    rr(x, w * 0.545, h * 0.475, w * 0.045, h * 0.225, w * 0.01); x.fill();
    rr(x, w * 0.955, h * 0.475, w * 0.045, h * 0.225, w * 0.01); x.fill();

    // 植物
    softShadow(x, w * (0.345 + L.shadowX * 0.6), h * 0.735, w * 0.055 * L.shadowLen, h * 0.012, L.shadowA);
    x.fillStyle = '#c9a179';
    rr(x, w * 0.315, h * 0.635, w * 0.06, h * 0.10, w * 0.006); x.fill();
    x.fillStyle = '#7f9a6d';
    ellipse(x, w * 0.336, h * 0.585, w * 0.030, h * 0.042, -0.35); x.fill();
    ellipse(x, w * 0.362, h * 0.598, w * 0.026, h * 0.036, 0.45); x.fill();
    ellipse(x, w * 0.320, h * 0.612, w * 0.022, h * 0.030, -0.7); x.fill();

    // 灯下的那摊光
    if (L.pool > 0.01) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      var pool = x.createRadialGradient(w * 0.435, h * 0.86, 0, w * 0.435, h * 0.86, w * 0.30);
      pool.addColorStop(0, 'rgba(255,214,152,' + L.pool.toFixed(2) + ')');
      pool.addColorStop(0.5, 'rgba(255,206,140,' + (L.pool * 0.45).toFixed(2) + ')');
      pool.addColorStop(1, 'rgba(255,206,140,0)');
      x.fillStyle = pool;
      x.beginPath();
      x.ellipse(w * 0.435, h * 0.86, w * 0.30, h * 0.13, 0, 0, 6.3);
      x.fill();
      x.restore();
    }

    // 狗
    if (o.dog !== false) {
      var breath = 1 + Math.sin(t * 1.4) * 0.018;
      drawDog(x, w, h, w * 0.30, h * 0.845, L, breath);
    }

    if (L.shaft > 0.01) {
      x.save();
      x.globalCompositeOperation = 'lighter';
      var shaft = x.createLinearGradient(wx + ww, wy + wh, w * 0.70, h * 0.90);
      shaft.addColorStop(0, 'rgba(' + L.shaftRGB + ',' + L.shaft.toFixed(2) + ')');
      shaft.addColorStop(1, 'rgba(' + L.shaftRGB + ',0)');
      x.fillStyle = shaft;
      x.beginPath();
      x.moveTo(wx + ww * 0.20, wy + wh); x.lineTo(wx + ww, wy + wh);
      x.lineTo(w * 0.72, h * 0.95); x.lineTo(w * 0.30, h * 0.88);
      x.closePath(); x.fill();
      x.restore();
    }

    x.save();
    x.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 24; k++) {
      var p = (t * 0.018 + k * 0.137) % 1;
      var px = w * (0.14 + 0.40 * ((k * 0.37) % 1)) + Math.sin(t * 0.4 + k) * w * 0.008;
      var py = h * (0.22 + p * 0.58);
      var a = (0.05 + 0.10 * L.shaft * 3) * Math.sin(p * Math.PI);
      x.fillStyle = 'rgba(255,248,226,' + Math.max(0, a).toFixed(3) + ')';
      x.beginPath(); x.arc(px, py, Math.max(0.6, w * 0.0015), 0, 6.3); x.fill();
    }
    x.restore();

    // 只有一盏灯的时候，离灯越远越暗
    if (L.lamp > 0.3) {
      var lx = w * 0.435, ly = h * 0.235;
      var fall = x.createRadialGradient(lx, ly, w * 0.08, lx, ly, w * 0.66);
      fall.addColorStop(0, 'rgba(255,255,255,1)');
      fall.addColorStop(0.45, 'rgba(196,164,128,1)');
      fall.addColorStop(1, 'rgba(120,88,58,1)');
      x.save();
      x.globalCompositeOperation = 'multiply';
      x.globalAlpha = 0.55 * L.lamp;
      x.fillStyle = fall;
      x.fillRect(0, 0, w, h);
      x.restore();
    }

    if (L.warm > 0) {
      x.save();
      x.globalCompositeOperation = 'multiply';
      x.globalAlpha = L.warm;
      x.fillStyle = '#ffce96';
      x.fillRect(0, 0, w, h);
      x.restore();
    }

    // 夜里整体压暗，然后把窗那点天光点回来
    if (L.dim > 0) {
      x.save();
      x.globalCompositeOperation = 'multiply';
      x.fillStyle = 'rgba(14,20,30,' + L.dim.toFixed(2) + ')';
      x.fillRect(0, 0, w, h);
      x.restore();

      x.save();
      x.globalCompositeOperation = 'lighter';
      var wg = x.createRadialGradient(wx + ww / 2, wy + wh / 2, 0, wx + ww / 2, wy + wh / 2, ww * 2.2);
      wg.addColorStop(0, 'rgba(64,100,142,.40)');
      wg.addColorStop(0.45, 'rgba(52,84,120,.13)');
      wg.addColorStop(1, 'rgba(52,84,120,0)');
      x.fillStyle = wg;
      x.fillRect(wx - ww * 1.6, wy - wh, ww * 4.2, wh * 3.2);
      x.restore();

      x.fillStyle = '#0c141d';
      rr(x, wx, wy, ww, wh, w * 0.006); x.fill();
      x.strokeStyle = 'rgba(126,156,192,.30)';
      x.lineWidth = Math.max(1, w * 0.003);
      rr(x, wx, wy, ww, wh, w * 0.006); x.stroke();
      x.beginPath();
      x.moveTo(wx + ww / 2, wy); x.lineTo(wx + ww / 2, wy + wh);
      x.moveTo(wx, wy + wh * 0.44); x.lineTo(wx + ww, wy + wh * 0.44);
      x.stroke();
    }

    // 人（画在压暗之后，否则会被一起压没）
    if (o.figure > 0) {
      var fh = h * o.figH;
      drawFigure(x, w, h, w * o.figX, h * o.figY, fh, o.figure);
    }
  }

  /* ---------- 一帧画面 ---------- */

  function Feed(cv, getState) {
    this.cv = cv;
    this.ctx = cv.getContext('2d');
    this.getState = getState;
    this.W = 0; this.H = 0; this.pat = null;
    this.on = false;
    this.t0 = performance.now();
    this.resize();
  }

  Feed.prototype.resize = function () {
    var r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var q = this.cv.classList.contains('fill') ? 1 : 0.85;
    this.W = Math.max(320, Math.round(r.width * q));
    this.H = Math.max(200, Math.round(r.height * q));
    this.cv.width = this.W;
    this.cv.height = this.H;
    this.pat = null;
  };

  Feed.prototype.draw = function () {
    if (!this.W || !this.H) return;
    var ctx = this.ctx, W = this.W, H = this.H;
    var st = this.getState();
    var t = (performance.now() - this.t0) / 1000;

    ctx.globalAlpha = 1;
    room(ctx, W, H, t, st.light, st.opts || st);

    if (!this.pat) this.pat = ctx.createPattern(NOISE, 'repeat');
    ctx.save();
    ctx.globalAlpha = st.grain === undefined ? 0.05 : st.grain;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = this.pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    var vg = ctx.createRadialGradient(W * 0.5, H * 0.48, Math.min(W, H) * 0.46, W * 0.5, H * 0.5, Math.max(W, H) * 0.82);
    vg.addColorStop(0, 'rgba(120,85,50,0)');
    vg.addColorStop(1, 'rgba(' + (st.light.vigRGB || '120,85,50') + ',' + st.light.vignette + ')');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    if (st.face && st.face.a > 0.01) {
      if (st.face.blank) {
        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, W, H);
      }
      var fs = st.face.s * H;
      var fx = st.face.x * W, fy = st.face.y * H;
      ctx.save();
      ctx.globalAlpha = st.face.a;
      ctx.filter = 'blur(' + Math.max(1, fs * 0.008).toFixed(1) + 'px) contrast(1.42) brightness(1.05)';
      ctx.drawImage(FACE, fx - fs / 2, fy - fs / 2, fs, fs);
      ctx.filter = 'none';
      ctx.globalAlpha = st.face.a * 0.34;
      ctx.drawImage(FACE, fx - fs / 2 - fs * 0.016, fy - fs / 2, fs, fs);
      ctx.restore();
    }
  };

  Feed.prototype.start = function () {
    var self = this;
    if (this.on) return;
    this.on = true;
    (function loop() {
      if (!self.on) return;
      self.draw();
      requestAnimationFrame(loop);
    })();
  };

  Feed.prototype.stop = function () { this.on = false; };

  /* ---------- 声音 ---------- */

  var A = {
    ready: false, level: 0, beatAt: 0, holdUntil: 0,

    init: function (ctx) {
      if (this.ready) return true;
      var C = window.AudioContext || window.webkitAudioContext;
      if (!ctx && !C) return false;
      var c = this.ctx = ctx || new C();
      var lim = c.createDynamicsCompressor();
      lim.threshold.value = -6; lim.knee.value = 0; lim.ratio.value = 20;
      lim.attack.value = 0.002; lim.release.value = 0.15;
      lim.connect(c.destination);

      this.master = c.createGain();
      this.master.gain.value = 0.0001;
      this.master.connect(lim);

      // 房间底噪
      var n = 2 * c.sampleRate, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0), last = 0;
      for (var i = 0; i < n; i++) {
        var wn = Math.random() * 2 - 1;
        last = (last + 0.02 * wn) / 1.02;
        d[i] = last * 3.4;
      }
      var src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
      this.room = c.createGain(); this.room.gain.value = 0;
      src.connect(lp); lp.connect(this.room); this.room.connect(this.master);
      src.start();

      var s2 = c.createBufferSource(); s2.buffer = buf; s2.loop = true;
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.6;
      this.air = c.createGain(); this.air.gain.value = 0;
      s2.connect(bp); bp.connect(this.air); this.air.connect(this.master);
      s2.start();

      this.ready = true;
      return true;
    },

    apply: function () {
      if (!this.ready) return;
      var now = this.ctx.currentTime;
      if (now < (this.holdUntil || 0)) return;
      var g = this.level <= 0 ? 0.0001 : 0.02 + 0.30 * Math.pow(this.level, 1.15);
      this.master.gain.setTargetAtTime(g, now, 0.5);
      this.room.gain.setTargetAtTime(0.5 * Math.min(1, this.level * 1.4), now, 0.7);
      this.air.gain.setTargetAtTime(0.10 * Math.max(0, this.level - 0.3), now, 0.9);
    },

    set: function (v) {
      v = clamp(v, 0, 1);
      if (Math.abs(v - this.level) < 0.01) return;
      this.level = v;
      this.apply();
    },

    beat: function () {
      if (!this.ready || this.level < 0.35) return;
      var c = this.ctx, t = c.currentTime, s = 1 - this.level * 0.35;
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(82, t);
      o.frequency.exponentialRampToValueAtTime(28, t + 0.16);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5 * s, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.30);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + 0.34);
    },

    hit: function () {
      if (!this.ready) return;
      var c = this.ctx, t = c.currentTime, self = this;
      var master = this.master;

      this.holdUntil = t + 2.2;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(0.92, t);

      // 曲线：一场硬削波 + 一层幅度量化
      var hard = new Float32Array(1024);
      for (var i = 0; i < 1024; i++) {
        var u = i * 2 / 1024 - 1;
        hard[i] = Math.tanh(u * 6);
      }
      var quant = new Float32Array(2048);
      var STEPS = 13;
      for (var j = 0; j < 2048; j++) {
        var v = j * 2 / 2048 - 1;
        quant[j] = Math.round(v * STEPS) / STEPS;
      }

      // 一段被撕开的尖啸
      function screech(at, dur, gain, base, dt) {
        var shaper = c.createWaveShaper(); shaper.curve = hard; shaper.oversample = '4x';
        var crusher = c.createWaveShaper(); crusher.curve = quant; crusher.oversample = 'none';
        var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2150; bp.Q.value = 0.55;
        var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;

        var g = c.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(gain, at + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);

        var ring = c.createGain(); ring.gain.value = 0;
        var lfo = c.createOscillator(); lfo.type = 'sine';
        lfo.frequency.value = 57 + Math.random() * 38;
        var la = c.createGain(); la.gain.value = 0.45;
        lfo.connect(la); la.connect(ring.gain);
        lfo.start(at); lfo.stop(at + dur + 0.06);

        [1, 1.063, 1.131, 1.356].forEach(function (m) {
          var o = c.createOscillator();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(base * m * dt, at);
          o.frequency.exponentialRampToValueAtTime(base * m * dt * 0.54, at + 0.42);
          o.connect(shaper);
          o.start(at); o.stop(at + dur + 0.06);
        });

        var sq = c.createOscillator();
        sq.type = 'square';
        sq.frequency.setValueAtTime(base * 2.7 * dt, at);
        sq.frequency.exponentialRampToValueAtTime(base * 1.7 * dt, at + 0.3);
        var sqg = c.createGain(); sqg.gain.value = 0.13;
        sq.connect(sqg); sqg.connect(shaper);
        sq.start(at); sq.stop(at + Math.min(dur, 0.55));

        shaper.connect(crusher);
        crusher.connect(bp);
        crusher.connect(hp);
        bp.connect(g); hp.connect(g);
        g.connect(ring);
        ring.connect(master);
      }

      // 一声长的，接着三次断续的重来
      screech(t, 1.3, 1.0, 1180, 1.0);
      screech(t + 0.112, 0.17, 0.78, 1120, 1.07);
      screech(t + 0.205, 0.13, 0.66, 1245, 0.93);
      screech(t + 0.272, 0.10, 0.55, 1055, 1.14);

      // 裂开的瞬态：也被切成碎块
      var nb = c.createBuffer(1, Math.floor(c.sampleRate * 0.32), c.sampleRate);
      var nd = nb.getChannelData(0);
      for (var k = 0; k < nd.length; k++) {
        nd[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / nd.length, 2.2);
      }
      var ns = c.createBufferSource(); ns.buffer = nb;
      var nf = c.createBiquadFilter(); nf.type = 'highpass'; nf.frequency.value = 1200;
      var ng = c.createGain(); ng.gain.value = 0.95;
      var gno = c.createOscillator(); gno.type = 'square'; gno.frequency.value = 53;
      var gng = c.createGain(); gng.gain.value = 0.45;
      var gn = c.createGain(); gn.gain.value = 0.5;
      gno.connect(gng); gng.connect(gn.gain);
      ns.connect(nf); nf.connect(ng); ng.connect(gn); gn.connect(master);
      ns.start(t); gno.start(t); gno.stop(t + 0.34);

      // 落地
      var sub = c.createOscillator(), sg = c.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(64, t);
      sub.frequency.exponentialRampToValueAtTime(24, t + 0.36);
      sg.gain.setValueAtTime(0.0001, t);
      sg.gain.exponentialRampToValueAtTime(0.6, t + 0.007);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      sub.connect(sg); sg.connect(master);
      sub.start(t); sub.stop(t + 0.95);

      setTimeout(function () { self.level = 0; self.apply(); }, 2600);
    }
  };

  /* ---------- 首屏：三个时间 ---------- */

  var heroFeed = document.getElementById('feed');
  var heroLight = 1;

  if (heroFeed) {
    var feed = new Feed(heroFeed, function () {
      return { light: LIGHTS[heroLight], opts: { dog: true }, grain: 0.05 };
    });

    var tabs = Array.prototype.slice.call(document.querySelectorAll('.hero .tab'));
    var timeEl = document.getElementById('cam-time');
    var noteEl = document.getElementById('cam-note');

    function setLabels(i) {
      if (timeEl) timeEl.textContent = LIGHTS[i].time;
      if (noteEl) noteEl.textContent = LIGHTS[i].note;
      tabs.forEach(function (o, k) { o.classList.toggle('is-on', k === i); });
    }

    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (i === heroLight) return;
        heroLight = i;
        setLabels(i);
      });
    });

    if (PARAMS.has('t')) { heroLight = clamp(parseInt(PARAMS.get('t'), 10) || 0, 0, 2); }
    setLabels(heroLight);
    feed.start();

    addEventListener('resize', function () { feed.resize(); });
  }

  /* ---------- 现在：从傍晚到 23:40 ---------- */

  var nowSec = document.querySelector('.now');
  var nowFeed2 = document.getElementById('feed2');
  var tabNight = document.getElementById('tab-night');
  var nowTime = document.getElementById('now-time');
  var nowNote = document.getElementById('now-note');
  var nowH2 = document.getElementById('now-h2');
  var nowSub = document.getElementById('now-sub');
  var nowTabs = Array.prototype.slice.call(document.querySelectorAll('.now .tab'));
  var nowState = { p: 0, night: false, stamp: '' };

  if (nowFeed2 && nowSec) {
    var feed2 = new Feed(nowFeed2, function () {
      var k = nowState.k || 0;
      return {
        grain: k > 0.5 ? 0.028 : 0.05,
        light: LIGHTS[k < 0.5 ? 2 : 3],
        opts: { dog: false, figure: k > 0.5 ? 0.92 : 0, figX: 0.215, figY: 0.895, figH: 0.36 }
      };
    });

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? feed2.start() : feed2.stop(); });
    }, { rootMargin: '200px' });
    io.observe(nowSec);

    addEventListener('resize', function () { feed2.resize(); });
  }

  /* ---------- 终章 ---------- */

  var finSec = document.getElementById('finale');
  var finCv = document.getElementById('feed3');
  var finLine = document.getElementById('fin-line');
  var finHit = document.getElementById('fin-hit');
  var finEnd = document.getElementById('fin-end');
  var finState = { q: 0, fired: false, faceOn: false };

  if (finCv && finSec) {
    var feed3 = new Feed(finCv, function () {
      var q = finState.q;
      var approach = Math.pow(clamp((q - 0.10) / 0.80, 0, 1), 1.7);
      var figX = 0.235 + approach * 0.185;
      var figY = 0.895 + approach * 0.555;
      var figH = 0.30 + approach * 0.78;

      return {
        grain: 0.032,
        light: LIGHTS[3],
        opts: {
          dog: false,
          figure: 0.55 + approach * 0.45,
          figX: figX, figY: figY, figH: figH
        },
        face: finState.faceOn ? { a: 1, x: 0.5, y: 0.5, s: 0.95, blank: true } : null
      };
    });

    var io3 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? feed3.start() : feed3.stop(); });
    }, { rootMargin: '200px' });
    io3.observe(finSec);
    addEventListener('resize', function () { feed3.resize(); });
  }

  /* ---------- 滚动 ---------- */

  var finLines = [
    { at: 0.04, text: '23:40。' },
    { at: 0.17, text: '你还在看。' },
    { at: 0.31, text: '它一直在画面里。' },
    { at: 0.45, text: '只是你从来没有放大。' },
    { at: 0.58, text: '现在放大了。' },
    { at: 0.70, text: '别动。' }
  ];

  function nowLevel() {
    if (!nowSec || !nowState.night) return 0;
    return 0.26 + 0.26 * clamp((nowState.p - 0.32) / 0.68, 0, 1);
  }

  function progressOf(el) {
    var r = el.getBoundingClientRect();
    var vh = innerHeight;
    var total = r.height - vh;
    if (total <= 0) return 0;
    return clamp(-r.top / total, 0, 1);
  }

  var dbgNow = PARAMS.has('nowp') ? parseFloat(PARAMS.get('nowp')) : null;
  var dbgFin = PARAMS.has('finq') ? parseFloat(PARAMS.get('finq')) : null;
  if (PARAMS.has('flat')) document.body.classList.add('flat');

  function tick() {
    requestAnimationFrame(tick);

    // 现在
    if (nowSec && nowFeed2) {
      var p = progressOf(nowSec);
      if (dbgNow !== null) p = dbgNow;
      nowState.p = p;
      nowState.k = clamp((p - 0.34) / 0.14, 0, 1);

      if (tabNight) {
        if (p > 0.015) tabNight.classList.add('in');
        if (p > 0.32 && !nowState.night) {
          nowState.night = true;
          tabNight.classList.add('is-on');
          nowTabs.forEach(function (t) { if (t !== tabNight) t.classList.remove('is-on'); });
          nowTime.textContent = '23:40';
          nowNote.textContent = '画面里没有人';
          nowH2.innerHTML = '23:40。<br>客厅。';
          nowSub.textContent = '灯是关着的。';
        }
        if (p < 0.30 && nowState.night) {
          nowState.night = false;
          nowState.stamp = '';
          tabNight.classList.remove('is-on');
          nowTabs[2].classList.add('is-on');
          nowTime.textContent = '19:05';
          nowNote.textContent = '灯已经开了';
          nowH2.innerHTML = '你家客厅。<br>现在。';
          nowSub.textContent = '灯开着。地毯上什么都没有。';
        }

        // 夜里时间自己在走：23:40 → 03:12
        if (nowState.night) {
          var mins = Math.floor(clamp((p - 0.32) / 0.68, 0, 1) * 212);
          var tt = 23 * 60 + 40 + mins;
          var hh = ('0' + (Math.floor(tt / 60) % 24)).slice(-2);
          var mm = ('0' + (tt % 60)).slice(-2);
          var stamp = hh + ':' + mm;
          if (stamp !== nowState.stamp) {
            nowState.stamp = stamp;
            nowTime.textContent = stamp;
            nowH2.innerHTML = stamp + '。<br>客厅。';
          }
        }
      }
    }

    // 声音还没被浏览器放行时，给一个开关
    var snd = document.getElementById('snd');
    if (snd) {
      var ok = A.ready && A.ctx && A.ctx.state === 'running';
      var fq = finSec ? progressOf(finSec) : 0;
      snd.hidden = ok || !(nowState.night || (fq > 0.02 && fq < 0.80));
    }

    // 终章
    if (finSec && finCv) {
      var q = progressOf(finSec);
      if (dbgFin !== null) q = dbgFin;
      finState.q = q;

      var line = '';
      for (var i = 0; i < finLines.length; i++) {
        if (q > finLines[i].at) line = finLines[i].text;
      }
      if (line && finLine.textContent !== line) {
        finLine.style.opacity = 0;
        setTimeout(function () {
          finLine.textContent = line;
          finLine.style.opacity = 1;
        }, 220);
      }

      if (q > 0.86 && !finState.fired) {
        finState.fired = true;
        finState.faceOn = true;
        finLine.style.opacity = 0;
        if (A.ready) A.hit();
        var nv = document.querySelector('.nav');
        if (nv) { nv.style.transition = 'none'; nv.style.opacity = 0; }

        var finStage = document.querySelector('.fin-stage');
        if (finStage) {
          finStage.classList.add('shake');
          setTimeout(function () { finStage.classList.remove('shake'); }, 640);
        }

        setTimeout(function () {
          finHit.style.transition = 'none';
          finHit.style.background = '#f4f1ea';
          finHit.style.opacity = 1;
          finState.faceOn = false;
          setTimeout(function () {
            finHit.style.background = '#05070a';
            finHit.style.opacity = 1;
            finLine.style.opacity = 0;
          }, 95);
        }, 320);

        setTimeout(function () {
          finHit.style.transition = 'opacity 1s';
          finHit.style.opacity = 1;
          finEnd.style.opacity = 1;
        }, 1050);
      }
      if (q < 0.80 && finState.fired) {
        finState.fired = false;
        finState.faceOn = false;
        finHit.style.transition = 'none';
        finHit.style.opacity = 0;
        finEnd.style.opacity = 0;
      }

      // 音量跟着紧张度走
      document.body.classList.toggle('in-fin', q > 0.015);

      var tension = clamp((q - 0.05) / 0.72, 0, 1);
      if (q > 0.86) tension = 0;
      A.set(Math.max(nowLevel(), tension));
    } else {
      A.set(nowLevel());
    }
  }

  // 心跳
  setInterval(function () {
    if (A.ready && A.level > 0.3) A.beat();
  }, 900);

  // 第一次点击解锁声音
  function unlock() {
    if (!A.ready && !A.init()) return;
    if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume();
    A.apply();
  }
  ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'wheel', 'click'].forEach(function (evn) {
    addEventListener(evn, unlock, { passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (A.ready && A.ctx.state === 'suspended') A.ctx.resume();
  });

  requestAnimationFrame(tick);

  /* ---------- 杂项 ---------- */

  var sndBtn = document.getElementById('snd');
  if (sndBtn) {
    sndBtn.addEventListener('click', function () {
      unlock();
      sndBtn.hidden = true;
    });
  }

  addEventListener('load', function () { window.scrollTo(0, 0); });

  addEventListener('scroll', function () {
    var n = document.querySelector('.nav');
    if (n) n.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  window.__NW = { A: A };

  if (PARAMS.has('shift')) {
    document.querySelector('main').style.marginTop = '-' + (parseInt(PARAMS.get('shift'), 10) || 0) + 'px';
  }
})();
