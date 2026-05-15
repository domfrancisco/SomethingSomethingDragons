/**
 * Action deck database definitions.
 *
 * Each colored deck is built from its 15 unique colored cards plus
 * colorless filler. Composition: 2 copies of each colored card (= 30) gives
 * a full deck of the color's cards. Colorless cards are available as
 * neutral filler should custom decks be added later.
 *
 * Add new static decks here. The deck selector is generated from this file.
 */

/** Helper: emit `count` copies of `cardId`. */
function repeatCardId(cardId, count) {
  return Array(count).fill(cardId);
}

/** Builds a 30-card deck containing 2 copies of each card in `colorKey`_1..15. */
function buildPureColorDeck(colorKey) {
  const ids = [];
  for (let n = 1; n <= 15; n++) {
    ids.push(...repeatCardId(`${colorKey}_${n}`, 2));
  }
  return ids;
}

const ACTION_DECK_DATABASE = Object.freeze([
  {
    key: "green",
    label: "Green",
    cardIds: Object.freeze(buildPureColorDeck("green")),
  },
  {
    key: "red",
    label: "Red",
    cardIds: Object.freeze(buildPureColorDeck("red")),
  },
  {
    key: "blue",
    label: "Blue",
    cardIds: Object.freeze(buildPureColorDeck("blue")),
  },
  {
    key: "yellow",
    label: "Yellow",
    cardIds: Object.freeze(buildPureColorDeck("yellow")),
  },
  {
    key: "pink",
    label: "Pink",
    cardIds: Object.freeze(buildPureColorDeck("pink")),
  },
]);

const ACTION_DECK_CARD_IDS_BY_KEY = Object.freeze(
  ACTION_DECK_DATABASE.reduce((acc, deck) => {
    acc[deck.key] = deck.cardIds;
    return acc;
  }, {})
);
