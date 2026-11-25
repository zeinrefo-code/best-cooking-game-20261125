// Sizzle & Serve — constants, ingredients, recipes and the kitchen layout.
// One file, one job: every number the rest of the game shares lives here so a
// balance tweak never means hunting through the renderer or the rules.

export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'sizzle-and-serve-best';

// A shift lasts this long; reach TARGET_SCORE before it ends to win it.
export const SHIFT_SECONDS = 150;
export const TARGET_SCORE = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 45;
export const ORDER_SPAWN_EVERY = 10;

// A raw patty grills this long, then stays good for this long before burning.
export const GRILL_SECONDS = 5;
export const GRILL_READY_SECONDS = 6;
// Chops needed to turn lettuce or tomato into a plate-ready piece.
export const CHOPS_NEEDED = 3;

// Coins are the tip: a fast serve pays more, and a streak multiplies the points.
export const TIP_MAX = 10;
export const COMBO_MAX = 3;

// The six ingredients on the counter, in the order their bins stand.
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', needs: 'none', color: '#e8a94e', dark: '#b97e2e' },
  { id: 'patty', name: 'Patty', key: '2', needs: 'grill', color: '#8a5a3b', dark: '#5f3a22' },
  { id: 'cheese', name: 'Cheese', key: '3', needs: 'none', color: '#f7c948', dark: '#d9a41f' },
  { id: 'lettuce', name: 'Lettuce', key: '4', needs: 'chop', color: '#58b368', dark: '#2f7d3d' },
  { id: 'tomato', name: 'Tomato', key: '5', needs: 'chop', color: '#e4572e', dark: '#a83216' },
  { id: 'sauce', name: 'Sauce', key: '6', needs: 'none', color: '#f08a24', dark: '#b25e0d' },
];

export function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id);
}

// The menu: each dish is the exact set of ingredients its ticket asks for.
export const RECIPES = [
  { id: 'classic', name: 'Classic Burger', needs: ['bun', 'patty', 'lettuce'], points: 25 },
  { id: 'cheese', name: 'Cheese Burger', needs: ['bun', 'patty', 'cheese', 'lettuce'], points: 35 },
  { id: 'salad', name: 'Garden Salad', needs: ['lettuce', 'tomato', 'sauce'], points: 30 },
  { id: 'deluxe', name: 'Deluxe Burger', needs: ['bun', 'patty', 'cheese', 'tomato', 'sauce'], points: 50 },
];

export function recipeById(id) {
  return RECIPES.find((dish) => dish.id === id);
}

// Where everything stands on the 1280x720 canvas. Input hit-tests against
// these same rectangles, so a click always lands where the drawing shows it.
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 68 },
  grill: { x: 36, y: 132, w: 380, h: 190, slots: [
    { x: 66, y: 178, w: 140, h: 108 },
    { x: 240, y: 178, w: 140, h: 108 },
  ] },
  board: { x: 452, y: 132, w: 380, h: 190, slots: [
    { x: 482, y: 178, w: 140, h: 108 },
    { x: 656, y: 178, w: 140, h: 108 },
  ] },
  plate: { x: 300, y: 352, w: 420, h: 168 },
  serve: { x: 760, y: 352, w: 200, h: 78 },
  trash: { x: 760, y: 442, w: 200, h: 78 },
  bins: { x: 36, y: 552, w: 924, h: 140, slotW: 148, gap: 7 },
  orders: { x: 996, y: 84, w: 248, h: 436, ticketH: 116, gap: 10 },
  start: { x: 490, y: 470, w: 300, h: 72 },
  restart: { x: 490, y: 520, w: 300, h: 64 },
};
