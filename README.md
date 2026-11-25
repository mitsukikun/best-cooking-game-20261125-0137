# Dapur Kilat

A fast-paced 2D canvas cooking game: grab ingredients, chop, cook, assemble dishes and serve orders before their timers run out. Built for the make.fun "Make the best cooking game" bounty.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests — everything is static files under `game/`.

## How to play

- Click an ingredient bin (or press keys 1–6) to pick it up.
- Chopping board: place chicken or veg, then click / press Space 4× to chop.
- Stove: place food to cook; pick it up when the bar is full.
- Plating counter: stack the recipe's components; a finished dish appears when they match.
- Serving window: click with a finished dish to serve the matching order.
- Serve fast for tips, chain on-time serves for a combo multiplier. Shift lasts 3 minutes.

## Screenshot presets

`?shot=cover`, `?shot=chop`, `?shot=assembly`, `?shot=serve` stage deterministic scenes. `?test=1` runs a scripted full-order play-test and reports the result.

## License

MIT — see LICENSE.
