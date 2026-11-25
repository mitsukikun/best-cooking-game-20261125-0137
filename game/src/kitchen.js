// SPDX-License-Identifier: MIT
// kitchen.js — the stations of Dapur Kilat and what happens when the player
// clicks one: pick up, chop, cook, assemble and serve. Pure rules, no drawing.

import {
  INGREDIENTS, componentKey, itemLabel, makeItem, plateMatchesRecipe,
  recipeById, serveDish, showMessage,
} from './state.js';

export const CHOPS_TO_FINISH = 4;
export const COOK_SECONDS = 5;

export const STATIONS = {
  board:  { x: 330, y: 250, w: 240, h: 190, label: 'Talenan' },
  stove:  { x: 600, y: 250, w: 300, h: 190, label: 'Kompor' },
  plate:  { x: 930, y: 250, w: 200, h: 190, label: 'Meja Saji' },
  window: { x: 930, y: 455, w: 200, h: 155, label: 'Jendela Antar' },
  bins:   { x: 40,  y: 615, w: 1200, h: 150, label: 'Bahan Mentah' },
};

export function binRect(index) {
  const w = 180;
  return { x: 60 + index * 195, y: 646, w, h: 100 };
}

export function burnerRect(index) {
  return { x: 625 + index * 135, y: 300, w: 110, h: 110 };
}

function pointIn(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function stationAt(state, x, y) {
  if (pointIn(x, y, STATIONS.window)) return { type: 'window' };
  if (pointIn(x, y, STATIONS.plate)) return { type: 'plate' };
  if (pointIn(x, y, STATIONS.board)) return { type: 'board' };
  if (pointIn(x, y, STATIONS.stove)) {
    for (let i = 0; i < 2; i++) {
      if (pointIn(x, y, burnerRect(i))) return { type: 'burner', index: i };
    }
    return { type: 'stove' };
  }
  for (let i = 0; i < 6; i++) {
    if (pointIn(x, y, binRect(i))) return { type: 'bin', index: i };
  }
  return null;
}

// Advance anything that cooks on its own. Chopping is manual (clicks).
export function updateKitchen(state, dt) {
  if (state.screen !== 'playing' || state.frozen) return;
  for (const burner of state.burners) {
    if (burner.item && burner.progress < 1) {
      burner.progress = Math.min(1, burner.progress + dt / COOK_SECONDS);
    }
  }
}

function canChop(item) {
  return item && INGREDIENTS[item.kind].chop && item.stage === 'raw';
}

function canCook(item) {
  return item && INGREDIENTS[item.kind].cook && (item.stage === 'raw' || item.stage === 'chopped');
}

export function clickBin(state, index, sfx) {
  const kinds = ['rice', 'noodle', 'chicken', 'veg', 'egg', 'tea'];
  if (state.hands) {
    showMessage(state, 'Tangan penuh! Letakkan dulu.');
    sfx.deny();
    return;
  }
  state.hands = makeItem(kinds[index]);
  sfx.pickup();
}

export function clickBoard(state, sfx) {
  const board = state.board;
  if (!board.item) {
    if (!state.hands) return;
    if (!canChop(state.hands)) {
      showMessage(state, `${itemLabel(state.hands)} tidak perlu dicincang.`);
      sfx.deny();
      return;
    }
    board.item = state.hands;
    board.progress = 0;
    state.hands = null;
    sfx.place();
    return;
  }
  if (board.progress < 1) {
    board.progress = Math.min(1, board.progress + 1 / CHOPS_TO_FINISH);
    sfx.chop();
    return;
  }
  if (state.hands) {
    showMessage(state, 'Tangan penuh! Ambil cincangan dulu.');
    sfx.deny();
    return;
  }
  state.hands = { kind: board.item.kind, stage: 'chopped' };
  board.item = null;
  board.progress = 0;
  sfx.pickup();
}

export function clickBurner(state, index, sfx) {
  const burner = state.burners[index];
  if (!burner.item) {
    if (!state.hands) return;
    if (!canCook(state.hands)) {
      showMessage(state, `${itemLabel(state.hands)} tidak perlu dimasak.`);
      sfx.deny();
      return;
    }
    burner.item = state.hands;
    burner.progress = 0;
    state.hands = null;
    sfx.place();
    return;
  }
  if (burner.progress < 1) {
    showMessage(state, 'Masih dimasak… tunggu sebentar.');
    sfx.deny();
    return;
  }
  if (state.hands) {
    showMessage(state, 'Tangan penuh! Ambil masakan dulu.');
    sfx.deny();
    return;
  }
  state.hands = { kind: burner.item.kind, stage: 'cooked' };
  burner.item = null;
  burner.progress = 0;
  sfx.pickup();
}

export function clickPlate(state, sfx) {
  const plate = state.plate;
  if (plate.dish) {
    if (state.hands) {
      showMessage(state, 'Tangan penuh! Antar dulu hidangannya.');
      sfx.deny();
      return;
    }
    state.hands = { dish: plate.dish };
    plate.dish = null;
    plate.components = [];
    sfx.pickup();
    return;
  }
  if (!state.hands) {
    if (plate.components.length > 0) {
      // Take the last component back off the plate.
      state.hands = plate.components.pop();
      sfx.pickup();
    }
    return;
  }
  if (state.hands.dish) {
    showMessage(state, 'Hidangan sudah jadi — antar ke jendela!');
    sfx.deny();
    return;
  }
  if (plate.components.length >= 3) {
    showMessage(state, 'Piring penuh!');
    sfx.deny();
    return;
  }
  const key = componentKey(state.hands);
  if (plate.components.some((c) => componentKey(c) === key)) {
    showMessage(state, 'Bahan itu sudah ada di piring.');
    sfx.deny();
    return;
  }
  plate.components.push(state.hands);
  state.hands = null;
  sfx.place();
  const match = plateMatchesRecipe(plate.components);
  if (match) {
    plate.dish = match.id;
    showMessage(state, `${match.name} siap diantar!`, 2.5);
    sfx.ding();
  }
}

export function clickWindow(state, sfx) {
  if (!state.hands || !state.hands.dish) {
    showMessage(state, 'Bawa hidangan jadi ke jendela antar.');
    sfx.deny();
    return;
  }
  const result = serveDish(state, state.hands.dish);
  if (!result) {
    showMessage(state, 'Tidak ada pesanan untuk hidangan ini!');
    sfx.deny();
    return;
  }
  state.hands = null;
  state.flashOrderId = null;
  showMessage(
    state,
    `Disajikan! +${result.points} poin (kombo x${result.multiplier})`,
    2.5,
  );
  sfx.serve();
}

export function handleStationClick(state, station, sfx) {
  if (!station || state.screen !== 'playing') return;
  switch (station.type) {
    case 'bin': clickBin(state, station.index, sfx); break;
    case 'board': clickBoard(state, sfx); break;
    case 'burner': clickBurner(state, station.index, sfx); break;
    case 'plate': clickPlate(state, sfx); break;
    case 'window': clickWindow(state, sfx); break;
    default: break;
  }
}

export function heldLabel(state) {
  if (!state.hands) return '';
  if (state.hands.dish) return recipeById(state.hands.dish).name;
  return itemLabel(state.hands);
}
