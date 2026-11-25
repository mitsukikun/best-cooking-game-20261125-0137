// SPDX-License-Identifier: MIT
// render.js — every pixel of Dapur Kilat, drawn in code on one canvas:
// the kitchen, the order board, the stations, the food and the screens.

import { INGREDIENTS, INGREDIENT_ORDER, RECIPES, recipeById } from './state.js';
import { STATIONS, binRect, burnerRect } from './kitchen.js';

const W = 1280;
const H = 800;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function progressBar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    rr(ctx, x, y, Math.max(h, w * frac), h, h / 2);
    ctx.fill();
  }
}

function plateBase(ctx, x, y, r) {
  ctx.fillStyle = '#fbfbf7';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9b896';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8e0cc';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
}

// One ingredient, drawn as food on a little plate. stage: raw | chopped | cooked.
// With noPlate=true only the food itself is drawn (for dishes on a big plate).
export function drawItem(ctx, item, x, y, s, noPlate = false) {
  const ing = INGREDIENTS[item.kind];
  if (!noPlate) plateBase(ctx, x, y, s * 0.55);
  ctx.save();
  ctx.translate(x, y);
  const u = s / 40;
  if (item.kind === 'rice') {
    ctx.fillStyle = item.stage === 'cooked' ? '#f7c948' : '#fff8e7';
    ctx.beginPath();
    ctx.arc(0, -2 * u, 13 * u, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = item.stage === 'cooked' ? '#e8a91c' : '#e8dcc0';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(-9 * u + i * 3 * u, -6 * u + (i % 2) * 3 * u, 1.4 * u, 0, Math.PI * 2);
      ctx.fill();
    }
    if (item.stage === 'cooked') {
      ctx.fillStyle = '#6abe30';
      ctx.fillRect(-8 * u, -10 * u, 4 * u, 2 * u);
      ctx.fillStyle = '#f2a65a';
      ctx.fillRect(3 * u, -8 * u, 4 * u, 2 * u);
    }
  } else if (item.kind === 'noodle') {
    ctx.strokeStyle = item.stage === 'cooked' ? '#e8a91c' : '#f2c94c';
    ctx.lineWidth = 3 * u;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-12 * u, (-4 + i * 5) * u);
      ctx.bezierCurveTo(-6 * u, (-9 + i * 5) * u, 6 * u, (1 + i * 5) * u, 12 * u, (-4 + i * 5) * u);
      ctx.stroke();
    }
  } else if (item.kind === 'chicken') {
    if (item.stage === 'chopped') {
      ctx.fillStyle = '#e07840';
      for (const [dx, dy] of [[-7, -4], [4, -6], [-2, 5], [8, 4]]) {
        ctx.fillRect(dx * u - 4 * u, dy * u - 4 * u, 8 * u, 8 * u);
      }
    } else {
      ctx.fillStyle = item.stage === 'cooked' ? '#c97b2d' : '#f2a65a';
      ctx.beginPath();
      ctx.arc(-2 * u, 0, 10 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff3e0';
      ctx.lineWidth = 4 * u;
      ctx.beginPath();
      ctx.moveTo(6 * u, -4 * u);
      ctx.lineTo(14 * u, -10 * u);
      ctx.stroke();
      ctx.fillStyle = '#fff3e0';
      ctx.beginPath();
      ctx.arc(15 * u, -11 * u, 3 * u, 0, Math.PI * 2);
      ctx.fill();
      if (item.stage === 'cooked') {
        ctx.strokeStyle = '#8a4d12';
        ctx.lineWidth = 1.5 * u;
        ctx.beginPath();
        ctx.arc(-2 * u, 0, 6 * u, 0.3, 2.4);
        ctx.stroke();
      }
    }
  } else if (item.kind === 'veg') {
    if (item.stage === 'chopped') {
      ctx.fillStyle = '#4da32a';
      for (const [dx, dy] of [[-8, -3], [2, -7], [7, 2], [-3, 6]]) {
        ctx.beginPath();
        ctx.arc(dx * u, dy * u, 4.5 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#8ed957';
      ctx.beginPath();
      ctx.arc(2 * u, -7 * u, 2 * u, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#3f9e2c';
      for (const a of [-0.5, 0.4, 1.3]) {
        ctx.save();
        ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(0, -8 * u, 5 * u, 11 * u, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#8ed957';
      ctx.beginPath();
      ctx.ellipse(0, -4 * u, 4 * u, 8 * u, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item.kind === 'egg') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 * u, 10 * u, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = item.stage === 'cooked' ? '#f2b705' : '#ffd94d';
    ctx.beginPath();
    ctx.arc(1 * u, 0, 5.5 * u, 0, Math.PI * 2);
    ctx.fill();
    if (item.stage === 'raw') {
      ctx.strokeStyle = '#d9c48a';
      ctx.lineWidth = 1.5 * u;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14 * u, 10 * u, 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (item.kind === 'tea') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(-7 * u, -12 * u, 14 * u, 24 * u);
    ctx.fillStyle = '#b5651d';
    ctx.fillRect(-5 * u, -6 * u, 10 * u, 16 * u);
    ctx.fillStyle = '#e8f6ff';
    ctx.fillRect(-4 * u, -3 * u, 4 * u, 4 * u);
    ctx.fillRect(1 * u, 3 * u, 4 * u, 4 * u);
    ctx.strokeStyle = '#e94f64';
    ctx.lineWidth = 2.5 * u;
    ctx.beginPath();
    ctx.moveTo(4 * u, -12 * u);
    ctx.lineTo(9 * u, -18 * u);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDish(ctx, recipeId, x, y, s) {
  const recipe = recipeById(recipeId);
  plateBase(ctx, x, y, s * 0.62);
  const comps = recipe.needs;
  const spots = comps.length === 1 ? [[0, 0]] : comps.length === 2 ? [[-11, 0], [11, 0]] : [[-11, -6], [11, -6], [0, 10]];
  comps.forEach((key, i) => {
    const [kind, stage] = key.split(':');
    drawItem(ctx, { kind, stage }, x + spots[i][0] * (s / 40), y + spots[i][1] * (s / 40), s * 0.5, true);
  });
  text(ctx, recipe.name, x, y + s * 0.72, 13, '#5b3a1a');
}

function drawStationFrame(ctx, r, title, accent) {
  ctx.fillStyle = '#8a5a2b';
  rr(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 12);
  ctx.fill();
  ctx.fillStyle = '#c98f4e';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.fillStyle = accent;
  rr(ctx, r.x, r.y, r.w, 34, 10);
  ctx.fill();
  ctx.fillRect(r.x, r.y + 20, r.w, 14);
  text(ctx, title, r.x + r.w / 2, r.y + 17, 16, '#fff');
}

function drawBackground(ctx, state) {
  ctx.fillStyle = '#f7e8c9';
  ctx.fillRect(0, 0, W, H);
  // Wall tiles.
  ctx.fillStyle = '#ffe9b8';
  ctx.fillRect(0, 0, W, 190);
  ctx.strokeStyle = 'rgba(180,130,60,0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 190); ctx.stroke();
  }
  for (let y = 0; y < 190; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Floor.
  ctx.fillStyle = '#e8cfa3';
  ctx.fillRect(0, 190, W, H - 190);
  ctx.strokeStyle = 'rgba(120,80,30,0.18)';
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 190); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 190; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // Route arrows on the floor, hinting the kitchen loop.
  ctx.fillStyle = 'rgba(90,60,20,0.35)';
  const arrows = [[300, 480, '→'], [580, 480, '→'], [860, 480, '→']];
  for (const [x, y, a] of arrows) text(ctx, a, x, y, 34, 'rgba(90,60,20,0.35)');
  void state;
}

function fmtTime(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function drawTopBar(ctx, state) {
  ctx.fillStyle = '#5b3a1a';
  ctx.fillRect(0, 0, W, 62);
  // Drawn pan icon (no emoji — headless fonts may lack colour emoji).
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(44, 32, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b3a1a';
  ctx.beginPath();
  ctx.arc(44, 32, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(58, 29, 22, 6);
  text(ctx, 'DAPUR KILAT', 92, 32, 30, '#ffd94d', 'left');
  text(ctx, 'Skor', 560, 20, 13, '#e8cfa3');
  text(ctx, String(state.score), 560, 44, 26, '#ffffff');
  const comboColor = state.combo >= 3 ? '#ff9d5c' : '#e8cfa3';
  text(ctx, 'Kombo', 700, 20, 13, '#e8cfa3');
  text(ctx, state.combo > 0 ? `x${Math.min(state.combo, 5)}` : '—', 700, 44, 26, comboColor);
  text(ctx, 'Disajikan', 830, 20, 13, '#e8cfa3');
  text(ctx, String(state.served), 830, 44, 26, '#ffffff');
  const urgent = state.shiftLeft <= 30;
  text(ctx, 'SHIFT', 1000, 20, 13, '#e8cfa3');
  text(ctx, fmtTime(state.shiftLeft), 1000, 44, 30, urgent ? '#ff6b5e' : '#ffffff');
  text(ctx, '1-6 bahan · Spasi cincang · Esc jeda', 1260, 32, 13, '#e8cfa3', 'right');
}

function drawOrderBoard(ctx, state) {
  ctx.fillStyle = '#3d2b12';
  rr(ctx, 24, 74, 1232, 108, 12);
  ctx.fill();
  text(ctx, 'PESANAN', 44, 96, 15, '#ffd94d', 'left');
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada pesanan — bersiaplah…', 640, 130, 18, '#e8cfa3');
    return;
  }
  state.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = 150 + i * 275;
    const y = 84;
    const w = 260;
    const h = 88;
    const urgent = order.timeLeft <= 12;
    ctx.fillStyle = urgent ? '#7a2e1d' : '#fff8e7';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    if (urgent) {
      ctx.strokeStyle = '#ff6b5e';
      ctx.lineWidth = 3;
      rr(ctx, x, y, w, h, 10);
      ctx.stroke();
    }
    text(ctx, `#${order.id} ${recipe.name}`, x + 12, y + 18, 15, urgent ? '#ffffff' : '#5b3a1a', 'left');
    text(ctx, recipe.hint, x + 12, y + 40, 12, urgent ? '#ffd9d0' : '#8a6a3a', 'left');
    const frac = Math.max(0, order.timeLeft / order.total);
    progressBar(ctx, x + 12, y + 54, w - 24, 11, frac, frac > 0.5 ? '#6abe30' : frac > 0.25 ? '#f2b705' : '#ff6b5e');
    text(ctx, `${Math.ceil(order.timeLeft)} dtk`, x + w - 12, y + 40, 13, urgent ? '#ff8a7a' : '#5b3a1a', 'right');
    // Mini component chips.
    recipe.needs.forEach((key, j) => {
      const [kind, stage] = key.split(':');
      drawItem(ctx, { kind, stage }, x + 24 + j * 34, y + 76, 18);
    });
  });
}

function drawFridge(ctx) {
  const r = { x: 40, y: 250, w: 260, h: 360 };
  ctx.fillStyle = '#9fc6d8';
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#5b7a8a';
  ctx.lineWidth = 3;
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(r.x, r.y + 200);
  ctx.lineTo(r.x + r.w, r.y + 200);
  ctx.stroke();
  ctx.fillStyle = '#5b7a8a';
  ctx.fillRect(r.x + r.w - 26, r.y + 90, 10, 60);
  ctx.fillRect(r.x + r.w - 26, r.y + 280, 10, 60);
  text(ctx, 'KULKAS', r.x + r.w / 2, r.y + 40, 22, '#2c4a58');
  text(ctx, 'Bahan segar', r.x + r.w / 2, r.y + 70, 14, '#2c4a58');
  text(ctx, 'selalu tersedia', r.x + r.w / 2, r.y + 92, 14, '#2c4a58');
  // Shelves with jars.
  for (let i = 0; i < 3; i++) {
    const y = r.y + 230 + i * 40;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(r.x + 20, y, r.w - 40, 6);
    ctx.fillStyle = ['#f2c94c', '#6abe30', '#f2a65a'][i];
    ctx.beginPath();
    ctx.arc(r.x + 50 + i * 70, y - 12, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'Ambil bahan dari', r.x + r.w / 2, r.y + 328, 13, '#2c4a58');
  text(ctx, 'rak bawah ↓', r.x + r.w / 2, r.y + 346, 13, '#2c4a58');
}

function drawBoardStation(ctx, state) {
  const r = STATIONS.board;
  drawStationFrame(ctx, r, 'TALENAN', '#7a5a1e');
  ctx.fillStyle = '#d9b078';
  rr(ctx, r.x + 30, r.y + 52, r.w - 60, 96, 8);
  ctx.fill();
  ctx.strokeStyle = '#a67c3d';
  ctx.lineWidth = 2;
  rr(ctx, r.x + 30, r.y + 52, r.w - 60, 96, 8);
  ctx.stroke();
  if (state.board.item) {
    drawItem(ctx, state.board.item, r.x + r.w / 2, r.y + 100, 64);
    progressBar(ctx, r.x + 30, r.y + 158, r.w - 60, 12, state.board.progress, '#6abe30');
    text(ctx, state.board.progress >= 1 ? 'Siap diambil!' : 'Cincang…', r.x + r.w / 2, r.y + 178, 13, '#5b3a1a');
  } else {
    text(ctx, 'Letakkan ayam / sayur', r.x + r.w / 2, r.y + 100, 14, '#8a6a3a');
    text(ctx, 'lalu cincang 4×', r.x + r.w / 2, r.y + 122, 14, '#8a6a3a');
  }
}

function drawStoveStation(ctx, state) {
  const r = STATIONS.stove;
  drawStationFrame(ctx, r, 'KOMPOR', '#8a2f1d');
  state.burners.forEach((burner, i) => {
    const b = burnerRect(i);
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 38, 0, Math.PI * 2);
    ctx.fill();
    if (burner.item) {
      if (burner.progress < 1) {
        // Flame licks.
        ctx.fillStyle = '#ff9d2e';
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2 - 14, b.y + b.h / 2 + 18, 8, 0, Math.PI * 2);
        ctx.arc(b.x + b.w / 2 + 12, b.y + b.h / 2 + 20, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      drawItem(ctx, burner.item, b.x + b.w / 2, b.y + b.h / 2 - 6, 56);
      progressBar(ctx, b.x + 4, b.y + b.h - 6, b.w - 8, 10, burner.progress, burner.progress >= 1 ? '#6abe30' : '#ff9d2e');
    } else {
      text(ctx, 'Kosong', b.x + b.w / 2, b.y + b.h / 2, 14, '#999');
    }
  });
}

function drawPlateStation(ctx, state) {
  const r = STATIONS.plate;
  drawStationFrame(ctx, r, 'MEJA SAJI', '#2f6d3a');
  const plate = state.plate;
  if (plate.dish) {
    drawDish(ctx, plate.dish, r.x + r.w / 2, r.y + 98, 80);
    text(ctx, 'SIAP DIANTAR!', r.x + r.w / 2, r.y + 176, 15, '#2f6d3a');
  } else if (plate.components.length > 0) {
    plate.components.forEach((c, i) => {
      drawItem(ctx, c, r.x + 45 + i * 55, r.y + 105, 44);
    });
    const match = RECIPES.find((rc) => rc.needs.length === plate.components.length + 1);
    void match;
    text(ctx, `Rakit: ${plate.components.length}/3 bahan`, r.x + r.w / 2, r.y + 172, 14, '#5b3a1a');
  } else {
    text(ctx, 'Letakkan bahan', r.x + r.w / 2, r.y + 100, 14, '#8a6a3a');
    text(ctx, 'sesuai resep', r.x + r.w / 2, r.y + 122, 14, '#8a6a3a');
    text(ctx, 'di pesanan', r.x + r.w / 2, r.y + 144, 14, '#8a6a3a');
  }
}

function drawWindowStation(ctx, state) {
  const r = STATIONS.window;
  drawStationFrame(ctx, r, 'JENDELA ANTAR', '#5b3a8a');
  ctx.fillStyle = '#2c1a4a';
  rr(ctx, r.x + 16, r.y + 46, r.w - 32, 76, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(r.x + r.w / 2, r.y + 74, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c1a4a';
  ctx.beginPath();
  ctx.arc(r.x + r.w / 2 - 5, r.y + 72, 2.5, 0, Math.PI * 2);
  ctx.arc(r.x + r.w / 2 + 5, r.y + 72, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2c1a4a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(r.x + r.w / 2, r.y + 76, 7, 0.2, Math.PI - 0.2);
  ctx.stroke();
  text(ctx, 'Klik dengan hidangan', r.x + r.w / 2, r.y + 140, 13, '#e8dcff');
  void state;
}

function drawBins(ctx, state) {
  const r = STATIONS.bins;
  ctx.fillStyle = '#6b4a22';
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  text(ctx, 'RAK BAHAN — klik untuk mengambil  (tombol 1–6)', r.x + 16, r.y + 16, 14, '#ffd94d', 'left');
  INGREDIENT_ORDER.forEach((kind, i) => {
    const b = binRect(i);
    const ing = INGREDIENTS[kind];
    ctx.fillStyle = '#f7e8c9';
    rr(ctx, b.x, b.y, b.w, b.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#c9a06a';
    ctx.lineWidth = 2;
    rr(ctx, b.x, b.y, b.w, b.h, 10);
    ctx.stroke();
    drawItem(ctx, { kind, stage: 'raw' }, b.x + 34, b.y + 50, 50);
    text(ctx, ing.name, b.x + 76, b.y + 32, 16, '#5b3a1a', 'left');
    const need = ing.chop ? 'cincang' : ing.cook ? 'masak' : 'langsung saji';
    text(ctx, need, b.x + 76, b.y + 56, 12, '#8a6a3a', 'left');
    text(ctx, `[${i + 1}]`, b.x + b.w - 14, b.y + 18, 12, '#b08a4a', 'right');
  });
  void state;
}

function drawHands(ctx, state, mouse) {
  if (!state.hands) return;
  const label = state.hands.dish
    ? recipeById(state.hands.dish).name
    : `${INGREDIENTS[state.hands.kind].name} (${state.hands.stage === 'raw' ? 'mentah' : state.hands.stage === 'chopped' ? 'cincang' : 'matang'})`;
  ctx.save();
  ctx.globalAlpha = 0.95;
  if (state.hands.dish) {
    drawDish(ctx, state.hands.dish, mouse.x, mouse.y - 30, 64);
  } else {
    drawItem(ctx, state.hands, mouse.x, mouse.y - 30, 56);
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  rr(ctx, mouse.x - 90, mouse.y + 8, 180, 26, 8);
  ctx.fill();
  text(ctx, `Di tangan: ${label}`, mouse.x, mouse.y + 21, 13, '#ffffff');
}

function drawMessage(ctx, state) {
  if (!state.message || state.time > state.messageUntil) return;
  ctx.fillStyle = 'rgba(43,26,8,0.9)';
  ctx.font = 'bold 16px "Trebuchet MS", "Segoe UI", sans-serif';
  const w = ctx.measureText(state.message).width + 40;
  rr(ctx, W / 2 - w / 2, 196, w, 32, 10);
  ctx.fill();
  text(ctx, state.message, W / 2, 212, 16, '#ffd94d');
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(36,26,18,0.82)';
  ctx.fillRect(0, 0, W, H);
  // Drawn pan icon.
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(640, 165, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(36,26,18,0.82)';
  ctx.beginPath();
  ctx.arc(640, 165, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(678, 158, 56, 14);
  text(ctx, 'DAPUR KILAT', 640, 260, 64, '#ffd94d');
  text(ctx, 'Game masak cepat — layani pesanan sebelum waktunya habis!', 640, 310, 22, '#ffffff');
  text(ctx, 'Ambil bahan → cincang di talenan → masak di kompor → rakit di meja saji → antar!', 640, 350, 18, '#e8cfa3');
  text(ctx, 'Klik stasiun, atau pakai tombol 1–6 untuk bahan dan Spasi untuk cincang.', 640, 380, 18, '#e8cfa3');
  text(ctx, 'Kombo naik kalau kamu mengantar tepat waktu. Shift 3 menit — seberapa banyak yang bisa kamu sajikan?', 640, 410, 18, '#e8cfa3');
  const pulse = 0.7 + 0.3 * Math.sin(state.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, '»  KLIK DI MANA SAJA / TEKAN ENTER UNTUK MULAI', 640, 490, 24, '#ffd94d');
  ctx.globalAlpha = 1;
  text(ctx, 'Nasi Goreng Kilat · Mie Ayam Cepat · Sate Tusuk · Es Teh Manis', 640, 540, 16, '#ffffff');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(36,26,18,0.7)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'JEDA', 640, 380, 56, '#ffd94d');
  text(ctx, 'Tekan Esc / P untuk lanjut', 640, 440, 20, '#ffffff');
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(36,26,18,0.85)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'SHIFT SELESAI!', 640, 240, 56, '#ffd94d');
  text(ctx, `Skor akhir: ${state.score}`, 640, 320, 34, '#ffffff');
  text(ctx, `Hidangan disajikan: ${state.served}   ·   Pesanan hangus: ${state.failed}`, 640, 370, 20, '#e8cfa3');
  text(ctx, `Kombo terbaik: x${Math.min(state.bestCombo, 5)}`, 640, 405, 20, '#e8cfa3');
  const verdict = state.score >= 1500 ? 'Koki Kilat! Dapur ini milikmu.'
    : state.score >= 800 ? 'Lumayan! Sedikit lagi jadi legenda dapur.'
    : 'Shift berikutnya pasti lebih cepat — coba lagi!';
  text(ctx, verdict, 640, 460, 22, '#ffd94d');
  text(ctx, 'Tekan R / klik untuk main lagi', 640, 530, 20, '#ffffff');
}

export function render(ctx, state, mouse) {
  drawBackground(ctx, state);
  drawTopBar(ctx, state);
  drawOrderBoard(ctx, state);
  drawFridge(ctx);
  drawBoardStation(ctx, state);
  drawStoveStation(ctx, state);
  drawPlateStation(ctx, state);
  drawWindowStation(ctx, state);
  drawBins(ctx, state);
  drawMessage(ctx, state);
  drawHands(ctx, state, mouse);
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'paused') drawPaused(ctx);
  if (state.screen === 'over') drawGameOver(ctx, state);
}
