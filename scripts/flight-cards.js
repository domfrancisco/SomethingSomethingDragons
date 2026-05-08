/**
 * Flight card deck utilities and DOM factories.
 *
 * Data lives in flight-card-data.js.
 */

const FLIGHT_STACK_SLOT_COUNT = 10;

/**
 * Creates a 6x4 flight grid (24 cells) from [index, value] pairs.
 * @param {Array<[number, string]>} entries
 * @returns {(string|null)[]}
 */
function createFlightGrid(entries) {
  const grid = new Array(24).fill(null);
  entries.forEach(([index, value]) => {
    if (index >= 0 && index < grid.length) {
      grid[index] = value;
    }
  });
  return grid;
}

/** Base pool of 6 flight cards (2x each insect type). */
const FLIGHT_CARDS_DB = Object.freeze(
  FLIGHT_CARD_DEFINITIONS.map((card) => Object.freeze({
    id: card.id,
    cardNumber: card.cardNumber,
    boomCount: card.boomCount,
    grid: createFlightGrid(card.entries),
  }))
);

/** Total cards in a generated flight deck. */
const FLIGHT_DECK_SIZE = 10;

/** Maximum copies of the same base flight card in one generated deck. */
const FLIGHT_MAX_COPIES_PER_CARD = 3;

function createFlightCardContainer(index) {
  const container = document.createElement("div");
  container.className = "flight-card-container";
  container.setAttribute("data-card-index", String(index));

  const header = document.createElement("div");
  header.className = "flight-card-header";

  const number = document.createElement("p");
  number.className = "flight-card-number";
  header.append(number);

  const scroll = document.createElement("div");
  scroll.className = "flight-grid-scroll";

  const frame = document.createElement("div");
  frame.className = "flight-grid-frame";

  const grid = document.createElement("div");
  grid.className = "flight-grid";
  grid.setAttribute("aria-label", "Flight card coordinate grid");
  frame.append(grid);
  scroll.append(frame);

  const footer = document.createElement("div");
  footer.className = "flight-card-footer";

  const title = document.createElement("h2");
  title.className = "flight-title";
  title.setAttribute("aria-label", "Flight Card");

  const titleBlock = document.createElement("span");
  titleBlock.className = "flight-title-block";
  titleBlock.textContent = "Flight Card";

  const titleMelt = document.createElement("span");
  titleMelt.className = "flight-title-melt";
  titleMelt.textContent = "Flight Card";

  title.append(titleBlock, titleMelt);

  const boomGroup = document.createElement("div");
  boomGroup.className = "flight-card-boom-group";

  const boomCount = document.createElement("p");
  boomCount.className = "flight-card-boom-count";

  const boomIcon = document.createElement("img");
  boomIcon.className = "boom-icon";
  boomIcon.src = "./img/damage.png";
  boomIcon.alt = "";
  boomIcon.setAttribute("aria-hidden", "true");

  boomGroup.append(boomCount, boomIcon);
  footer.append(title, boomGroup);
  container.append(header, scroll, footer);
  return container;
}

function createFlightCardContainers(count = FLIGHT_STACK_SLOT_COUNT) {
  return Array.from({ length: count }, (_, index) => createFlightCardContainer(index));
}

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
