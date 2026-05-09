// Action card deck state, draw logic, and deck-indicator rendering.
// Depends on: dom-refs.js, action-cards.js (shuffleDeck, getActionDeckByKey,
//   DECK_MAX_SIZE), action-deck-data.js (ACTION_DECK_DATABASE,
//   ACTION_DECK_CARD_IDS_BY_KEY), action-card-data.js (getCard).

/** All color classes that may be on an action card shell. */
const COLOR_CLASSES = [
  "action-card-red",
  "action-card-orange",
  "action-card-green",
  "action-card-blue",
  "action-card-pink",
  "action-card-colorless",
];

// ── Deck color picker ──────────────────────────────────────────────────────

function buildDeckColorOptions() {
  if (!deckColorSelect) return;

  const fragment = document.createDocumentFragment();
  const sortedDecks = [...ACTION_DECK_DATABASE].sort((a, b) => a.label.localeCompare(b.label));

  sortedDecks.forEach((deckEntry) => {
    const option = document.createElement("option");
    option.value = deckEntry.key;
    option.textContent = deckEntry.label;
    if (deckEntry.key === "green") option.selected = true;
    fragment.append(option);
  });

  deckColorSelect.replaceChildren(fragment);
}

function normalizeDeckKey(deckKey) {
  if (deckKey === "default") return "green";
  return Object.prototype.hasOwnProperty.call(ACTION_DECK_CARD_IDS_BY_KEY, deckKey)
    ? deckKey
    : "green";
}

// ── Draw + discard piles ───────────────────────────────────────────────────

let activeActionDeckKey = "green";
let activeActionDeck = null;
let drawPile = [];
let drawIndex = 0;

/** Card IDs that have been discarded (no longer displayed). */
let discardPile = [];

/** IDs of cards currently displayed in action card slots. */
let currentActionCardIds = [];

/**
 * Draws the next `count` cards from the pile.
 * If the draw pile runs out mid-draw, the discard pile is shuffled
 * back into a fresh draw pile and drawing continues. Returns fewer cards
 * if the deck and discard combined are exhausted.
 */
function drawCards(count) {
  const drawn = [];
  while (drawn.length < count) {
    if (drawIndex >= drawPile.length) {
      if (discardPile.length === 0) break;
      drawPile = shuffleArray([...discardPile]);
      discardPile = [];
      drawIndex = 0;
    }
    const cardId = drawPile[drawIndex++];
    drawn.push(getCard(cardId));
  }
  return drawn;
}

// ── Draw-resource counting ─────────────────────────────────────────────────

/**
 * Returns the total number of "draw" pips on the MAIN row only.
 * Boost-row draw pips are click-only and never auto-drawn.
 */
function getMainDrawCountForCard(cardData) {
  if (!cardData) return 0;
  let total = 0;
  if (cardData.resource === "draw" && typeof cardData.count === "number" && cardData.count > 0) {
    total += cardData.count;
  }
  if (cardData.resource2 === "draw" && typeof cardData.count2 === "number" && cardData.count2 > 0) {
    total += cardData.count2;
  }
  return total;
}

/**
 * Returns the total number of "draw" pips on a card across both rows.
 * (Currently unused but retained as a public utility.)
 */
function getDrawCountForCard(cardData) {
  if (!cardData) return 0;
  const fields = [
    [cardData.count, cardData.resource],
    [cardData.count2, cardData.resource2],
    [cardData.boostCount, cardData.boostResource],
    [cardData.boostCount2, cardData.boostResource2],
  ];
  let total = 0;
  for (const [c, r] of fields) {
    if (r === "draw" && typeof c === "number" && c > 0) total += c;
  }
  return total;
}

// ── Deck indicator render ──────────────────────────────────────────────────

function renderDeckIndicator() {
  const cardsRemaining = Math.max(0, drawPile.length - drawIndex);
  const cardsInDiscard = Math.max(0, Math.min(discardPile.length, DECK_MAX_SIZE));

  if (deckStackVisual) deckStackVisual.replaceChildren();
  if (discardStackVisual) discardStackVisual.replaceChildren();

  for (let i = 0; i < cardsRemaining; i++) {
    const rect = document.createElement("div");
    rect.className = "card-rect";
    deckStackVisual?.append(rect);
  }
  for (let i = 0; i < cardsInDiscard; i++) {
    const rect = document.createElement("div");
    rect.className = "card-rect";
    discardStackVisual?.append(rect);
  }

  // Compute min-height so the stacks visibly grow/shrink.
  // Each card is 0.3rem tall with 2px overlap (except the first).
  const cardHeightRem = 0.3;
  const overlapPx = 2;
  const pxPerRem = 16;
  const calcHeight = (count) => {
    if (count === 0) return "0";
    const totalPx = (cardHeightRem * count * pxPerRem) - (overlapPx * Math.max(0, count - 1));
    return (totalPx / pxPerRem).toFixed(3) + "rem";
  };
  if (deckStackVisual) deckStackVisual.style.minHeight = calcHeight(cardsRemaining);
  if (discardStackVisual) discardStackVisual.style.minHeight = calcHeight(cardsInDiscard);

  if (deckCounter) {
    deckCounter.textContent = `${cardsRemaining}/${DECK_MAX_SIZE}`;
  }
}
