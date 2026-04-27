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

/** Base pool of 5 flight cards. */
const FLIGHT_CARDS_DB = Object.freeze([
  {
    id: "flight_1",
    cardNumber: 1,
    boomCount: 3,
    grid: createFlightGrid([
      [1, "🍎"],
      [12, "🍊"],
      [23, "🍇"],
    ]),
  },
  {
    id: "flight_2",
    cardNumber: 2,
    boomCount: 4,
    grid: createFlightGrid([
      [4, "🍇"],
      [10, "🍎"],
      [17, "🍊"],
    ]),
  },
  {
    id: "flight_3",
    cardNumber: 3,
    boomCount: 5,
    grid: createFlightGrid([
      [0, "🍊"],
      [8, "🍇"],
      [21, "🍎"],
    ]),
  },
  {
    id: "flight_4",
    cardNumber: 4,
    boomCount: 3,
    grid: createFlightGrid([
      [6, "🍎"],
      [14, "🍇"],
      [24, "🍊"],
    ]),
  },
  {
    id: "flight_5",
    cardNumber: 5,
    boomCount: 4,
    grid: createFlightGrid([
      [2, "🍇"],
      [11, "🍊"],
      [20, "🍎"],
    ]),
  },
]);

/** Total cards in a generated flight deck. */
const FLIGHT_DECK_SIZE = 10;

/** Maximum copies of the same base flight card in one generated deck. */
const FLIGHT_MAX_COPIES_PER_CARD = 3;

/**
 * Builds a random 10-card flight deck from the 5-card base pool.
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
