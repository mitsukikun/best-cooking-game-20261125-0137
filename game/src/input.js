// SPDX-License-Identifier: MIT
// input.js — mouse and keyboard for Dapur Kilat. Clicks land on stations,
// keys 1-6 grab ingredients, Space chops/interacts, Esc pauses.

import { stationAt, handleStationClick, clickBoard } from './kitchen.js';

export function createInput(canvas, state, sfx, hooks) {
  const mouse = { x: 640, y: 400 };

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPos(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });

  canvas.addEventListener('click', (event) => {
    sfx.unlock();
    const p = canvasPos(event);
    mouse.x = p.x;
    mouse.y = p.y;
    hooks.onClick(p.x, p.y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    if (key === ' ' || key === 'Enter') {
      event.preventDefault();
      sfx.unlock();
      hooks.onActionKey();
      return;
    }
    if (key === 'Escape' || key === 'p' || key === 'P') {
      hooks.onPauseKey();
      return;
    }
    if (key === 'r' || key === 'R') {
      hooks.onRestartKey();
      return;
    }
    if (key >= '1' && key <= '6') {
      sfx.unlock();
      hooks.onBinKey(Number(key) - 1);
    }
  });

  return mouse;
}

// What a click at (x, y) does, given the screen.
export function clickAt(state, x, y, sfx, startGame, restartGame) {
  if (state.screen === 'title') {
    startGame();
    return;
  }
  if (state.screen === 'over') {
    restartGame();
    return;
  }
  if (state.screen === 'paused') {
    state.screen = 'playing';
    return;
  }
  const station = stationAt(state, x, y);
  handleStationClick(state, station, sfx);
}

// Space / Enter: start, chop at the board, or restart.
export function actionKey(state, mouse, sfx, startGame, restartGame) {
  if (state.screen === 'title') {
    startGame();
    return;
  }
  if (state.screen === 'over') {
    restartGame();
    return;
  }
  if (state.screen !== 'playing') return;
  const station = stationAt(state, mouse.x, mouse.y);
  if (station && station.type === 'board') {
    clickBoard(state, sfx);
    return;
  }
  if (station) handleStationClick(state, station, sfx);
}
