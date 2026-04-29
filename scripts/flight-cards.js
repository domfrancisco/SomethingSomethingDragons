/**
 * Flight card database.
 *
 * This file owns the flight-card data model used by main.js.
 * Base cards are static; playable flight decks are generated from this base.
 */

/**
 * Creates a 5x5 flight grid (25 cells) from [index, value] pairs.
 * @param {Array<[number, string]>} entries
 * @returns {(string|null)[]}
 */
function createFlightGrid(entries) {
  const grid = new Array(25).fill(null);
  entries.forEach(([index, value]) => {
    grid[index] = value;
  });
  return grid;
}

/** Base pool of 6 flight cards (2x each insect type). */
const FLIGHT_CARDS_DB = Object.freeze([
  {
    id: "flight_1",
    cardNumber: 1,
    boomCount: 4,
    grid: createFlightGrid([
      // Fly card A: two vertical groups (3 and 2), plus one apple.
      [0, "🪰"],
      [5, "🪰"],
      [10, "🪰"],
      [3, "🪰"],
      [8, "🪰"],
      [22, "🍎"],
    ]),
  },
  {
    id: "flight_2",
    cardNumber: 2,
    boomCount: 4,
    grid: createFlightGrid([
      // Fly card B: two vertical groups (2 and 3).
      [1, "🪰"],
      [6, "🪰"],
      [4, "🪰"],
      [9, "🪰"],
      [14, "🪰"],
    ]),
  },
  {
    id: "flight_3",
    cardNumber: 3,
    boomCount: 5,
    grid: createFlightGrid([
      // Mosquito card A: sine-wave-like path across columns, plus one apple.
      [10, "🦟"],
      [6, "🦟"],
      [2, "🦟"],
      [8, "🦟"],
      [14, "🦟"],
      [24, "🍎"],
    ]),
  },
  {
    id: "flight_4",
    cardNumber: 4,
    boomCount: 5,
    grid: createFlightGrid([
      // Mosquito card B: mirrored sine-wave-like path.
      [0, "🦟"],
      [6, "🦟"],
      [12, "🦟"],
      [8, "🦟"],
      [4, "🦟"],
    ]),
  },
  {
    id: "flight_5",
    cardNumber: 5,
    boomCount: 5,
    grid: createFlightGrid([
      // Honeybee card A: one horizontal line above bottom row, plus one apple.
      [15, "🐝"],
      [16, "🐝"],
      [17, "🐝"],
      [18, "🐝"],
      [19, "🐝"],
      [7, "🍎"],
    ]),
  },
  {
    id: "flight_6",
    cardNumber: 6,
    boomCount: 5,
    grid: createFlightGrid([
      // Honeybee card B: one horizontal line above bottom row.
      [10, "🐝"],
      [11, "🐝"],
      [12, "🐝"],
      [13, "🐝"],
      [14, "🐝"],
    ]),
  },
]);

/** Total cards in a generated flight deck. */
const FLIGHT_DECK_SIZE = 10;

/** Maximum copies of the same base flight card in one generated deck. */
const FLIGHT_MAX_COPIES_PER_CARD = 3;

/**
 * Builds a random 10-card flight deck from the 6-card base pool.
 * Allows duplicates, but no card can appear more than 3 times.
 *
 * @returns {Array<{ id: string, cardNumber: number, boomCount: number, grid: (string|null)[] }>}
 */
function createFlightDeck() {
  const counts = new Map();
  const deck = [];

  while (deck.length < FLIGHT_DECK_SIZE) {
    const eligible = FLIGHT_CARDS_DB.filter((card) => {
      return (counts.get(card.id) ?? 0) < FLIGHT_MAX_COPIES_PER_CARD;
    });

    if (eligible.length === 0) break;

    const picked = eligible[Math.floor(Math.random() * eligible.length)];
    counts.set(picked.id, (counts.get(picked.id) ?? 0) + 1);

    // Clone to keep generated deck entries independent from base references.
    deck.push({
      id: picked.id,
      cardNumber: picked.cardNumber,
      boomCount: picked.boomCount,
      grid: [...picked.grid],
    });
  }

  return deck;
}
