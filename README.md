# react-keys-demo

A small interactive teaching demo for the React docs section
[**Option 2: Resetting state with a key**](https://react.dev/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key).

Each demo shows a live behaviour **and** the JSX diff right underneath, with the relevant line highlighted, so the cause-and-effect of the `key` prop is unambiguous.

## What's in here

1. **Scoreboard** — `<Counter person={person} />` rendered with vs. without `key={person}`. Click "Add one" on both, then "Next player" — the unkeyed counter keeps its score, the keyed one resets.

2. **Messenger** — type a draft, switch recipient. Toggle whether `<Chat>` carries `key={to.id}` and feel the bug (draft leaks across recipients) and the fix (draft clears).

3. **Picking the right `key` — value *and* placement** — based on a real PR review where a contributor suggested using `` key={`${step.id}-${status}`} `` to remount a `StepComponent`. Three side-by-side instances:
   - **A. No key** — never resets.
   - **B. `key={status}`** — resets when status flips, **misses** the "cancel & restart" transition that re-enters the same status.
   - **C. `key={remountKey}` (a transition counter)** — resets on every transition the parent fires.

   The third demo also contrasts placing the key on a wrapping `<div>` vs. on the `StepComponent` call site, and explains why React's docs recommend the latter when the goal is "reset this component's state".

## Run

```bash
npm install
npm start
```

That runs [`live-server`](https://www.npmjs.com/package/live-server) on port `5173` and opens the demo in your browser. Edits to `app.jsx`, `styles.css`, or `index.html` reload automatically.

## How it works (no bundler)

- React + ReactDOM are loaded from a CDN.
- `app.jsx` is compiled in the browser by `@babel/standalone`. Convenient for a docs-style demo, **never** appropriate for production. (You'll see Babel's own warning to that effect in the console.)

## Files

- `index.html` — entry, loads React + Babel standalone.
- `app.jsx` — `Counter`, `ScoreboardDemo`, `Chat`, `MessengerDemo`, `StepComponent`, `StepKeysDemo`, plus a tiny `Code` helper for the highlighted snippets.
- `styles.css` — minimal light/dark styling, plus the highlighted code-block styling.

## The teaching point of demo 3 in one sentence

> A `key` is React's way of saying "this is a different instance"; it has to be (1) on the component you want to remount, and (2) a value that actually changes for every transition you want to treat as a remount — state-derived keys can silently repeat and let stale state survive.
