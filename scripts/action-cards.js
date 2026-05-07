/**
 * Action card deck utilities and DOM factories.
 *
 * Data lives in action-card-data.js.
 */

const ACTION_CARD_SLOT_COUNT = 5;

/** Maximum cards allowed in a single deck. */
const DECK_MAX_SIZE = 30;

/**
 * Creates a new empty deck.
 * @param {string} name - Human-readable deck name.
 * @returns {{ name: string, cards: string[] }}
 */
function createDeck(name) {
  return { name, cards: [] };
}

/**
 * Adds one copy of a card to a deck.
 * @param {{ name: string, cards: string[] }} deck
 * @param {string} cardId
 * @returns {boolean}
 */
function addCardToDeck(deck, cardId) {
  if (!ACTION_CARD_DEFINITIONS[cardId]) {
    console.warn(`addCardToDeck: unknown card id "${cardId}"`);
    return false;
  }
  if (deck.cards.length >= DECK_MAX_SIZE) {
    console.warn(`addCardToDeck: deck "${deck.name}" is full (${DECK_MAX_SIZE} cards)`);
    return false;
  }
  deck.cards.push(cardId);
  return true;
}

/**
 * Removes one copy of a card from a deck.
 * @param {{ name: string, cards: string[] }} deck
 * @param {string} cardId
 * @returns {boolean}
 */
function removeCardFromDeck(deck, cardId) {
  const index = deck.cards.indexOf(cardId);
  if (index === -1) {
    return false;
  }
  deck.cards.splice(index, 1);
  return true;
}

/**
 * Returns the count of each card id in a deck.
 * @param {{ cards: string[] }} deck
 * @returns {Record<string, number>}
 */
function getDeckCounts(deck) {
  return deck.cards.reduce((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
}

/**
 * Resolves a card id to its full definition from ACTION_CARD_DEFINITIONS.
 * @param {string} cardId
 * @returns {{ id: string, title: string, text: string, color: string, power: number, count: number|null, resource: string|null, boostCount: number|null, boostResource: string|null, count2: number|null, resource2: string|null, boostCount2: number|null, boostResource2: string|null, count3: number|null, resource3: string|null, count4: number|null, resource4: string|null } | undefined}
 */
function getCard(cardId) {
  return ACTION_CARD_DEFINITIONS[cardId];
}

/**
 * Shuffles an array in-place using Fisher-Yates and returns it.
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Returns a new shuffled copy of the deck's card list.
 * @param {{ cards: string[] }} deck
 * @returns {string[]}
 */
function shuffleDeck(deck) {
  return shuffleArray([...deck.cards]);
}

function createDeckFromCardIds(name, cardIds) {
  const deck = createDeck(name);
  cardIds.forEach((id) => addCardToDeck(deck, id));
  return deck;
}

const ACTION_DECKS_BY_KEY = Object.freeze(
  ACTION_DECK_DATABASE.reduce((acc, deckEntry) => {
    acc[deckEntry.key] = createDeckFromCardIds(deckEntry.label, deckEntry.cardIds);
    return acc;
  }, {})
);

function getActionDeckByKey(deckKey) {
  return ACTION_DECKS_BY_KEY[deckKey] ?? ACTION_DECKS_BY_KEY.green;
}

const defaultDeck = ACTION_DECKS_BY_KEY.green;

function createActionCardShell() {
  const article = document.createElement("article");
  article.className = "app-shell action-card-shell";

  const section = document.createElement("section");
  section.className = "action-card-content";

  const title = document.createElement("h2");
  title.className = "action-title";
  title.setAttribute("aria-label", "");

  const titleSpace = document.createElement("span");
  titleSpace.className = "action-title-space";

  const titleDiscovery = document.createElement("span");
  titleDiscovery.className = "action-title-discovery";

  title.append(titleSpace, titleDiscovery);

  const powerBadge = document.createElement("div");
  powerBadge.className = "action-power-badge";

  const powerBadgeCircle = document.createElement("div");
  powerBadgeCircle.className = "action-power-badge-circle";

  const powerBadgeNumber = document.createElement("div");
  powerBadgeNumber.className = "action-power-badge-number";

  powerBadgeCircle.append(powerBadgeNumber);
  powerBadge.append(powerBadgeCircle);
  title.append(powerBadge);

  const image = document.createElement("div");
  image.className = "action-card-image";

  const body = document.createElement("div");
  body.className = "action-card-body";

  const paragraph = document.createElement("p");
  body.append(paragraph);

  section.append(title, image, body);
  article.append(section);
  return article;
}

function createActionCardShells(count = ACTION_CARD_SLOT_COUNT) {
  return Array.from({ length: count }, () => createActionCardShell());
}
