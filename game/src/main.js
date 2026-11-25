// SPDX-License-Identifier: MIT
// main.js — boot and game loop for Dapur Kilat. Wires state, kitchen,
// input, rendering and sound together, then runs the animation loop.

import { createGameState, spawnOrder, updateOrders } from './state.js';
import { updateKitchen, clickBin } from './kitchen.js';
import { createSoundBank } from './audio.js';
import { render } from './render.js';
import { createInput, clickAt, actionKey } from './input.js';
import { maybeApplyShotOrTest, runSelfTest } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = createSoundBank();

let state = createGameState();
const mode = maybeApplyShotOrTest(state);
state = mode.state;

function startGame() {
  const fresh = createGameState();
  fresh.screen = 'playing';
  state = fresh;
  spawnOrder(state, Math.random);
  spawnOrder(state, Math.random);
  sfx.unlock();
  sfx.ding();
}

function restartGame() {
  startGame();
}

function togglePause() {
  if (state.screen === 'playing') state.screen = 'paused';
  else if (state.screen === 'paused') state.screen = 'playing';
}

const mouse = createInput(canvas, state, sfx, {
  onClick(x, y) {
    clickAt(state, x, y, sfx, startGame, restartGame);
  },
  onActionKey() {
    actionKey(state, mouse, sfx, startGame, restartGame);
  },
  onPauseKey() {
    togglePause();
  },
  onRestartKey() {
    if (state.screen === 'over') restartGame();
  },
  onBinKey(index) {
    if (state.screen !== 'playing') return;
    clickBin(state, index, sfx);
  },
});

// Screenshot presets may stage the held item near a station.
if (state.shotMouse) {
  mouse.x = state.shotMouse.x;
  mouse.y = state.shotMouse.y;
}

let last = performance.now();
let testDone = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.time += dt;

  if (mode.mode === 'test' && !testDone) {
    testDone = true;
    // Silent sfx: no AudioContext before a user gesture, so headless runs
    // stay free of autoplay warnings.
    runSelfTest(state, null);
  }

  if (state.screen === 'playing' && !state.frozen) {
    updateOrders(state, dt, Math.random);
    updateKitchen(state, dt);
    const cooking = state.burners.some((b) => b.item && b.progress < 1);
    if (cooking) sfx.startSizzle();
    else sfx.stopSizzle();
  } else {
    sfx.stopSizzle();
  }

  render(ctx, state, mouse);
  requestAnimationFrame(frame);
}

// Expose the live state for debugging and headless checks.
window.__dapur = {
  get state() { return state; },
  startGame,
};

requestAnimationFrame(frame);
