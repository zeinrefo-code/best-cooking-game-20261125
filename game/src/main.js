// Boot and the one loop: input is read every frame, the kitchen advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between four screens: title, play, paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=cover|orders|serve|end|title (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createKitchen, EVENT_BURNT, EVENT_EXPIRED, EVENT_SHIFT_END } from './kitchen.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const kitchen = createKitchen(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

// Exposed for play-testing: the harness reads the state, never the player.
let screen = SCREEN_TITLE;
window.__game = { kitchen, get screen() { return screen; } };

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, kitchen);
  let painted = 0;
  function paint() {
    renderer.draw(kitchen.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, kitchen);
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastTickSecond = -1;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    kitchen.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Playing. Build the dishes on the order board.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (kitchen.state.score > best) {
      best = kitchen.state.score;
      saveBest(best);
    }
    if (kitchen.state.won) audio.win();
    else audio.over();
    announce(kitchen.state.won
      ? `Shift complete! Score ${kitchen.state.score}.`
      : `Shift over. Score ${kitchen.state.score}. Best ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_EXPIRED) audio.error();
    if (events & EVENT_BURNT) audio.error();
    if (events & EVENT_SHIFT_END) endGame();
  }

  function handleActions() {
    const flags = input.takeActions();
    if (flags & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (flags & ACTION_RESTART && (screen === SCREEN_PLAY || screen === SCREEN_OVER)) startGame();
    else if (flags & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame();
    else if (flags & ACTION_CONFIRM && screen === SCREEN_PLAY) kitchen.serve();
    else if (flags & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (flags & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) return;
    const events = kitchen.step(STEP);
    const secondsLeft = Math.ceil(kitchen.state.timeLeft);
    if (secondsLeft <= 10 && secondsLeft !== lastTickSecond && secondsLeft > 0) {
      lastTickSecond = secondsLeft;
      audio.tick();
    }
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    input.takeClicks();
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(kitchen.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting tickets expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Enter or click to start your shift.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
