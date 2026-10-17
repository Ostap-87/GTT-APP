// Заставка стартового экрана (вариант B, правки пользователя 17.10.2026): светлый глобус из точек, маршруты из Москвы
// в 9 стран со счётчиком, затем точки слетаются в объёмные буквы GTT из глянцевых шариков. Дизайн и все варианты —
// design/start-screen/index.html (вкладка B); здесь та же сцена без страницы-витрины.
// Собирается в одну HTML-страницу без интернета: npm run splash → src/splash/splash-html.ts (WebView в приложении).
// Со страницы уходят сообщения: count (сколько стран загорелось), stage: 'gtt' (сборка букв), skip, error.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import OUTLINES from './outlines.json';

const CFG = Object.assign({ final: false, globeY: -0.35, letterY: 0.6 }, window.GTT_SPLASH || {});
const REDUCED = CFG.final || matchMedia('(prefers-reduced-motion: reduce)').matches;
const send = (m) => {
  try {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m));
    else if (window.parent !== window) window.parent.postMessage({ gttSplash: m }, '*');
  } catch (e) { /* приложение не слушает — не страшно */ }
};
const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

const COUNTRIES = [
  ['china', 'Китай', 0], ['japan', 'Япония', -8], ['korea', 'Корея', 0], ['thailand', 'Таиланд', -28], ['vietnam', 'Вьетнам', -32],
  ['indonesia', 'Индонезия', 0], ['malaysia', 'Малайзия', 0], ['india', 'Индия', 0], ['uae', 'ОАЭ', 0],
];

// ——— Геометрия стран ———
function inRing(x, y, ring) {
  let ins = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}
function inCountry(lng, lat, key) { return OUTLINES[key].some((p) => inRing(lng, lat, p[0]) && !p.slice(1).some((h) => inRing(lng, lat, h))); }
function bbox(key) { let a = [1e9, 1e9, -1e9, -1e9]; OUTLINES[key].forEach((p) => p[0].forEach(([x, y]) => { a = [Math.min(a[0], x), Math.min(a[1], y), Math.max(a[2], x), Math.max(a[3], y)]; })); return a; }

function label(text) { const el = document.createElement('div'); el.className = 'lbl'; el.textContent = text; el.style.opacity = 0; labelsEl.appendChild(el); return el; }
function placeLabel(el, v3, visible) {
  const p = v3.clone().project(camera);
  el.style.left = `${(p.x * .5 + .5) * 100}%`; el.style.top = `${(-p.y * .5 + .5) * 100}%`;
  el.style.opacity = visible && p.z < 1 ? 1 : 0;
}

