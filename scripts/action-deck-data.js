/**
 * Action deck database definitions.
 *
 * Add new static decks here. The deck selector is generated from this file.
 */

const ACTION_DECK_DATABASE = Object.freeze([
  {
    key: "green",
    label: "Green",
    cardIds: Object.freeze([
      // Colorless low-power core.
      ...Array(6).fill("colorless_1"),
      ...Array(6).fill("colorless_3"),
      ...Array(4).fill("colorless_2"),
      ...Array(4).fill("colorless_4"),
      ...Array(2).fill("colorless_5"),

      // Smaller green package, still weighted to lower power.
      ...Array(4).fill("green_1"),
      ...Array(2).fill("green_2"),
      ...Array(1).fill("green_3"),
      ...Array(1).fill("green_4"),
    ]),
  },
  {
    key: "orange",
    label: "Orange",
    cardIds: Object.freeze([
      ...Array(6).fill("orange_1"),
      ...Array(5).fill("orange_2"),
      ...Array(4).fill("orange_3"),
      ...Array(4).fill("orange_4"),
      ...Array(3).fill("orange_4_2"),
      ...Array(3).fill("orange_5"),
      ...Array(3).fill("orange_6"),
      ...Array(2).fill("orange_7"),
    ]),
  },
  {
    key: "blue",
    label: "Blue",
    cardIds: Object.freeze([
      ...Array(6).fill("blue_1"),
      ...Array(5).fill("blue_2"),
      ...Array(5).fill("blue_3"),
      ...Array(3).fill("blue_3_2"),
      ...Array(4).fill("blue_4"),
      ...Array(3).fill("blue_5"),
      ...Array(2).fill("blue_6"),
      ...Array(2).fill("blue_8"),
    ]),
  },
  {
    key: "red",
    label: "Red",
    cardIds: Object.freeze([
      ...Array(7).fill("red_1"),
      ...Array(6).fill("red_2"),
      ...Array(5).fill("red_3"),
      ...Array(5).fill("red_4"),
      ...Array(4).fill("red_5"),
      ...Array(3).fill("red_6"),
    ]),
  },
]);

const ACTION_DECK_CARD_IDS_BY_KEY = Object.freeze(
  ACTION_DECK_DATABASE.reduce((acc, deck) => {
    acc[deck.key] = deck.cardIds;
    return acc;
  }, {})
);
