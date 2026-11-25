// The kitchen: every rule of Sizzle & Serve. The renderer only paints this
// state and input only calls these verbs, so the rules live in exactly one place.
//
// A shift: orders arrive on the board, each with a patience timer. The cook
// builds the dish on the plate — patties must grill, lettuce and tomato must
// be chopped — then serves it to the matching ticket before its patience runs
// out. Serve fast and in a streak for tips and a combo multiplier. Let three
// tickets expire (or the shift end short of the target) and the shift is lost.
import {
  CHOPS_NEEDED, COMBO_MAX, GRILL_READY_SECONDS, GRILL_SECONDS, INGREDIENTS,
  MAX_HEARTS, MAX_ORDERS, ORDER_PATIENCE, ORDER_SPAWN_EVERY, RECIPES,
  SHIFT_SECONDS, TARGET_SCORE, TIP_MAX, ingredientById, recipeById,
} from './config.js';

export const EVENT_EXPIRED = 1;
export const EVENT_SHIFT_END = 2;
export const EVENT_SERVED = 4;
export const EVENT_BURNT = 8;

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const item of b) {
    const left = counts.get(item) ?? 0;
    if (left === 0) return false;
    counts.set(item, left - 1);
  }
  return true;
}

export function createKitchen(random) {
  const state = {
    timeLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    hearts: MAX_HEARTS,
    orders: [],
    grill: [null, null],
    board: [null, null],
    plate: [],
    spawnIn: 4,
    served: 0,
    lost: 0,
    shake: 0,
    flashServe: 0,
    message: '',
    messageAt: 0,
    over: false,
    won: false,
    elapsed: 0,
  };
  let orderNumber = 0;

  function pickRecipe() {
    // The Deluxe Burger only joins the menu once the rush is under way.
    const pool = state.elapsed < 60
      ? RECIPES.filter((dish) => dish.id !== 'deluxe')
      : RECIPES;
    const weights = pool.map((dish) => (dish.id === 'classic' ? 3 : dish.id === 'salad' ? 2 : 1));
    let roll = random.next() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < pool.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) return pool[index];
    }
    return pool[0];
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return;
    orderNumber += 1;
    const dish = pickRecipe();
    state.orders.push({
      id: orderNumber,
      recipe: dish.id,
      name: dish.name,
      needs: [...dish.needs],
      patience: ORDER_PATIENCE,
      maxPatience: ORDER_PATIENCE,
    });
  }

  function say(text) {
    state.message = text;
    state.messageAt = state.elapsed;
  }

  function reset() {
    state.timeLeft = SHIFT_SECONDS;
    state.score = 0;
    state.coins = 0;
    state.combo = 0;
    state.hearts = MAX_HEARTS;
    state.orders = [];
    state.grill = [null, null];
    state.board = [null, null];
    state.plate = [];
    state.spawnIn = 4;
    state.served = 0;
    state.lost = 0;
    state.shake = 0;
    state.flashServe = 0;
    state.message = '';
    state.over = false;
    state.won = false;
    state.elapsed = 0;
    orderNumber = 0;
    spawnOrder();
  }

  function step(seconds) {
    if (state.over) return 0;
    let events = 0;
    state.elapsed += seconds;
    state.timeLeft -= seconds;
    if (state.shake > 0) state.shake = Math.max(0, state.shake - seconds * 3);
    if (state.flashServe > 0) state.flashServe = Math.max(0, state.flashServe - seconds * 2);

    // The grill cooks, then the patty waits a little while before it burns.
    for (let slot = 0; slot < state.grill.length; slot += 1) {
      const item = state.grill[slot];
      if (!item) continue;
      item.cooked += seconds;
      if (item.cooked >= GRILL_SECONDS + GRILL_READY_SECONDS) {
        state.grill[slot] = null;
        events |= EVENT_BURNT;
        say('Burnt patty! Tossed.');
      }
    }

    // Tickets lose patience; an empty ticket costs a heart.
    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      order.patience -= seconds;
      if (order.patience <= 0) {
        state.orders.splice(index, 1);
        state.lost += 1;
        state.hearts -= 1;
        state.combo = 0;
        events |= EVENT_EXPIRED;
        say(`${order.name} walked out!`);
        if (state.hearts <= 0) {
          state.over = true;
          state.won = false;
          events |= EVENT_SHIFT_END;
          return events;
        }
      }
    }

    state.spawnIn -= seconds;
    if (state.spawnIn <= 0) {
      spawnOrder();
      state.spawnIn = ORDER_SPAWN_EVERY;
    }

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.over = true;
      state.won = state.score >= TARGET_SCORE;
      events |= EVENT_SHIFT_END;
    }
    return events;
  }

  // Clicking an ingredient bin: direct to the plate, or to the grill / board.
  function addIngredient(id) {
    if (state.over) return 'over';
    const ingredient = ingredientById(id);
    if (!ingredient) return 'none';
    if (ingredient.needs === 'grill') {
      const slot = state.grill.findIndex((item) => item === null);
      if (slot === -1) {
        say('Grill is full!');
        return 'full';
      }
      state.grill[slot] = { id: 'patty', cooked: 0, state: 'raw' };
      return 'grill';
    }
    if (ingredient.needs === 'chop') {
      const slot = state.board.findIndex((item) => item === null);
      if (slot === -1) {
        say('Board is full!');
        return 'full';
      }
      state.board[slot] = { id, chops: 0 };
      return 'board';
    }
    if (state.plate.filter((piece) => piece === id).length >= 2) {
      say(`Two ${ingredient.name.toLowerCase()}s is enough!`);
      return 'full';
    }
    state.plate.push(id);
    return 'plate';
  }

  // Clicking a grill slot takes a cooked patty to the plate.
  function takeGrill(slot) {
    const item = state.grill[slot];
    if (!item) return 'none';
    if (item.cooked < GRILL_SECONDS) {
      say('Still raw — let it cook!');
      return 'raw';
    }
    if (state.plate.filter((piece) => piece === 'patty').length >= 1) {
      say('One patty per plate!');
      return 'full';
    }
    state.grill[slot] = null;
    state.plate.push('patty');
    return 'plate';
  }

  // Clicking a chopping-board slot chops; the third chop sends it to the plate.
  function chopBoard(slot) {
    const item = state.board[slot];
    if (!item) return 'none';
    item.chops += 1;
    if (item.chops < CHOPS_NEEDED) return 'chop';
    state.board[slot] = null;
    if (state.plate.filter((piece) => piece === item.id).length >= 2) {
      say('Plate is full of that!');
      return 'full';
    }
    state.plate.push(item.id);
    return 'plate';
  }

  function matchingOrder() {
    return state.orders.find((order) => sameSet(state.plate, order.needs)) ?? null;
  }

  function serve() {
    if (state.over) return null;
    if (state.plate.length === 0) {
      say('Plate is empty!');
      return null;
    }
    const order = matchingOrder();
    if (!order) {
      state.shake = 1;
      say('No order wants this plate!');
      return { ok: false };
    }
    const dish = recipeById(order.recipe);
    const tip = Math.round((order.patience / order.maxPatience) * TIP_MAX);
    const multiplier = 1 + Math.min(state.combo, COMBO_MAX - 1) * 0.5;
    const points = Math.round(dish.points * multiplier);
    state.score += points;
    state.coins += tip;
    state.combo += 1;
    state.served += 1;
    state.orders.splice(state.orders.indexOf(order), 1);
    state.plate = [];
    state.flashServe = 1;
    say(`Served ${dish.name}! +${points} pts, +${tip} coins`);
    return { ok: true, dish: dish.name, points, tip };
  }

  function trashPlate() {
    if (state.plate.length === 0) return false;
    state.plate = [];
    say('Plate cleared.');
    return true;
  }

  reset();
  return { state, reset, step, addIngredient, takeGrill, chopBoard, serve, trashPlate, matchingOrder };
}

// The ingredient names, for the order tickets and the dossier outline.
export function ingredientNames() {
  return INGREDIENTS.map((item) => item.name);
}