// ——— Глобус → GTT ———
const MOSCOW = [37.62, 55.75];
function toSphere(lng, lat, r) { const la = lat * Math.PI / 180, lo = lng * Math.PI / 180; return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)); }
// Мягкая круглая точка для частиц (рисуется на холсте, без внешних файлов)
function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Раскладка букв: текст рисуется крупно (900 px) на скрытом холсте шрифтом заголовков GTT. Контур — ровная цепочка
// шариков по краю буквы, внутри — плотная равномерная укладка без комков и дыр (два прохода). d — шаг между шариками.
const DISPLAY_FONT = '"Sofia Sans Extra Condensed", "Arial Narrow", "Roboto Condensed", sans-serif';
function glyphLayout(text, maxW, maxH, cy, d) {
  const FS = 900, GAP = 0.045 * FS, chars = [...text];
  const c = document.createElement('canvas'); const g = c.getContext('2d');
  const font = `800 ${FS}px ${DISPLAY_FONT}`;
  g.font = font; const ws = chars.map((ch) => g.measureText(ch).width);
  const W = Math.ceil(ws.reduce((a, b) => a + b, 0) + GAP * (chars.length - 1) + FS * 0.2), H = Math.ceil(FS * 1.1);
  c.width = W; c.height = H; g.font = font; g.fillStyle = '#000';
  let x = FS * 0.1; chars.forEach((ch, i) => { g.fillText(ch, x, FS * 0.92); x += ws[i] + GAP; });
  const a = g.getImageData(0, 0, W, H).data, m = new Uint8Array(W * H);
  let x0 = W, x1 = 0, y0 = H, y1 = 0;
  for (let i = 0; i < W * H; i++) if (a[i * 4 + 3] > 127) { m[i] = 1; const px = i % W, py = (i / W) | 0; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
  const sc = Math.min(maxW / (x1 - x0), maxH / (y1 - y0)), r = d / sc; // шаг в пикселях холста
  const edge = [], inner = [];
  for (let y = y0; y <= y1; y++) for (let xx = x0; xx <= x1; xx++) { const i = y * W + xx; if (m[i]) (m[i - 1] && m[i + 1] && m[i - W] && m[i + W] ? inner : edge).push(i); }
  for (let i = inner.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = inner[i]; inner[i] = inner[j]; inner[j] = t; }
  const cell = 0.78 * r / Math.SQRT2, GW = Math.ceil(W / cell) + 3, grid = new Int32Array(GW * (Math.ceil(H / cell) + 3)).fill(-1);
  const px = [], py = [], isEdge = [];
  const tryAdd = (i, minD, e) => {
    const X = i % W + 0.5, Y = ((i / W) | 0) + 0.5, gx = ((X / cell) | 0) + 1, gy = ((Y / cell) | 0) + 1, R2 = minD * minD;
    for (let yy = gy - 2; yy <= gy + 2; yy++) for (let xx = gx - 2; xx <= gx + 2; xx++) { const k = grid[yy * GW + xx]; if (k >= 0 && (px[k] - X) ** 2 + (py[k] - Y) ** 2 < R2) return; }
    grid[gy * GW + gx] = px.length; px.push(X); py.push(Y); isEdge.push(e);
  };
  edge.forEach((i) => tryAdd(i, 0.8 * r, 1)); // по порядку строк — ровный шаг вдоль контура
  const nEdge = px.length;
  inner.forEach((i) => tryAdd(i, r, 0)); inner.forEach((i) => tryAdd(i, 0.82 * r, 0)); // второй проход закрывает просветы
  // Добрать шарики до плотной укладки и «расправить» их: соседи отталкиваются, пока шаг не станет ровным, без просветов
  const want = Math.round(inner.length / (0.866 * r * r) * 1.06);
  for (let k = 0, n = px.length - nEdge; n < want && k < inner.length; k++) { const i = inner[k]; px.push(i % W + Math.random()); py.push(((i / W) | 0) + Math.random()); isEdge.push(0); n++; }
  const RR = 1.04 * r, cell2 = RR, GW2 = Math.ceil(W / cell2) + 2, GH2 = Math.ceil(H / cell2) + 2, head = new Int32Array(GW2 * GH2);
  let next = new Int32Array(0);
  const inside = (X, Y) => { const xi = X | 0, yi = Y | 0; return xi > 0 && yi > 0 && xi < W - 1 && yi < H - 1 && m[yi * W + xi] && m[yi * W + xi - 1] && m[yi * W + xi + 1] && m[(yi - 1) * W + xi] && m[(yi + 1) * W + xi]; };
  const index = () => { head.fill(-1); next = new Int32Array(px.length); for (let i = 0; i < px.length; i++) { const c = ((py[i] / cell2) | 0) * GW2 + ((px[i] / cell2) | 0); next[i] = head[c]; head[c] = i; } };
  const near = (X, Y, fn) => { const gx = (X / cell2) | 0, gy = (Y / cell2) | 0; for (let yy = gy - 1; yy <= gy + 1; yy++) for (let xx = gx - 1; xx <= gx + 1; xx++) { if (xx < 0 || yy < 0 || xx >= GW2 || yy >= GH2) continue; for (let j = head[yy * GW2 + xx]; j >= 0; j = next[j]) fn(j); } };
  const relax = (iters) => {
    for (let it = 0; it < iters; it++) {
      index(); const P = px.length, fx = new Float32Array(P), fy = new Float32Array(P);
      for (let i = 0; i < P; i++) {
        if (isEdge[i]) continue;
        near(px[i], py[i], (j) => {
          if (j === i) return;
          const dx = px[i] - px[j], dy = py[i] - py[j], dd = Math.hypot(dx, dy);
          if (dd >= RR) return;
          if (dd < 1e-3) { fx[i] += Math.random() - 0.5; fy[i] += Math.random() - 0.5; return; }
          const f = (RR - dd) / dd * (isEdge[j] ? 0.7 : 0.35); fx[i] += dx * f; fy[i] += dy * f;
        });
      }
      for (let i = 0; i < P; i++) {
        if (isEdge[i]) continue;
        const lim = 0.3 * r, l = Math.hypot(fx[i], fy[i]), k2 = l > lim ? lim / l : 1;
        for (const h of [1, 0.5]) { const X = px[i] + fx[i] * k2 * h, Y = py[i] + fy[i] * k2 * h; if (inside(X, Y)) { px[i] = X; py[i] = Y; break; } }
      }
    }
  };
  // Просветы, которые остались после «расправления», закрываются новыми шариками, затем укладка ещё раз выравнивается
  const fillHoles = () => {
    index(); let added = 0;
    inner.forEach((i) => {
      const X = i % W + 0.5, Y = ((i / W) | 0) + 0.5; let ok = true;
      near(X, Y, (j) => { if (ok && (px[j] - X) ** 2 + (py[j] - Y) ** 2 < 0.66 * r * r) ok = false; });
      if (!ok) return;
      const c = ((Y / cell2) | 0) * GW2 + ((X / cell2) | 0), n = px.length; px.push(X); py.push(Y); isEdge.push(0);
      const nx = new Int32Array(n + 1); nx.set(next); nx[n] = head[c]; head[c] = n; next = nx; added++;
    });
    return added;
  };
  relax(40);
  for (let pass = 0; pass < 2; pass++) if (fillHoles()) relax(15);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  // Подложка — силуэт букв белым на прозрачном, станет тёмно-синей «тенью» между шариками
  const pc = document.createElement('canvas'); pc.width = x1 - x0 + 1; pc.height = y1 - y0 + 1;
  const pg = pc.getContext('2d'); pg.drawImage(c, -x0, -y0); pg.globalCompositeOperation = 'source-in'; pg.fillStyle = '#fff'; pg.fillRect(0, 0, pc.width, pc.height);
  return { x: px.map((v) => (v - mx) * sc), y: py.map((v) => -(v - my) * sc + cy), edge: isEdge, w: (x1 - x0) * sc, h: (y1 - y0) * sc, plate: pc, pw: pc.width * sc, ph: pc.height * sc };
}
// Мягкое студийное окружение для бликов на шариках (строится на месте, без загрузки файлов)
let envTex = null;
function studioEnv() { if (!envTex) { const pm = new THREE.PMREMGenerator(renderer); envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); } return envTex; }
// Подписи стран Юго-Восточной Азии стоят тесно — разводим их в стороны
const B_LABEL = { korea: 'translate(14%, 10%)', vietnam: 'translate(12%, -105%)', thailand: 'translate(-112%, -55%)', malaysia: 'translate(-110%, -15%)', indonesia: 'translate(-25%, 45%)' };
function makeB() {
  const R = 1.5, MORPH_AT = 5.4, MORPH = 2.6;
  const globe = new THREE.Group(); globe.position.y = CFG.globeY; scene.add(globe);
  const tex = dotTexture();
  // Все точки одним облаком: сначала «форма» глобуса (светлые), потом страны (фирменный синий)
  const pos = [], col = [], isCountry = [];
  const cBg = new THREE.Color('#c2cee0'), cCountry = new THREE.Color('#1a73e8');
  const M = 2300;
  for (let i = 0; i < M; i++) { const y = 1 - (i / (M - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5)); pos.push(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R); col.push(cBg.r, cBg.g, cBg.b); isCountry.push(0); }
  const arcs = [];
  const countryRange = [];
  COUNTRIES.forEach(([key, name], ci) => {
    const [x0, y0, x1, y1] = bbox(key); const step = key === 'korea' || key === 'uae' ? 0.25 : 0.45; let cx = 0, cy = 0, n = 0; const start = pos.length / 3;
    for (let x = x0; x <= x1; x += step) for (let y = y0; y <= y1; y += step) if (inCountry(x, y, key)) { const v = toSphere(x, y, R * 1.006); pos.push(v.x, v.y, v.z); col.push(cBg.r, cBg.g, cBg.b); isCountry.push(1); cx += x; cy += y; n++; }
    countryRange.push([start, pos.length / 3]);
    const target = toSphere(cx / n, cy / n, R);
    const a = toSphere(MOSCOW[0], MOSCOW[1], R), curve = [];
    for (let i = 0; i <= 64; i++) { const t = i / 64; curve.push(a.clone().lerp(target, t).normalize().multiplyScalar(R * (1 + 0.26 * Math.sin(Math.PI * t)))); }
    const lg = new THREE.BufferGeometry().setFromPoints(curve); lg.setDrawRange(0, 0);
    const lmat = new THREE.LineBasicMaterial({ color: 0x1a73e8, transparent: true, opacity: 0.7 });
    globe.add(new THREE.Line(lg, lmat));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 8), new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })); head.visible = false; globe.add(head);
    const el = label(name); if (B_LABEL[key]) el.style.transform = B_LABEL[key];
    arcs.push({ lg, lmat, head, curve, target, el, delay: 1.0 + ci * 0.3, ci });
  });
  const N = pos.length / 3;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const pmat = new THREE.PointsMaterial({ size: 0.05, map: tex, vertexColors: true, transparent: true, depthWrite: false, opacity: 0 });
  const points = new THREE.Points(geo, pmat); globe.add(points);
  // Шар рисуется первым (renderOrder −1) и закрывает точки обратной стороны; при сборке depthWrite выключается,
  // иначе прозрачный шар закрывает нижнюю половину букв
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0xeef4ff, transparent: true, opacity: 0 });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 48, 32), sphereMat); sphere.renderOrder = -1; globe.add(sphere);
  const mos = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshBasicMaterial({ color: 0x0f4fa8 })); mos.position.copy(toSphere(MOSCOW[0], MOSCOW[1], R * 1.01)); globe.add(mos);
  const mosEl = label('Москва');
  // Буквы GTT из объёмных глянцевых шариков: лицевая сторона (контур + заливка) и боковые стенки по контуру
  const STEP = 0.023, DEPTH = 0.07; // шаг между шариками и толщина букв
  let layout = null;
  const makeLayout = () => { if (!layout) layout = glyphLayout('GTT', 2.3, 1.5, CFG.letterY, STEP); };
  const fontReady = document.fonts ? document.fonts.load(`800 100px ${DISPLAY_FONT}`).then(() => setTimeout(makeLayout, 0)) : null;
  const camDir = new THREE.Vector3();
  const lights = new THREE.Group(); scene.add(lights);
  const sweep = new THREE.PointLight(0xffffff, 0, 3.2, 2); sweep.position.set(-2.5, 1.2, 1.1); lights.add(sweep);
  const beads = { group: null, n: 0, done: false };
  let shown = -1;
  const setCounter = (n) => { if (n !== shown) { shown = n; send({ type: 'count', n }); } };
  let phase = 'globe';
  const startMorph = () => {
    phase = 'gtt'; sphereMat.depthWrite = false;
    makeLayout();
    globe.updateMatrixWorld();
    // Шарики: лицевая сторона — все точки раскладки, стенки — контур, повторённый в глубину
    const L = layout, layers = Math.max(2, Math.round(DEPTH / (STEP * 0.9)));
    const tx = [], ty = [], tz = [], wall = [];
    for (let i = 0; i < L.x.length; i++) { tx.push(L.x[i]); ty.push(L.y[i]); tz.push(DEPTH / 2); wall.push(0); }
    for (let j = 1; j <= layers; j++) for (let i = 0; i < L.x.length; i++) if (L.edge[i]) { tx.push(L.x[i]); ty.push(L.y[i]); tz.push(DEPTH / 2 - (DEPTH * j) / layers); wall.push(j); }
    const K = tx.length;
    // Откуда летит каждый шарик: точки глобуса, слева направо — к буквам слева направо (поток без хаоса)
    const p = geo.attributes.position.array, cA = geo.attributes.color.array, v = new THREE.Vector3();
    const src = Array.from({ length: N }, (_, i) => { v.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]).applyMatrix4(globe.matrixWorld); return [v.x, v.y, v.z, i]; });
    src.sort((A, B) => A[0] - B[0]);
    const ord = Array.from({ length: K }, (_, i) => i).sort((A, B) => tx[A] - tx[B] || tz[B] - tz[A]);
    const from = new Float32Array(K * 3), c0 = new Float32Array(K * 3), c1 = new Float32Array(K * 3), seed = new Float32Array(K * 4);
    const deep = new THREE.Color('#115fd6'), brand = new THREE.Color('#1a73e8'), light = new THREE.Color('#4a9bf7'), tmp = new THREE.Color();
    ord.forEach((ti, n) => {
      const sI = src[Math.min(N - 1, Math.floor((n / K) * N))], jit = K > N ? 0.04 : 0;
      from.set([sI[0] + (Math.random() - 0.5) * jit, sI[1] + (Math.random() - 0.5) * jit, sI[2]], ti * 3);
      c0.set([cA[sI[3] * 3], cA[sI[3] * 3 + 1], cA[sI[3] * 3 + 2]], ti * 3);
      // Цвет — плавный фирменный градиент по буквам (снизу-слева глубже, сверху-справа светлее), без случайной пестроты
      const u = clamp01((tx[ti] / L.w + 0.5) * 0.45 + ((ty[ti] - CFG.letterY) / L.h + 0.5) * 0.55);
      if (u < 0.5) tmp.copy(deep).lerp(brand, u * 2); else tmp.copy(brand).lerp(light, (u - 0.5) * 2);
      if (wall[ti]) tmp.multiplyScalar(0.86);
      const jv = 1 + (Math.random() - 0.5) * 0.06; c1.set([tmp.r * jv, tmp.g * jv, tmp.b * jv], ti * 3);
      const xn = tx[ti] / L.w + 0.5;
      seed.set([0.32 * xn + 0.12 * Math.random() + wall[ti] * 0.01, (Math.random() - 0.5) * 1.4, 0.8 + Math.random() * 0.9, 0.5 + Math.random() * 0.5], ti * 4);
    });
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.26, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12, envMap: studioEnv(), envMapIntensity: 0.85 });
    // Лицевые шарики — гладкие (16×12), стенки видны только краем — им хватает 10×8
    const F = L.x.length, group = new THREE.Group(); scene.add(group);
    const inst = (geo2, n) => {
      const m = new THREE.InstancedMesh(geo2, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3); m.instanceColor.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false; group.add(m); return m;
    };
    const front = inst(new THREE.SphereGeometry(1, 16, 12), F), side = inst(new THREE.SphereGeometry(1, 10, 8), K - F);
    const ptex = new THREE.CanvasTexture(L.plate); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 4;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(L.pw, L.ph), new THREE.MeshBasicMaterial({ color: 0x0b4bb3, map: ptex, transparent: true, opacity: 0, depthWrite: false }));
    plate.position.set(0, CFG.letterY, DEPTH / 2 - STEP * 0.45); group.add(plate);
    Object.assign(beads, { group, front, side, plate, F, n: K, from, c0, c1, seed, tx, ty, tz });
    lights.add(new THREE.HemisphereLight(0xffffff, 0xb9cbe8, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(-2.5, 3.5, 6); lights.add(key);
    const rim = new THREE.DirectionalLight(0xcfe3ff, 0.6); rim.position.set(3, -1.5, 2); lights.add(rim);
    send({ type: 'stage', stage: 'gtt' });
  };
  return {
    end: MORPH_AT + MORPH,
    update(t, real) {
      const k = REDUCED ? MORPH_AT + MORPH + 1 : t;
      if (phase === 'globe') {
        pmat.opacity = clamp01(k / 0.8); sphereMat.opacity = 0.92 * clamp01(k / 0.8);
        globe.scale.setScalar(0.84 + 0.16 * easeInOut(clamp01(k / 1.2)));
        globe.rotation.y = -1.55 + Math.sin(t * 0.15) * 0.1;
        globe.rotation.x = 0.5;
        globe.updateMatrixWorld();
        camera.getWorldDirection(camDir);
        const vis = (v) => v.clone().applyMatrix4(globe.matrixWorld).sub(globe.position).normalize().dot(camDir) < -0.15;
        let lit = 0; const colA = geo.attributes.color;
        arcs.forEach((a) => {
          const p = clamp01((k - a.delay) / 0.9);
          a.lg.setDrawRange(0, Math.floor(p * 65));
          a.head.visible = p > 0 && p < 1; if (a.head.visible) a.head.position.copy(a.curve[Math.min(64, Math.floor(p * 64))]);
          const on = clamp01((k - a.delay - 0.75) / 0.4);
          if (on > 0) { lit++; const [s, e] = countryRange[a.ci]; for (let i = s; i < e; i++) colA.setXYZ(i, cBg.r + (cCountry.r - cBg.r) * on, cBg.g + (cCountry.g - cBg.g) * on, cBg.b + (cCountry.b - cBg.b) * on); }
          placeLabel(a.el, a.target.clone().applyMatrix4(globe.matrixWorld), p >= 1 && vis(a.target));
        });
        colA.needsUpdate = true;
        setCounter(lit);
        placeLabel(mosEl, mos.position.clone().applyMatrix4(globe.matrixWorld), k > 0.9 && vis(mos.position));
        if (k >= MORPH_AT && (layout || !fontReady || real > 2)) startMorph();
        return;
      }
      // Сборка в буквы GTT: точки глобуса превращаются в шарики и слетаются, остальные точки, линии и подписи гаснут
      const q = (k - MORPH_AT) / MORPH;
      const fade = clamp01(1 - q * 3);
      sphereMat.opacity = 0.92 * fade; sphere.visible = fade > 0.01; arcs.forEach((a) => { a.lmat.opacity = 0.7 * fade; a.head.visible = false; a.el.style.opacity = 0; });
      mosEl.style.opacity = 0; mos.visible = fade > 0.05; pmat.opacity = fade; points.visible = fade > 0.01;
      const B = beads, RAD = STEP * 0.52;
      const Mf = B.front.instanceMatrix.array, Cf = B.front.instanceColor.array, Ms = B.side.instanceMatrix.array, Cs = B.side.instanceColor.array;
      // после сборки шарики стоят на месте — пересчёт не нужен, двигается только группа
      if (!B.done) for (let i = 0; i < B.n; i++) {
        const dl = B.seed[i * 4], sw = B.seed[i * 4 + 1], lift = B.seed[i * 4 + 2];
        const e = clamp01((q - dl) / 0.56), ee = easeInOut(e);
        const fx = B.from[i * 3], fy = B.from[i * 3 + 1], fz = B.from[i * 3 + 2];
        const arc = Math.sin(Math.PI * ee);
        const X = fx + (B.tx[i] - fx) * ee + arc * sw * 0.35, Y = fy + (B.ty[i] - fy) * ee + arc * 0.15, Z = fz + (B.tz[i] - fz) * ee + arc * lift;
        // при посадке шарик чуть «щёлкает» — подрастает и встаёт на место
        const pop = e > 0.82 ? Math.sin(Math.PI * (e - 0.82) / 0.18) * 0.22 : 0;
        const S = RAD * (0.55 + 0.45 * ee + pop);
        const sd = i >= B.F, M4 = sd ? Ms : Mf, CC = sd ? Cs : Cf, j = sd ? i - B.F : i, o = j * 16; M4[o] = S; M4[o + 5] = S; M4[o + 10] = S; M4[o + 12] = X; M4[o + 13] = Y; M4[o + 14] = Z; M4[o + 15] = 1;
        const ce = clamp01(e * 1.4);
        CC[j * 3] = B.c0[i * 3] + (B.c1[i * 3] - B.c0[i * 3]) * ce; CC[j * 3 + 1] = B.c0[i * 3 + 1] + (B.c1[i * 3 + 1] - B.c0[i * 3 + 1]) * ce; CC[j * 3 + 2] = B.c0[i * 3 + 2] + (B.c1[i * 3 + 2] - B.c0[i * 3 + 2]) * ce;
      }
      if (!B.done) { [B.front, B.side].forEach((m) => { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }); if (q > 1.05) B.done = true; }
      B.plate.material.opacity = clamp01((q - 0.8) / 0.25);
      const after = k - MORPH_AT - MORPH;
      B.group.rotation.y = after > 0 ? Math.sin(after * 0.4) * 0.14 : 0;
      // блик проходит по буквам слева направо раз в 6 секунд
      const sw2 = after > 0 ? (after % 6) / 6 : -1;
      sweep.intensity = sw2 >= 0 ? 2.2 * Math.sin(Math.PI * clamp01(sw2 / 0.6)) : 0;
      sweep.position.x = -2.2 + 4.4 * clamp01(sw2 / 0.6);
    },
  };
}

