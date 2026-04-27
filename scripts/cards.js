/**
 * Card database.
 * Each entry defines a unique card type.
 *
 * Properties:
 *   id     {string}  - Stable unique identifier used for lookups and deck references.
 *   text   {string}  - Display name shown on the card.
 *   color  {string}  - Matches the action-card-* CSS class suffix (red, orange, green, blue, pink).
 */
const CARD_DB = Object.freeze({
  attack_1: { id: "attack_1", text: "Attack 1", color: "red" },
  attack_2: { id: "attack_2", text: "Attack 2", color: "red" },
  move_1:   { id: "move_1",   text: "Move 1",   color: "green" },
  move_2:   { id: "move_2",   text: "Move 2",   color: "green" },
  heal_1:   { id: "heal_1",   text: "Heal 1",   color: "pink" },
  freeze_1: { id: "freeze_1", text: "Freeze 1", color: "blue" },
  blast:    { id: "blast",    text: "Blast",     color: "orange" },
});

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
 * Returns true if the card was added, false if the deck is already full
 * or the card id is not in the database.
 *
 * @param {{ name: string, cards: string[] }} deck
 * @param {string} cardId
 * @returns {boolean}
 */
function addCardToDeck(deck, cardId) {
  if (!CARD_DB[cardId]) {
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
 * Returns true if a copy was found and removed.
 *
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
 * Resolves a card id to its full definition from CARD_DB.
 * @param {string} cardId
 * @returns {{ id: string, text: string, color: string } | undefined}
 */
function getCard(cardId) {
  return CARD_DB[cardId];
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

/**
 * Default deck - 30 cards.
 * attack_1 x8, move_1 x8, attack_2 x4, move_2 x4, heal_1 x3, freeze_1 x2, blast x1
 */
const defaultDeck = createDeck("Default");

[
  ...Array(8).fill("attack_1"),
  ...Array(8).fill("move_1"),
  ...Array(4).fill("attack_2"),
  ...Array(4).fill("move_2"),
  ...Array(3).fill("heal_1"),
  ...Array(2).fill("freeze_1"),
  ...Array(1).fill("blast"),
].forEach((id) => addCardToDeck(defaultDeck, id));
