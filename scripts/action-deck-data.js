/**
 * Action deck database definitions.
 *
 * Schema (per deck):
 *   key            string   stable id used in selectors / saves
 *   label          string   raw display name (e.g. "Basic Green")
 *   entries        array    structured composition:
 *                              { id: <cardId>, count: <number>, base: <boolean> }
 *   cardIds        array    flat list of card ids (derived from entries:
 *                              each entry contributes `count` copies)
 *   nonBasePower   number   sum of (card.power * count) for every entry where
 *                              base === false. Shown in selector as "(N)"
 *                              after the label when > 0.
 *
 * To add a new deck from card-decks.xlsx, append a new buildDeck(...) call
 * below. Pure-color decks are kept as legacy "all non-base" decks via
 * buildPureColorEntries(colorKey).
 */

/** Helper: emit `count` copies of `cardId`. */
function repeatCardId(cardId, count) {
  return Array(count).fill(cardId);
}

/**
 * Normalize a shorthand entry list. Defaults: count=1, base=false.
 */
function normalizeEntries(entries) {
  return entries.map((e) => ({
    id: e.id,
    count: typeof e.count === "number" ? e.count : 1,
    base: !!e.base,
  }));
}

/** Returns the flat card-id list (with duplicates) from entries. */
function entriesToCardIds(entries) {
  const ids = [];
  for (const e of entries) {
    for (let i = 0; i < e.count; i++) ids.push(e.id);
  }
  return ids;
}

/**
 * Sums power across non-base entries:
 *   sum( card.power * entry.count )  for entries where base === false.
 * Cards missing from ACTION_CARD_DEFINITIONS contribute 0.
 */
function computeNonBasePower(entries) {
  let total = 0;
  for (const e of entries) {
    if (e.base) continue;
    const card = (typeof ACTION_CARD_DEFINITIONS !== "undefined")
      ? ACTION_CARD_DEFINITIONS[e.id]
      : null;
    if (!card || typeof card.power !== "number") continue;
    total += card.power * e.count;
  }
  return total;
}

/** Builds legacy pure-color entries: 2 copies of cards 1..15, all non-base. */
function buildPureColorEntries(colorKey) {
  const entries = [];
  for (let n = 1; n <= 15; n++) {
    entries.push({ id: `${colorKey}_${n}`, count: 2, base: false });
  }
  return entries;
}

/** Freezes a deck record and derives cardIds + nonBasePower from entries. */
function buildDeck(key, label, entries) {
  const normalized = normalizeEntries(entries);
  const cardIds = entriesToCardIds(normalized);
  const nonBasePower = computeNonBasePower(normalized);
  return Object.freeze({
    key,
    label,
    entries: Object.freeze(normalized.map((e) => Object.freeze(e))),
    cardIds: Object.freeze(cardIds),
    nonBasePower,
  });
}

const ACTION_DECK_DATABASE = Object.freeze([
  buildDeck("green",  "Green",  buildPureColorEntries("green")),
  buildDeck("red",    "Red",    buildPureColorEntries("red")),
  buildDeck("blue",   "Blue",   buildPureColorEntries("blue")),
  buildDeck("yellow", "Yellow", buildPureColorEntries("yellow")),
  buildDeck("pink",   "Pink",   buildPureColorEntries("pink")),

  // ── Imported from card-decks.xlsx ───────────────────────────────────────
  buildDeck("basic-green", "Basic Green", [
    { id: "colorless_1", count: 3, base: true },
    { id: "colorless_2", count: 3, base: true },
    { id: "colorless_3", count: 2, base: true },
    { id: "colorless_4", count: 2, base: true },
    { id: "colorless_5", count: 2, base: true },
    { id: "green_3",     count: 3, base: true },
    { id: "green_1",     count: 3, base: false },
    { id: "green_2",     count: 3, base: false },
    { id: "green_4",     count: 2, base: false },
    { id: "green_5",     count: 3, base: false },
    { id: "blue_4",      count: 3, base: false },
  ]),
]);

const ACTION_DECK_CARD_IDS_BY_KEY = Object.freeze(
  ACTION_DECK_DATABASE.reduce((acc, deck) => {
    acc[deck.key] = deck.cardIds;
    return acc;
  }, {})
);

/**
 * Display label including the non-base power total in parens when > 0.
 *   "Basic Green (30)" / "Green (90)" / "Some Deck" (no parens when 0)
 */
function getDeckDisplayLabel(deckEntry) {
  if (!deckEntry) return "";
  return deckEntry.nonBasePower > 0
    ? `${deckEntry.label} (${deckEntry.nonBasePower})`
    : deckEntry.label;
}
