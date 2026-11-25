// SPDX-License-Identifier: MIT
// state.js — the game's data: ingredients, recipes, orders, score and the
// whole mutable game state. No drawing and no input handling here.

export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 4;
export const ORDER_SECONDS = 50;

export const INGREDIENTS = {
  rice:    { name: 'Nasi',    chop: false, cook: true,  color: '#f5eeda', accent: '#d9c48a' },
  noodle:  { name: 'Mie',     chop: false, cook: true,  color: '#f2c94c', accent: '#d9a400' },
  chicken: { name: 'Ayam',    chop: true,  cook: true,  color: '#f2a65a', accent: '#b25a1b' },
  veg:     { name: 'Sayur',   chop: true,  cook: false, color: '#6abe30', accent: '#2f7d12' },
  egg:     { name: 'Telur',   chop: false, cook: true,  color: '#fff3c4', accent: '#f2b705' },
  tea:     { name: 'Es Teh',  chop: false, cook: false, color: '#b5651d', accent: '#7a3f0e' },
};

export const INGREDIENT_ORDER = ['rice', 'noodle', 'chicken', 'veg', 'egg', 'tea'];

// A recipe is a set of finished components, each "kind:stage".
export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng Kilat', price: 120,
    needs: ['rice:cooked', 'veg:chopped', 'egg:cooked'],
    hint: 'Nasi + sayur + telur',
  },
  {
    id: 'mie-ayam', name: 'Mie Ayam Cepat', price: 110,
    needs: ['noodle:cooked', 'chicken:cooked'],
    hint: 'Mie + ayam panggang',
  },
  {
    id: 'sate-tusuk', name: 'Sate Tusuk', price: 100,
    needs: ['chicken:cooked', 'veg:chopped'],
    hint: 'Ayam + sayur cincang',
  },
  {
    id: 'es-teh', name: 'Es Teh Manis', price: 60,
    needs: ['tea:raw'],
    hint: 'Es teh, langsung saji',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function componentKey(item) {
  return `${item.kind}:${item.stage}`;
}

export function makeItem(kind) {
  return { kind, stage: 'raw' };
}

export function itemLabel(item) {
  const base = INGREDIENTS[item.kind].name;
  if (item.stage === 'chopped') return `${base} cincang`;
  if (item.stage === 'cooked') return `${base} matang`;
  return base;
}

let nextOrderId = 1;

export function createGameState() {
  return {
    screen: 'title', // 'title' | 'playing' | 'paused' | 'over'
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    failed: 0,
    shiftLeft: SHIFT_SECONDS,
    spawnIn: 1.5,
    orders: [],
    hands: null, // one item, or a plated dish { dish: recipeId }
    board: { item: null, progress: 0 }, // chopping board
    burners: [
      { item: null, progress: 0 },
      { item: null, progress: 0 },
    ],
    plate: { components: [], dish: null }, // plating counter
    message: '',
    messageUntil: 0,
    time: 0,
    frozen: false, // screenshot presets freeze the clock
    flashOrderId: null,
  };
}

export function randomRecipe(rng) {
  return RECIPES[Math.floor(rng() * RECIPES.length)];
}

export function spawnOrder(state, rng) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const recipe = randomRecipe(rng);
  const order = {
    id: nextOrderId++,
    recipeId: recipe.id,
    timeLeft: ORDER_SECONDS,
    total: ORDER_SECONDS,
  };
  state.orders.push(order);
  return order;
}

export function plateMatchesRecipe(components) {
  const keys = components.map(componentKey).sort().join('|');
  return RECIPES.find((r) => [...r.needs].sort().join('|') === keys) ?? null;
}

export function serveDish(state, recipeId) {
  const idx = state.orders.findIndex((o) => o.recipeId === recipeId);
  if (idx === -1) return null;
  const order = state.orders[idx];
  state.orders.splice(idx, 1);
  const recipe = recipeById(recipeId);
  const speedBonus = Math.round((order.timeLeft / order.total) * 50);
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  const multiplier = Math.min(state.combo, 5);
  const points = (recipe.price + speedBonus) * multiplier;
  state.score += points;
  state.served += 1;
  return { points, multiplier, speedBonus, recipe };
}

export function expireOrder(state, order) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.combo = 0;
  state.failed += 1;
}

export function updateOrders(state, dt, rng) {
  if (state.screen !== 'playing' || state.frozen) return;
  state.shiftLeft -= dt;
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    // Orders arrive faster as the shift wears on.
    const pressure = 1 - state.shiftLeft / SHIFT_SECONDS; // 0 .. 1
    const gap = 14 - pressure * 6;
    state.spawnIn = gap;
    spawnOrder(state, rng);
  }
  for (const order of [...state.orders]) {
    order.timeLeft -= dt;
    if (order.timeLeft <= 0) expireOrder(state, order);
  }
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    state.screen = 'over';
  }
}

export function showMessage(state, text, seconds = 2) {
  state.message = text;
  state.messageUntil = state.time + seconds;
}
