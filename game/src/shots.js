// SPDX-License-Identifier: MIT
// shots.js — deterministic screenshot presets for Dapur Kilat.
// ?shot=cover | chop | assembly | serve freezes the clock and stages a
// kitchen that shows the board, the counter, a dish mid-assembly, a timer
// and a plate ready to serve. Also ?test=1 runs a scripted full order and
// reports the result into #testlog for headless play-testing.

import { createGameState, spawnOrder, showMessage } from './state.js';
import { clickBin, clickBoard, clickBurner, clickPlate, clickWindow } from './kitchen.js';

function baseShotState() {
  const state = createGameState();
  state.screen = 'playing';
  state.frozen = true;
  state.shiftLeft = 142;
  state.score = 340;
  state.combo = 2;
  state.served = 3;
  return state;
}

function addOrder(state, id, recipeId, timeLeft) {
  state.orders.push({ id, recipeId, timeLeft, total: 50 });
}

export function applyShot(state, name) {
  if (name === 'cover') {
    state.shiftLeft = 142;
    state.score = 340;
    state.combo = 2;
    state.served = 3;
    addOrder(state, 7, 'nasi-goreng', 34);
    addOrder(state, 8, 'mie-ayam', 22);
    addOrder(state, 9, 'es-teh', 41);
    state.board.item = { kind: 'veg', stage: 'raw' };
    state.board.progress = 0.6;
    state.burners[0].item = { kind: 'rice', stage: 'raw' };
    state.burners[0].progress = 0.55;
    state.plate.dish = 'nasi-goreng';
    state.plate.components = [
      { kind: 'rice', stage: 'cooked' },
      { kind: 'veg', stage: 'chopped' },
      { kind: 'egg', stage: 'cooked' },
    ];
    showMessage(state, 'Nasi Goreng Kilat siap diantar!', 999);
  } else if (name === 'chop') {
    state.shiftLeft = 165;
    state.score = 120;
    state.combo = 1;
    state.served = 1;
    addOrder(state, 4, 'sate-tusuk', 38);
    addOrder(state, 5, 'mie-ayam', 27);
    state.board.item = { kind: 'chicken', stage: 'raw' };
    state.board.progress = 0.5;
    state.burners[1].item = { kind: 'noodle', stage: 'raw' };
    state.burners[1].progress = 0.3;
    showMessage(state, 'Cincang ayamnya — 2× lagi!', 999);
  } else if (name === 'assembly') {
    state.shiftLeft = 98;
    state.score = 560;
    state.combo = 3;
    state.served = 5;
    addOrder(state, 11, 'nasi-goreng', 18);
    addOrder(state, 12, 'sate-tusuk', 44);
    state.plate.components = [
      { kind: 'rice', stage: 'cooked' },
      { kind: 'veg', stage: 'chopped' },
    ];
    state.burners[0].item = { kind: 'egg', stage: 'raw' };
    state.burners[0].progress = 0.75;
    state.hands = { kind: 'egg', stage: 'cooked' };
    state.shotMouse = { x: 880, y: 480 };
    showMessage(state, 'Satu bahan lagi: telur goreng!', 999);
  } else if (name === 'serve') {
    state.shiftLeft = 61;
    state.score = 890;
    state.combo = 4;
    state.served = 8;
    addOrder(state, 14, 'mie-ayam', 9);
    addOrder(state, 15, 'es-teh', 31);
    state.hands = { dish: 'mie-ayam' };
    state.shotMouse = { x: 880, y: 540 };
    showMessage(state, 'Antar Mie Ayam Cepat — waktunya mepet!', 999);
  }
  return state;
}

export function shotState(name) {
  const state = baseShotState();
  return applyShot(state, name);
}

// Scripted play-test: play one full Mie Ayam order through the real
// interaction functions and report the outcome. Returns a result object
// and writes it into #testlog + document.title for headless capture.
export function runSelfTest(state, sfx) {
  const log = [];
  const step = (label, ok) => log.push(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  const silent = { pickup() {}, place() {}, chop() {}, deny() {}, ding() {}, serve() {} };
  const useSfx = sfx ?? silent;

  state.screen = 'playing';
  state.frozen = false;
  state.orders = [{ id: 99, recipeId: 'mie-ayam', timeLeft: 50, total: 50 }];

  // 1. Grab noodles, cook them.
  clickBin(state, 1, useSfx);
  step('pick up noodle', state.hands?.kind === 'noodle');
  clickBurner(state, 0, useSfx);
  step('noodle on burner 0', state.burners[0].item?.kind === 'noodle' && !state.hands);
  state.burners[0].progress = 1;
  clickBurner(state, 0, useSfx);
  step('cooked noodle in hands', state.hands?.kind === 'noodle' && state.hands.stage === 'cooked');
  clickPlate(state, useSfx);
  step('noodle on plate', state.plate.components.length === 1);

  // 2. Chicken: chop, then cook.
  clickBin(state, 2, useSfx);
  step('pick up chicken', state.hands?.kind === 'chicken');
  clickBoard(state, useSfx);
  step('chicken on board', state.board.item?.kind === 'chicken');
  for (let i = 0; i < 4; i++) clickBoard(state, useSfx);
  step('chopping finished', state.board.progress >= 1);
  clickBoard(state, useSfx);
  step('chopped chicken in hands', state.hands?.stage === 'chopped');
  clickBurner(state, 1, useSfx);
  state.burners[1].progress = 1;
  clickBurner(state, 1, useSfx);
  step('cooked chicken in hands', state.hands?.stage === 'cooked');
  clickPlate(state, useSfx);
  step('dish assembled (mie-ayam)', state.plate.dish === 'mie-ayam');

  // 3. Pick up the dish and serve it.
  clickPlate(state, useSfx);
  step('dish in hands', state.hands?.dish === 'mie-ayam');
  const scoreBefore = state.score;
  clickWindow(state, useSfx);
  step('order served, score increased', state.orders.length === 0 && state.score > scoreBefore);
  step('combo is 1', state.combo === 1);

  const failed = log.filter((l) => l.startsWith('FAIL')).length;
  const result = {
    passed: failed === 0,
    steps: log,
    score: state.score,
    served: state.served,
  };
  const el = document.getElementById('testlog');
  if (el) {
    el.style.display = 'block';
    el.textContent = `SELFTEST ${result.passed ? 'PASS' : 'FAIL'} score=${state.score} served=${state.served}\n${log.join('\n')}`;
  }
  document.title = `SELFTEST ${result.passed ? 'PASS' : 'FAIL'} score=${state.score}`;
  return result;
}

export function maybeApplyShotOrTest(state) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot) return { mode: 'shot', state: shotState(shot) };
  if (params.get('test') === '1') return { mode: 'test', state };
  return { mode: 'play', state };
}

export { spawnOrder };
