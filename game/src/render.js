// The renderer: everything the player sees, painted on one canvas. It reads
// the kitchen state and the screen, and draws nothing it is not told to —
// the rules live in kitchen.js, the pictures live here.
import {
  CHOPS_NEEDED, GRILL_SECONDS, INGREDIENTS, LAYOUT, MAX_HEARTS, SHIFT_SECONDS, TARGET_SCORE,
  VIEW, ingredientById, recipeById,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, radius) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

// One ingredient, drawn the same everywhere: bins, tickets, grill, board, plate.
export function drawIngredient(ctx, id, cx, cy, size, stage = 'ready') {
  const ingredient = ingredientById(id);
  const s = size;
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun') {
    ctx.fillStyle = ingredient.dark;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.16, s * 0.52, s * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.arc(0, s * 0.08, s * 0.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    ctx.beginPath();
    ctx.ellipse(-s * 0.18, -s * 0.12, s * 0.05, s * 0.03, -0.4, 0, Math.PI * 2);
    ctx.ellipse(s * 0.14, -s * 0.2, s * 0.05, s * 0.03, 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'patty') {
    ctx.fillStyle = stage === 'raw' ? '#c98a6b' : ingredient.color;
    roundRect(ctx, -s * 0.52, -s * 0.2, s * 1.04, s * 0.4, s * 0.12);
    ctx.fill();
    ctx.strokeStyle = ingredient.dark;
    ctx.lineWidth = Math.max(2, s * 0.04);
    ctx.beginPath();
    for (let i = -1; i <= 1; i += 1) {
      ctx.moveTo(-s * 0.3 + i * s * 0.3, -s * 0.16);
      ctx.lineTo(-s * 0.2 + i * s * 0.3, s * 0.16);
    }
    ctx.stroke();
  } else if (id === 'cheese') {
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.18);
    ctx.lineTo(s * 0.5, s * 0.18);
    ctx.lineTo(0, -s * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ingredient.dark;
    ctx.beginPath();
    ctx.arc(-s * 0.2, s * 0.02, s * 0.05, 0, Math.PI * 2);
    ctx.arc(s * 0.18, -s * 0.08, s * 0.04, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.ellipse(
        Math.cos(angle) * s * 0.26, Math.sin(angle) * s * 0.26,
        s * 0.26, s * 0.16, angle, 0, Math.PI * 2,
      );
    }
    ctx.fill();
    ctx.fillStyle = ingredient.dark;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'tomato') {
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ingredient.dark;
    ctx.beginPath();
    ctx.arc(0, -s * 0.4, s * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2f7d3d';
    ctx.lineWidth = Math.max(2, s * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(s * 0.16, -s * 0.52);
    ctx.stroke();
  } else if (id === 'sauce') {
    ctx.strokeStyle = ingredient.color;
    ctx.lineWidth = Math.max(3, s * 0.12);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.1);
    ctx.bezierCurveTo(-s * 0.2, -s * 0.42, s * 0.1, s * 0.3, s * 0.42, -s * 0.08);
    ctx.stroke();
    ctx.fillStyle = ingredient.color;
    ctx.beginPath();
    ctx.arc(-s * 0.42, -s * 0.1, s * 0.09, 0, Math.PI * 2);
    ctx.arc(s * 0.42, -s * 0.08, s * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBar(ctx, x, y, w, h, fraction, color, background = '#00000033') {
  ctx.fillStyle = background;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const clamped = Math.max(0, Math.min(1, fraction));
  if (clamped > 0) {
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w * clamped, h, h / 2);
    ctx.fill();
  }
}

function drawTicket(ctx, order, x, y, w, h, flash) {
  const dish = recipeById(order.recipe);
  const patienceFraction = order.patience / order.maxPatience;
  const urgent = patienceFraction < 0.35;
  ctx.save();
  if (urgent) ctx.translate(Math.sin(performance.now() / 90) * 1.5, 0);
  ctx.fillStyle = '#fff8ec';
  ctx.strokeStyle = flash ? '#e4572e' : '#d8c3a5';
  ctx.lineWidth = flash ? 4 : 2;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e4572e';
  roundRect(ctx, x, y, w, 8, 4);
  ctx.fill();
  text(ctx, `#${order.id} ${dish.name}`, x + 14, y + 30, 16, '#2b2118');
  text(ctx, `${dish.points} pts`, x + w - 12, y + 30, 13, '#8a6d3b', 'bold', 'right');
  order.needs.forEach((id, index) => {
    drawIngredient(ctx, id, x + 30 + index * 44, y + 60, 30);
  });
  const barColor = urgent ? '#e4572e' : patienceFraction < 0.6 ? '#f08a24' : '#58b368';
  drawBar(ctx, x + 14, y + h - 24, w - 28, 12, patienceFraction, barColor);
  text(ctx, `${Math.ceil(order.patience)}s`, x + w - 12, y + h - 28, 13, '#5b4632', 'bold', 'right');
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;

  function drawHeader(state) {
    const header = LAYOUT.header;
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(header.x, header.y, header.w, header.h);
    // A little frying pan for the logo.
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.arc(48, 36, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.arc(48, 36, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b2118';
    ctx.fillRect(64, 32, 22, 7);
    text(ctx, 'SIZZLE & SERVE', 96, 44, 26, '#fff8ec');
    // The shift timer, big in the middle, with its bar under it.
    const timeFraction = state.timeLeft / SHIFT_SECONDS;
    const timerColor = state.timeLeft <= 20 ? '#ff6b5e' : '#fff8ec';
    text(ctx, formatTime(state.timeLeft), 640, 40, 34, timerColor, 'bold', 'center');
    drawBar(ctx, 560, 50, 160, 8, timeFraction, state.timeLeft <= 20 ? '#ff6b5e' : '#58b368', '#ffffff33');
    text(ctx, `SCORE ${state.score}`, 1010, 30, 18, '#f7c948', 'bold', 'right');
    text(ctx, `TARGET ${TARGET_SCORE}`, 1010, 54, 14, '#fff8ec');
    text(ctx, `COINS ${state.coins}`, 1120, 30, 18, '#f7c948', 'bold', 'right');
    for (let heart = 0; heart < MAX_HEARTS; heart += 1) {
      ctx.fillStyle = heart < state.hearts ? '#ff6b5e' : '#ffffff33';
      ctx.beginPath();
      const hx = 1150 + heart * 34;
      const hy = 44;
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 12, hy - 4, hx - 6, hy - 14, hx, hy - 6);
      ctx.bezierCurveTo(hx + 6, hy - 14, hx + 12, hy - 4, hx, hy + 8);
      ctx.fill();
    }
  }

  function drawKitchen(state) {
    // Warm wall, tiled floor, wooden counter.
    ctx.fillStyle = '#f7ead7';
    ctx.fillRect(0, 68, 1280, 652);
    ctx.fillStyle = '#f2ddbd';
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 13; col += 1) {
        if ((row + col) % 2 === 0) ctx.fillRect(col * 100 + (row % 2) * 50, 84 + row * 108, 96, 104);
      }
    }
    ctx.fillStyle = '#a4713f';
    roundRect(ctx, 20, 84, 960, 452, 16);
    ctx.fill();
    ctx.fillStyle = '#8a5a30';
    ctx.fillRect(20, 84, 960, 10);

    // The grill: two slots on a hot stove.
    const grill = LAYOUT.grill;
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, grill.x, grill.y, grill.w, grill.h, 12);
    ctx.fill();
    text(ctx, 'GRILL — click a patty, wait for the ding', grill.x + 16, grill.y + 26, 15, '#fff8ec');
    grill.slots.forEach((slot, index) => {
      ctx.fillStyle = '#222';
      roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 3;
      for (let bar = 1; bar <= 3; bar += 1) {
        ctx.beginPath();
        ctx.moveTo(slot.x + 8, slot.y + (slot.h / 4) * bar);
        ctx.lineTo(slot.x + slot.w - 8, slot.y + (slot.h / 4) * bar);
        ctx.stroke();
      }
      const item = state.grill[index];
      if (item) {
        const cooked = item.cooked >= GRILL_SECONDS;
        drawIngredient(ctx, 'patty', slot.x + slot.w / 2, slot.y + slot.h / 2 - 6, 64, cooked ? 'ready' : 'raw');
        const fraction = Math.min(1, item.cooked / GRILL_SECONDS);
        const readyLeft = GRILL_SECONDS + 6 - item.cooked;
        drawBar(ctx, slot.x + 14, slot.y + slot.h - 18, slot.w - 28, 8,
          cooked ? Math.max(0, readyLeft / 6) : fraction, cooked ? '#58b368' : '#f08a24');
        if (cooked) text(ctx, 'READY — click to plate!', slot.x + slot.w / 2, slot.y + slot.h + 16, 13, '#58b368', 'bold', 'center');
      } else {
        text(ctx, 'empty', slot.x + slot.w / 2, slot.y + slot.h / 2 + 6, 15, '#777', 'bold', 'center');
      }
    });

    // The chopping board: click the piece three times.
    const board = LAYOUT.board;
    ctx.fillStyle = '#c89b6a';
    roundRect(ctx, board.x, board.y, board.w, board.h, 12);
    ctx.fill();
    text(ctx, 'CHOPPING BOARD — click 3× to chop', board.x + 16, board.y + 26, 15, '#5b3a1e');
    board.slots.forEach((slot, index) => {
      ctx.fillStyle = '#e8c795';
      roundRect(ctx, slot.x, slot.y, slot.w, slot.h, 10);
      ctx.fill();
      ctx.strokeStyle = '#b98d55';
      ctx.lineWidth = 2;
      ctx.stroke();
      const item = state.board[index];
      if (item) {
        drawIngredient(ctx, item.id, slot.x + slot.w / 2, slot.y + slot.h / 2 - 4, 58);
        drawBar(ctx, slot.x + 14, slot.y + slot.h - 18, slot.w - 28, 8,
          item.chops / CHOPS_NEEDED, '#58b368');
        text(ctx, `${item.chops}/${CHOPS_NEEDED} chops`, slot.x + slot.w / 2, slot.y + slot.h + 16, 13, '#5b3a1e', 'bold', 'center');
      } else {
        text(ctx, 'empty', slot.x + slot.w / 2, slot.y + slot.h / 2 + 6, 15, '#a08050', 'bold', 'center');
      }
    });

    // The plate: the dish mid-assembly, stacked layer by layer.
    const plateArea = LAYOUT.plate;
    ctx.save();
    if (state.shake > 0) ctx.translate((Math.random() - 0.5) * state.shake * 10, 0);
    ctx.fillStyle = state.flashServe > 0 ? '#fff3c4' : '#fdf6e9';
    roundRect(ctx, plateArea.x, plateArea.y, plateArea.w, plateArea.h, 14);
    ctx.fill();
    ctx.strokeStyle = '#d8c3a5';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'PLATE', plateArea.x + 16, plateArea.y + 26, 15, '#8a6d3b');
    const plateCx = plateArea.x + 170;
    const plateCy = plateArea.y + 108;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(plateCx, plateCy, 120, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cbb98f';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#f2e8d0';
    ctx.beginPath();
    ctx.ellipse(plateCx, plateCy, 92, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Stack the layers bottom-up so the last ingredient sits on top; each
    // layer is nudged sideways so the ones below still peek out.
    const stackOrder = ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'sauce'];
    const sorted = [...state.plate].sort((a, b) => stackOrder.indexOf(a) - stackOrder.indexOf(b));
    sorted.forEach((id, index) => {
      drawIngredient(ctx, id, plateCx + (index % 2 === 0 ? -10 : 10), plateCy - 6 - index * 17, 66);
    });
    if (state.plate.length === 0) {
      text(ctx, 'build your dish here', plateCx, plateCy + 4, 15, '#b09a78', 'bold', 'center');
    }
    const match = state.plate.length > 0 && state.orders.some((order) => {
      if (order.needs.length !== state.plate.length) return false;
      return order.needs.every((need) => state.plate.includes(need));
    });
    text(ctx, match ? '✓ matches an order!' : 'match a ticket, then SERVE', plateArea.x + plateArea.w - 16, plateArea.y + 26, 14, match ? '#2f7d3d' : '#8a6d3b', 'bold', 'right');
    ctx.restore();

    // Serve and trash.
    const serve = LAYOUT.serve;
    const serveReady = state.plate.length > 0;
    ctx.fillStyle = serveReady ? '#e4572e' : '#c9b8a0';
    if (serveReady && state.flashServe <= 0) {
      ctx.shadowColor = '#e4572e';
      ctx.shadowBlur = 18;
    }
    roundRect(ctx, serve.x, serve.y, serve.w, serve.h, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    text(ctx, 'SERVE', serve.x + serve.w / 2, serve.y + 34, 26, '#fff', 'bold', 'center');
    text(ctx, 'Space', serve.x + serve.w / 2, serve.y + 60, 14, '#ffe1d6', 'bold', 'center');
    const trash = LAYOUT.trash;
    ctx.fillStyle = '#6b5b4c';
    roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 12);
    ctx.fill();
    text(ctx, 'TRASH PLATE', trash.x + trash.w / 2, trash.y + 34, 20, '#fff', 'bold', 'center');
    text(ctx, 'key T', trash.x + trash.w / 2, trash.y + 60, 14, '#d8cbb8', 'bold', 'center');

    // The message line under the stations.
    if (state.message) {
      text(ctx, state.message, 500, 536, 18, '#5b4632', 'bold', 'center');
    }
  }

  function drawBins(state) {
    const bins = LAYOUT.bins;
    text(ctx, 'INGREDIENTS — click or press 1–6', bins.x + 4, bins.y - 2, 13, '#5b4632');
    INGREDIENTS.forEach((ingredient, index) => {
      const x = bins.x + index * (bins.slotW + bins.gap);
      const y = bins.y;
      const w = bins.slotW;
      const h = bins.h;
      ctx.fillStyle = '#fff8ec';
      roundRect(ctx, x, y, w, h, 12);
      ctx.fill();
      ctx.strokeStyle = '#d8c3a5';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawIngredient(ctx, ingredient.id, x + w / 2, y + 58, 64);
      text(ctx, ingredient.name, x + w / 2, y + 108, 17, '#2b2118', 'bold', 'center');
      const hint = ingredient.needs === 'grill' ? 'grill it' : ingredient.needs === 'chop' ? 'chop 3×' : 'straight on';
      text(ctx, `${hint} · ${ingredient.key}`, x + w / 2, y + 130, 13, '#8a6d3b', 'bold', 'center');
    });
  }

  function drawOrders(state) {
    const area = LAYOUT.orders;
    ctx.fillStyle = '#2b2118';
    roundRect(ctx, area.x, area.y, area.w, area.h, 14);
    ctx.fill();
    text(ctx, 'ORDER BOARD', area.x + 16, area.y + 28, 19, '#f7c948');
    text(ctx, `served ${state.served} · lost ${state.lost}`, area.x + 16, area.y + 50, 13, '#fff8ec');
    if (state.orders.length === 0) {
      text(ctx, 'No orders yet —', area.x + area.w / 2, area.y + 120, 16, '#fff8ec', 'bold', 'center');
      text(ctx, 'the lunch rush is coming!', area.x + area.w / 2, area.y + 146, 16, '#fff8ec', 'bold', 'center');
    }
    state.orders.forEach((order, index) => {
      const y = area.y + 60 + index * (area.ticketH + area.gap);
      const flash = state.plate.length > 0 && order.needs.length === state.plate.length
        && order.needs.every((need) => state.plate.includes(need));
      drawTicket(ctx, order, area.x + 12, y, area.w - 24, area.ticketH, flash);
    });
    // The combo badge under the board.
    if (state.combo >= 2) {
      ctx.fillStyle = '#f7c948';
      roundRect(ctx, area.x, area.y + area.h + 12, area.w, 44, 10);
      ctx.fill();
      text(ctx, `COMBO x${1 + Math.min(state.combo - 1, 2) * 0.5} — ${state.combo} in a row!`, area.x + area.w / 2, area.y + area.h + 41, 16, '#2b2118', 'bold', 'center');
    }
    text(ctx, 'P pause · M mute · R restart', area.x + area.w / 2, 700, 13, '#8a6d3b', 'bold', 'center');
  }

  function drawOverlay(title, lines, buttonText, buttonRect) {
    ctx.fillStyle = '#1d140cd9';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff8ec';
    roundRect(ctx, 340, 110, 600, 470, 18);
    ctx.fill();
    ctx.strokeStyle = '#e4572e';
    ctx.lineWidth = 4;
    ctx.stroke();
    text(ctx, title, 640, 180, 40, '#2b2118', 'bold', 'center');
    lines.forEach((line, index) => {
      text(ctx, line.text, 640, 232 + index * 34, line.size ?? 18, line.color ?? '#5b4632', line.weight ?? 'normal', 'center');
    });
    if (buttonText) {
      ctx.fillStyle = '#e4572e';
      roundRect(ctx, buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h, 12);
      ctx.fill();
      text(ctx, buttonText, 640, buttonRect.y + 46, 26, '#fff', 'bold', 'center');
    }
  }

  function drawTitle(state, best) {
    drawKitchen(state);
    drawBins(state);
    drawOrders(state);
    drawOverlay('SIZZLE & SERVE', [
      { text: 'Run your own lunch-rush kitchen!', size: 20, color: '#2b2118', weight: 'bold' },
      { text: 'Tickets arrive on the order board — build each dish on the plate.', size: 17 },
      { text: 'Patties grill (5s), lettuce & tomato need 3 chops.', size: 17 },
      { text: 'Serve the matching ticket before its timer runs out.', size: 17 },
      { text: `Score ${TARGET_SCORE} in ${formatTime(150)} to win the shift. Lose 3 tickets and it is over.`, size: 17 },
      { text: 'Click ingredients or press 1–6 · Space serves · T trashes', size: 16, color: '#8a6d3b' },
      { text: best > 0 ? `Best score: ${best}` : 'Your first shift awaits, chef!', size: 18, color: '#e4572e', weight: 'bold' },
    ], 'START SHIFT  (Enter)', LAYOUT.start);
  }

  function drawPaused() {
    drawOverlay('PAUSED', [
      { text: 'The grill is holding. Take a breath, chef.', size: 19 },
      { text: 'Press P or click to get back to the rush.', size: 17 },
    ], 'RESUME  (P)', LAYOUT.start);
  }

  function drawOver(state, best) {
    const stars = state.won ? (state.score >= 220 ? 3 : state.score >= 180 ? 2 : 1) : 0;
    const title = state.won ? 'SHIFT COMPLETE!' : 'SHIFT OVER';
    const lines = state.won
      ? [
        { text: `You served ${state.served} dishes and scored ${state.score} points.`, size: 20, color: '#2b2118', weight: 'bold' },
        { text: '★'.repeat(stars) + '☆'.repeat(3 - stars), size: 34, color: '#f7c948' },
        { text: `Tips earned: ${state.coins} coins · Best: ${Math.max(best, state.score)}`, size: 18 },
        { text: 'The lunch crowd is already asking for tomorrow.', size: 17 },
      ]
      : [
        { text: state.hearts <= 0 ? 'Three tickets walked out — the rush beat you.' : `The shift ended at ${state.score} of ${TARGET_SCORE} points.`, size: 19, color: '#2b2118', weight: 'bold' },
        { text: `You served ${state.served} dishes and lost ${state.lost} tickets.`, size: 18 },
        { text: `Best: ${Math.max(best, state.score)} — one more shift, chef?`, size: 18 },
        { text: 'Tip: grill the next patty while you chop.', size: 17, color: '#8a6d3b' },
      ];
    drawOverlay(title, lines, 'PLAY AGAIN  (R)', LAYOUT.restart);
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, VIEW.width, VIEW.height);
    drawHeader(state);
    if (screen === SCREEN_TITLE) {
      drawTitle(state, best);
      return;
    }
    drawKitchen(state);
    drawBins(state);
    drawOrders(state);
    if (screen === SCREEN_PAUSED) drawPaused();
    else if (screen === SCREEN_OVER) drawOver(state, best);
  }

  return { draw, drawIngredient };
}
