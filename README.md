# Something Something Dragons

UI prototype for a card game concept, built with plain HTML, CSS, and JavaScript.

This project focuses on interaction feel and visual direction before gameplay rules are fully implemented.

## What this prototype includes

- Flight card panel with a rendered coordinate grid
- Action card panel with five card slots
- Deck button that draws new cards with a staggered flip animation
- Card data model and weighted default deck
- Responsive layout and animated background particles
- Menu shell (Info, Save State, Load State, Reset)

## Current goal

Use this UI to quickly test:

- Visual hierarchy and readability
- Card sizing, spacing, and motion timing
- Deck draw cadence and card face transitions
- Overall game table feel on desktop and mobile widths

## Run locally

1. Open `index.html` in your browser.
2. Optional: run any static server in this folder if you prefer local hosting.

## Project structure

- `index.html`: Main page markup
- `styles/main.css`: Layout, theme, and animations
- `scripts/cards.js`: Card definitions, deck utilities, shuffle logic
- `scripts/main.js`: Grid rendering, draw state, and card updates
- `scripts/menu.js`: Menu toggle behavior
- `scripts/particles.js`: Background particle animation

## Notes

- This is a prototype UI, not a complete playable game yet.
- Core game systems (turn flow, win conditions, full card effects) can be layered in next.
