// The screenshot scenes behind ?shot=cover|orders|serve|end. Each one stages
// a real kitchen state through the game's own rules — orders dealt by the
// kitchen, ingredients placed by its verbs — then hands the frame to the
// renderer, so the picture is what a short game really looks like.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function stageOrder(kitchen, recipe, patience, id) {
  kitchen.state.orders.push({
    id,
    recipe,
    name: { classic: 'Classic Burger', cheese: 'Cheese Burger', salad: 'Garden Salad', deluxe: 'Deluxe Burger' }[recipe],
    needs: { classic: ['bun', 'patty', 'lettuce'], cheese: ['bun', 'patty', 'cheese', 'lettuce'], salad: ['lettuce', 'tomato', 'sauce'], deluxe: ['bun', 'patty', 'cheese', 'tomato', 'sauce'] }[recipe],
    patience,
    maxPatience: 45,
  });
}

export function stageShot(name, kitchen) {
  const state = kitchen.state;
  kitchen.reset();
  if (name === 'orders') {
    // A fresh rush: three tickets on the board, an empty plate, the counter full.
    state.orders = [];
    stageOrder(kitchen, 'classic', 42, 1);
    stageOrder(kitchen, 'salad', 38, 2);
    stageOrder(kitchen, 'cheese', 30, 3);
    state.timeLeft = 138;
    state.spawnIn = 8;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    // A finished Deluxe Burger on the plate, its ticket glowing, SERVE lit.
    state.orders = [];
    stageOrder(kitchen, 'deluxe', 26, 4);
    stageOrder(kitchen, 'classic', 18, 5);
    kitchen.addIngredient('bun');
    kitchen.addIngredient('cheese');
    kitchen.addIngredient('sauce');
    kitchen.addIngredient('tomato');
    kitchen.state.board[0] = { id: 'tomato', chops: 2 };
    kitchen.chopBoard(0);
    kitchen.state.grill[0] = { id: 'patty', cooked: 5, state: 'ready' };
    kitchen.takeGrill(0);
    state.timeLeft = 96;
    state.score = 115;
    state.coins = 14;
    state.combo = 2;
    state.served = 4;
    state.spawnIn = 6;
    return { screen: SCREEN_PLAY, best: 115 };
  }
  if (name === 'end') {
    // The shift, won: three stars, the score on the board.
    state.over = true;
    state.won = true;
    state.timeLeft = 0;
    state.score = 215;
    state.coins = 28;
    state.served = 8;
    state.lost = 1;
    state.combo = 3;
    return { screen: SCREEN_OVER, best: 215 };
  }
  if (name === 'title') {
    return { screen: SCREEN_TITLE, best: 145 };
  }
  // The cover: mid-rush, everything at once — two tickets (one nearly out of
  // time), a patty on the grill, tomato on the board, a burger mid-assembly.
  state.orders = [];
  stageOrder(kitchen, 'classic', 12, 1);
  stageOrder(kitchen, 'cheese', 34, 2);
  kitchen.addIngredient('bun');
  kitchen.addIngredient('lettuce');
  kitchen.state.board[0] = { id: 'lettuce', chops: 2 };
  kitchen.chopBoard(0);
  kitchen.addIngredient('tomato');
  kitchen.state.board[0].chops = 1;
  kitchen.state.grill[0] = { id: 'patty', cooked: 3.5, state: 'raw' };
  kitchen.state.grill[1] = { id: 'patty', cooked: 5, state: 'ready' };
  state.timeLeft = 107;
  state.score = 85;
  state.coins = 9;
  state.combo = 1;
  state.served = 3;
  state.spawnIn = 5;
  return { screen: SCREEN_PLAY, best: 145 };
}