// ——— Рендерер и цикл ———
const canvas = document.getElementById('cv');
const labelsEl = document.getElementById('labels');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { renderer = null; }
if (!renderer) send({ type: 'error', message: 'WebGL недоступен' });
else {
  // Не меньше 2x даже на обычных экранах: мелкие шарики букв сглаживаются, а не рябят
  renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio || 1, 2), 3));
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100); camera.position.set(0, 0, 9.6); camera.lookAt(0, 0, 0);
  const resize = () => { const w = innerWidth, h = innerHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();
  const variant = makeB();
  let t0 = performance.now(), shift = 0, pausedAt = 0;
  // Касание — сразу к готовым буквам
  addEventListener('pointerdown', () => { const t = (performance.now() - t0) / 1000 + shift; if (t < variant.end) { shift += variant.end - t; send({ type: 'skip' }); } });
  // Экран закрыт другим — не рисуем; время анимации на паузе не идёт
  window.GTT_SPLASH_PAUSE = (p) => { if (p && !pausedAt) pausedAt = performance.now(); else if (!p && pausedAt) { t0 += performance.now() - pausedAt; pausedAt = 0; } };
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (pausedAt || document.hidden) return;
    const real = (now - t0) / 1000;
    variant.update(real + shift, real);
    renderer.render(scene, camera);
  };
  requestAnimationFrame(loop);
  send({ type: 'ready' });
}
