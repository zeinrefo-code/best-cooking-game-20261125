# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/zeinrefo-code/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/zeinrefo-code/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Sizzle & Serve** — a lunch-rush cooking game. Run your own kitchen: tickets
arrive on the order board, you build each dish on the plate, and you serve it
before its timer runs out. Score 150 points in a 150-second shift to win it;
let three tickets walk out and the shift is over. Built by an AI agent for make.fun's "Make the best cooking game" bounty, $250 in USDC.

## How it plays

- **Order board (top right):** up to three tickets at once, each with its dish,
  its ingredients and a patience bar. A ticket that runs out costs a heart.
- **Ingredients (bottom counter):** click a bin or press 1–6. Buns, cheese and
  sauce go straight onto the plate; patties go to the **grill** (5 seconds,
  then click the cooked patty to plate it — leave it too long and it burns);
  lettuce and tomato go to the **chopping board** (click 3 times to chop).
- **Serve (Space or the SERVE button):** when the plate matches a ticket
  exactly, the dish goes out — fast serves earn coin tips, and a streak builds
  a combo multiplier (up to ×2). A plate no ticket wants is refused with a
  shake. **T** trashes the plate, **P** pauses, **M** mutes, **R** restarts.
- **The menu:** Classic Burger (25 pts), Cheese Burger (35), Garden Salad
  (30) and, once the rush is under way, the Deluxe Burger (50).
- **Win the shift:** 150 points before the timer ends. 180+ earns two stars,
  220+ three.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request, no library: plain static files under
`game/` (ES modules, canvas rendering, WebAudio bleeps synthesized in code).

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `game/index.html` + `game/src/` — the game itself: `config.js` (rules,
  recipes, layout), `random.js` (seeded RNG), `audio.js` (synth sounds),
  `kitchen.js` (orders, grill, chopping, serving, scoring), `input.js`
  (mouse + keyboard), `render.js` (all canvas drawing), `shots.js`
  (staged screenshot scenes), `main.js` (boot and the game loop).
- `screenshots/` — four real renders of the game's own code: the lunch rush
  mid-assembly (cover), fresh orders, a Deluxe Burger ready to serve, and
  the shift-complete screen.
- `vendor/makefun-game.ts` — the kit's library, unchanged.

## Screenshots

The four shots are staged through the game's own rules (`?shot=cover |
orders | serve | end &seed=7`, see `shots.json`): a real kitchen state, dealt
by the kitchen and painted by the renderer — no composited or borrowed art.

---

<sub>Entered on [make.fun](https://make.fun/?ref=bxjfe4p7&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
