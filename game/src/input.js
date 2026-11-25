// Mouse and keyboard: every click and keypress becomes one of the kitchen's
// verbs. Hit zones come from the same LAYOUT the renderer draws, so a click
// always lands where the button is painted.
import { INGREDIENTS, LAYOUT } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_RESTART = 8;

function pointIn(point, rect) {
  return point.x >= rect.x && point.x < rect.x + rect.w && point.y >= rect.y && point.y < rect.y + rect.h;
}

function binRect(index) {
  const bins = LAYOUT.bins;
  return {
    x: bins.x + index * (bins.slotW + bins.gap),
    y: bins.y,
    w: bins.slotW,
    h: bins.h,
  };
}

export function createInput(canvas, kitchen) {
  const actions = { flags: 0 };
  const clicks = [];

  function toGamePoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    clicks.push(toGamePoint(event));
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key === ' ' || key === 'enter') {
      actions.flags |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (key === 'p' || key === 'escape') {
      actions.flags |= ACTION_PAUSE;
    } else if (key === 'm') {
      actions.flags |= ACTION_MUTE;
    } else if (key === 'r') {
      actions.flags |= ACTION_RESTART;
    } else if (key === 't') {
      kitchen.trashPlate();
    } else {
      const ingredient = INGREDIENTS.find((item) => item.key === key);
      if (ingredient) kitchen.addIngredient(ingredient.id);
    }
  });

  // The main loop drains these once a frame; a click is a kitchen verb, and
  // a click on empty space is just a click (the grill sizzles on, unbothered).
  function takeClicks() {
    const taken = clicks.splice(0, clicks.length);
    for (const point of taken) {
      let handled = false;
      for (let index = 0; index < INGREDIENTS.length; index += 1) {
        if (pointIn(point, binRect(index))) {
          kitchen.addIngredient(INGREDIENTS[index].id);
          handled = true;
          break;
        }
      }
      if (handled) continue;
      for (let slot = 0; slot < LAYOUT.grill.slots.length; slot += 1) {
        if (pointIn(point, LAYOUT.grill.slots[slot])) {
          kitchen.takeGrill(slot);
          handled = true;
          break;
        }
      }
      if (handled) continue;
      for (let slot = 0; slot < LAYOUT.board.slots.length; slot += 1) {
        if (pointIn(point, LAYOUT.board.slots[slot])) {
          kitchen.chopBoard(slot);
          handled = true;
          break;
        }
      }
      if (handled) continue;
      if (pointIn(point, LAYOUT.serve)) {
        kitchen.serve();
        continue;
      }
      if (pointIn(point, LAYOUT.trash)) {
        kitchen.trashPlate();
        continue;
      }
      if (pointIn(point, LAYOUT.start) || pointIn(point, LAYOUT.restart)) {
        actions.flags |= ACTION_CONFIRM;
      }
    }
    return taken.length;
  }

  function takeActions() {
    const flags = actions.flags;
    actions.flags = 0;
    return flags;
  }

  return { takeClicks, takeActions };
}
