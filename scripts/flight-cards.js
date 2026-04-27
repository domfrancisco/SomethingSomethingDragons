/**
 * Flight card database generation.
 *
 * This file owns the flight-card data model used by main.js.
 */

const FRUIT_ITEMS = ["🍎", "🍊", "🍇"];

/**
 * Generates a random flight card with 3 randomly placed fruit items in a 5x5 grid.
 * @param {number} cardNumber
 * @returns {{ id: string, cardNumber: number, boomCount: number, grid: (string|null)[] }}
 */
function generateFlightCard(cardNumber) {
  const grid = new Array(25).fill(null);
  const boomCount = Math.floor(Math.random() * 3) + 3; // 3-5

  const itemIndices = new Set();
  while (itemIndices.size < 3) {
    itemIndices.add(Math.floor(Math.random() * 25));
  }

  itemIndices.forEach((index) => {
    const randomFruit = FRUIT_ITEMS[Math.floor(Math.random() * FRUIT_ITEMS.length)];
    grid[index] = randomFruit;
  });

  return {
    id: `flight_${cardNumber}`,
    cardNumber,
    boomCount,
    grid,
  };
}

/** Array of 5 pre-generated flight cards. */
const FLIGHT_CARDS_DB = Object.freeze([
  generateFlightCard(1),
  generateFlightCard(2),
  generateFlightCard(3),
  generateFlightCard(4),
  generateFlightCard(5),
]);
