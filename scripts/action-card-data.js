/**
 * Action card data definitions.
 *
 * Schema (per card):
 *   id          string   "<color>_<NN>"
 *   title       string   Card name as printed on the face.
 *   color       string   "green" | "red" | "blue" | "yellow" | "pink" | "colorless"
 *   cardNumber  number   Card # within its color.
 *   power       number   Relative power.
 *   special     string?  If set, the resource block on the face shows this text
 *                        verbatim (with {token} substitutions for icons) instead
 *                        of the numeric resource list.
 *   resources   object   Map of resource key -> count for the MAIN row. Only
 *                        non-zero entries are listed. Keys: attack, movement,
 *                        block, draw, healing, magicGain, selfDamage.
 *   boost       object?  Boost row. Either:
 *                          { count: N, resource: "<key>" }   numeric form
 *                          { special: "text {token}" }       text-only form
 *                        null when the card has no boost row.
 *   boost2      object?  Optional second boost slot, numeric form only:
 *                          { count: N, resource: "<key>" }
 */

/**
 * Map of resource keys used in card data to the icon image base name in
 * the img/ folder (without extension). `null` means renderer falls back to
 * an inline SVG (currently used for `block`).
 */
const RESOURCE_ICON_BY_KEY = Object.freeze({
  attack: "attack",
  movement: "movement",
  block: "block",
  draw: "card",
  healing: "healing",
  magicGain: "magic",
  selfDamage: "self-harm",
});

/**
 * Non-resource tag icons usable as `{token}` substitutions inside special
 * text (e.g. {discard}, {boost}, {enemy}).
 */
const TAG_ICON_BY_KEY = Object.freeze({
  discard: "discard",
  boost: "boost",
  enemy: "enemy",
});

/**
 * Color-name tokens (e.g. {pink}) that render as a colored dot in the
 * size of the surrounding text with a black outline.
 */
const COLOR_DOT_BY_KEY = Object.freeze({
  red: "#d35353",
  green: "#62b86a",
  blue: "#5b9ad8",
  yellow: "#e6c656",
  pink: "#f0a8c8",
  colorless: "#d6d6d6",
});

/** Stable display order for the main resource row. */
const RESOURCE_DISPLAY_ORDER = Object.freeze([
  "attack",
  "movement",
  "block",
  "draw",
  "healing",
  "magicGain",
  "selfDamage",
]);

/**
 * Tokens used inside `special` text and the resource key they map to. The
 * renderer substitutes `{token}` -> matching icon. Unknown tokens render as
 * the raw word with surrounding emphasis.
 */
const RESOURCE_TOKENS = Object.freeze({
  attack: "attack",
  move: "movement",
  movement: "movement",
  speed: "movement",
  block: "block",
  card: "draw",
  draw: "draw",
  health: "healing",
  healing: "healing",
  magic: "magicGain",
  mana: "magicGain",
  damage: "selfDamage",
});

const ACTION_CARD_ROWS = Object.freeze([
  // ── Green Dragon ────────────────────────────────────────────────────────
  { id: "green_1",  title: "Dragon Claw",        color: "green", cardNumber: 1,  power: 2, resources: { attack: 2 },                 boost: { count: 2, resource: "attack" } },
  { id: "green_2",  title: "Quick Stride",       color: "green", cardNumber: 2,  power: 2, resources: { movement: 2 },               boost: { count: 2, resource: "movement" } },
  { id: "green_3",  title: "Savage Bite",        color: "green", cardNumber: 3,  power: 3, resources: { attack: 3, healing: 1 },     boost: { count: 1, resource: "healing" } },
  { id: "green_4",  title: "Wing Glide",         color: "green", cardNumber: 4,  power: 3, resources: { movement: 3, draw: 1 },      boost: { count: 1, resource: "draw" } },
  { id: "green_5",  title: "Scale Guard",        color: "green", cardNumber: 5,  power: 2, resources: { block: 3 },                  boost: { count: 2, resource: "block" } },
  { id: "green_6",  title: "Hunter's Focus",     color: "green", cardNumber: 6,  power: 3, resources: { draw: 1 },                   boost: { count: 2, resource: "attack" } },
  { id: "green_7",  title: "Primal Sprint",      color: "green", cardNumber: 7,  power: 4, resources: { movement: 4 },               boost: { count: 1, resource: "magicGain" } },
  { id: "green_8",  title: "Natural Recovery",   color: "green", cardNumber: 8,  power: 2, resources: { movement: 2, healing: 2 },   boost: { count: 2, resource: "movement" } },
  { id: "green_9",  title: "Wild Charge",        color: "green", cardNumber: 9,  power: 4, resources: { attack: 2, movement: 2 },    boost: { count: 2, resource: "attack" } },
  { id: "green_10", title: "Dragon Instinct",    color: "green", cardNumber: 10, power: 2, resources: { magicGain: 1 },              boost: { count: 1, resource: "draw" } },
  { id: "green_11", title: "Hardened Scales",    color: "green", cardNumber: 11, power: 4, resources: { block: 5, healing: 2 },      boost: { count: 2, resource: "healing" } },
  { id: "green_12", title: "Predator Rush",      color: "green", cardNumber: 12, power: 5, special: "Deal 1 {attack} for each {move} gained this turn", boost: { count: 2, resource: "movement" } },
  { id: "green_13", title: "Ancient Reflexes",   color: "green", cardNumber: 13, power: 4, special: "Draw 2 {card} then discard 1 {card}",              boost: { count: 1, resource: "magicGain" } },
  { id: "green_14", title: "Territorial Fury",   color: "green", cardNumber: 14, power: 5, resources: { attack: 4 },                 boost: { count: 3, resource: "attack" }, boost2: { count: 1, resource: "selfDamage" } },
  { id: "green_15", title: "Elder Dragon Path",  color: "green", cardNumber: 15, power: 5, resources: { movement: 5 },               boost: { count: 3, resource: "attack" } },

  // ── Red Dragon ──────────────────────────────────────────────────────────
  { id: "red_1",   title: "Flame Bolt",          color: "red", cardNumber: 1,  power: 3, special: "Deal 2 {attack} to any {enemy}.",                 boost: { special: "Add 3 {attack} to the attack." } },
  { id: "red_2",   title: "Burning Charge",      color: "red", cardNumber: 2,  power: 4, resources: { attack: 3, movement: 2 },                      boost: { count: 2, resource: "attack" }, boost2: { count: 1, resource: "selfDamage" } },
  { id: "red_3",   title: "Bloodfire Slash",     color: "red", cardNumber: 3,  power: 5, resources: { attack: 5, draw: 1 },                          boost: { count: 1, resource: "draw" }, boost2: { count: 2, resource: "selfDamage" } },
  { id: "red_4",   title: "Inferno Wings",       color: "red", cardNumber: 4,  power: 5, resources: { attack: 2, movement: 4 },                      boost: { special: "Deal 2 {attack} to all {enemy}." } },
  { id: "red_5",   title: "Dragon Rage",         color: "red", cardNumber: 5,  power: 3, resources: { magicGain: 2, selfDamage: 1 },                 boost: { count: 1, resource: "draw" } },
  { id: "red_6",   title: "Scorching Arc",       color: "red", cardNumber: 6,  power: 4, special: "Deal 3 {attack} to any {enemy}.",                 boost: { special: "Deal 2 splash damage." } },
  { id: "red_7",   title: "Reckless Assault",    color: "red", cardNumber: 7,  power: 6, resources: { attack: 7 },                                   boost: { count: 2, resource: "movement" }, boost2: { count: 3, resource: "selfDamage" } },
  { id: "red_8",   title: "Molten Scales",       color: "red", cardNumber: 8,  power: 3, resources: { block: 3 },                                    boost: { special: "Deal 2 {attack} when attacked this turn." } },
  { id: "red_9",   title: "Phoenix Dive",        color: "red", cardNumber: 9,  power: 5, special: "Move to any {enemy} column and deal 4 {attack}.", boost: { count: 2, resource: "healing" } },
  { id: "red_10",  title: "Cinderstorm",         color: "red", cardNumber: 10, power: 5, special: "Deal 2 {attack} to all {enemy}.",                 boost: { special: "Add 2 {attack} to the attack." } },
  { id: "red_11",  title: "Overheat",            color: "red", cardNumber: 11, power: 5, resources: { magicGain: 3 },                                boost: { count: 2, resource: "draw" }, boost2: { count: 2, resource: "selfDamage" } },
  { id: "red_12",  title: "Execution Strike",    color: "red", cardNumber: 12, power: 6, resources: { attack: 4 },                                   boost: { count: 5, resource: "attack" } },
  { id: "red_13",  title: "Hellkite Rush",       color: "red", cardNumber: 13, power: 5, resources: { movement: 5 },                                 boost: { count: 4, resource: "attack" } },
  { id: "red_14",  title: "Ashen Frenzy",        color: "red", cardNumber: 14, power: 7, special: "Deal 3 {attack} to any two {enemy}.",             boost: { special: "Add 3 {attack} to the attack." }, boost2: { count: 2, resource: "selfDamage" } },
  { id: "red_15",  title: "Cataclysm Breath",    color: "red", cardNumber: 15, power: 8, special: "Deal 8 {attack} to any {enemy}.",                 boost: { special: "Deal 3 {attack} to all {enemy}." } },

  // ── Blue Dragon ─────────────────────────────────────────────────────────
  { id: "blue_1",  title: "Mystic Flow",         color: "blue", cardNumber: 1,  power: 2, resources: { magicGain: 2 },               boost: { count: 1, resource: "draw" } },
  { id: "blue_2",  title: "Arcane Step",         color: "blue", cardNumber: 2,  power: 2, resources: { movement: 3 },                boost: { count: 1, resource: "magicGain" } },
  { id: "blue_3",  title: "Mana Surge",          color: "blue", cardNumber: 3,  power: 4, resources: { draw: 2 },                    boost: { count: 2, resource: "magicGain" } },
  { id: "blue_4",  title: "Frost Sigil",         color: "blue", cardNumber: 4,  power: 2, resources: { attack: 2 },                  boost: { count: 1, resource: "draw" } },
  { id: "blue_5",  title: "Meditation",          color: "blue", cardNumber: 5,  power: 3, resources: { healing: 2, magicGain: 1 },   boost: { count: 1, resource: "draw" } },
  { id: "blue_6",  title: "Blink",               color: "blue", cardNumber: 6,  power: 4, resources: { movement: 5 },                boost: { special: "Ignore {enemy} zones this turn" } },
  { id: "blue_7",  title: "Spell Recall",        color: "blue", cardNumber: 7,  power: 5, special: "Search your {discards} for a {card} and draw it.", boost: { count: 1, resource: "magicGain" } },
  { id: "blue_8",  title: "Mana Burst",          color: "blue", cardNumber: 8,  power: 4, resources: { attack: 3 },                  boost: { count: 3, resource: "attack" } },
  { id: "blue_9",  title: "Crystal Focus",       color: "blue", cardNumber: 9,  power: 4, resources: { draw: 1, magicGain: 1 },      boost: { count: 1, resource: "draw" } },
  { id: "blue_10", title: "Arcane Torrent",      color: "blue", cardNumber: 10, power: 4, resources: { attack: 4 },                  boost: { count: 2, resource: "magicGain" } },
  { id: "blue_11", title: "Leyline Drift",       color: "blue", cardNumber: 11, power: 3, resources: { movement: 4 },                boost: { count: 1, resource: "draw" } },
  { id: "blue_12", title: "Spell Echo",          color: "blue", cardNumber: 12, power: 6, special: "Activate your next card twice.", boost: { count: 1, resource: "magicGain" } },
  { id: "blue_13", title: "Mindstorm",           color: "blue", cardNumber: 13, power: 5, resources: { attack: 2, draw: 2 },         boost: { count: 1, resource: "magicGain" } },
  { id: "blue_14", title: "Astral Channel",      color: "blue", cardNumber: 14, power: 6, resources: { magicGain: 4 },               boost: { count: 2, resource: "draw" } },
  { id: "blue_15", title: "Ancient Spellbook",   color: "blue", cardNumber: 15, power: 7, resources: { draw: 3 },                    boost: { special: "Your next {boost} is free." } },

  // ── Yellow Dragon ───────────────────────────────────────────────────────
  { id: "yellow_1",  title: "Golden Sprint",     color: "yellow", cardNumber: 1,  power: 3, resources: { movement: 4 },                  boost: { count: 1, resource: "healing" } },
  { id: "yellow_2",  title: "Radiant Strike",    color: "yellow", cardNumber: 2,  power: 3, resources: { attack: 2, healing: 1 },        boost: { count: 2, resource: "attack" } },
  { id: "yellow_3",  title: "Sunscale Guard",    color: "yellow", cardNumber: 3,  power: 3, resources: { block: 4 },                     boost: { count: 2, resource: "movement" } },
  { id: "yellow_4",  title: "Swift Recovery",    color: "yellow", cardNumber: 4,  power: 3, resources: { healing: 3 },                   boost: { count: 2, resource: "movement" } },
  { id: "yellow_5",  title: "Blinding Dash",     color: "yellow", cardNumber: 5,  power: 4, resources: { movement: 5 },                  boost: { count: 2, resource: "attack" } },
  { id: "yellow_6",  title: "Beacon Pulse",      color: "yellow", cardNumber: 6,  power: 4, resources: { draw: 1, healing: 2 },          boost: { count: 1, resource: "magicGain" } },
  { id: "yellow_7",  title: "Winged Rescue",     color: "yellow", cardNumber: 7,  power: 5, special: "{move} to any open space",         boost: { count: 2, resource: "healing" } },
  { id: "yellow_8",  title: "Renewing Flame",    color: "yellow", cardNumber: 8,  power: 4, resources: { healing: 4 },                   boost: { count: 2, resource: "draw" } },
  { id: "yellow_9",  title: "Solar Charge",      color: "yellow", cardNumber: 9,  power: 5, resources: { attack: 3, movement: 3 },       boost: { count: 2, resource: "healing" } },
  { id: "yellow_10", title: "Sacred Path",       color: "yellow", cardNumber: 10, power: 5, resources: { movement: 6 },                  boost: { count: 2, resource: "magicGain" } },
  { id: "yellow_11", title: "Guardian Light",    color: "yellow", cardNumber: 11, power: 5, resources: { block: 6 },                     boost: { count: 3, resource: "healing" } },
  { id: "yellow_12", title: "Life Pulse",        color: "yellow", cardNumber: 12, power: 6, resources: { healing: 5 },                   boost: { count: 2, resource: "draw" } },
  { id: "yellow_13", title: "Sunflare Wings",    color: "yellow", cardNumber: 13, power: 5, resources: { movement: 4, draw: 1 },         boost: { count: 1, resource: "healing" } },
  { id: "yellow_14", title: "Dawnstrike",        color: "yellow", cardNumber: 14, power: 6, resources: { attack: 5 },                    boost: { count: 5, resource: "healing" } },
  { id: "yellow_15", title: "Celestial Flight",  color: "yellow", cardNumber: 15, power: 8, resources: { movement: 8 },                  boost: { special: "Your next 2 {card} gain their {boost} effects." } },

  // ── Pink Dragon ─────────────────────────────────────────────────────────
  { id: "pink_1",  title: "Momentum Strike",     color: "pink", cardNumber: 1,  power: 3, resources: { attack: 2 },                                       boost: { special: "Plus 1 {attack} for each {pink} {card}." } },
  { id: "pink_2",  title: "Flowstep",            color: "pink", cardNumber: 2,  power: 3, resources: { movement: 3 },                                     boost: { count: 1, resource: "draw" } },
  { id: "pink_3",  title: "Lucky Break",         color: "pink", cardNumber: 3,  power: 4, resources: { draw: 1 },                                         boost: { special: "Reveal the top {card}; if {pink}, draw it and another {card}." } },
  { id: "pink_4",  title: "Chain Assault",       color: "pink", cardNumber: 4,  power: 5, special: "Deal 1 {attack} to 2 {enemy}.",                       boost: { special: "Reveal the top {card}; add its power to the {attack}." } },
  { id: "pink_5",  title: "Flash Rhythm",        color: "pink", cardNumber: 5,  power: 3, resources: { magicGain: 1 },                                    boost: { count: 2, resource: "movement" } },
  { id: "pink_6",  title: "Encore",              color: "pink", cardNumber: 6,  power: 5, special: "Activate your next {card} twice.",                    boost: { count: 1, resource: "draw" } },
  { id: "pink_7",  title: "Wild Swing",          color: "pink", cardNumber: 7,  power: 5, resources: { attack: 4 },                                       boost: { special: "Flip a card; if it lands face up add 4 {attack}." } },
  { id: "pink_8",  title: "Momentum Surge",      color: "pink", cardNumber: 8,  power: 5, special: "Gain 1 {magic} for each {card} played this turn.",    boost: { count: 1, resource: "draw" } },
  { id: "pink_9",  title: "Slipstream",          color: "pink", cardNumber: 9,  power: 5, resources: { movement: 5 },                                     boost: { special: "If another {movement} {card} was played this turn, gain 2 {magic}." } },
  { id: "pink_10", title: "Ricochet Claws",      color: "pink", cardNumber: 10, power: 4, resources: { attack: 4 },                                       boost: { special: "Deal 2 {attack} to a second {enemy} of your choice." } },
  { id: "pink_11", title: "Improvised Maneuver", color: "pink", cardNumber: 11, power: 5, special: "Draw 2 {card} then discard 1 {card}.",                boost: { special: "If discarded {card} was {pink}, gain 1 {magic}" } },
  { id: "pink_12", title: "Combo Finisher",      color: "pink", cardNumber: 12, power: 6, special: "Deal {attack} equal to {card} played this turn.",    boost: { count: 3, resource: "attack" } },
  { id: "pink_13", title: "Adrenaline Rush",     color: "pink", cardNumber: 13, power: 5, resources: { magicGain: 2 },                                    boost: { special: "Lose 1 {health} to draw 2 {card}." } },
  { id: "pink_14", title: "Jackpot Breath",      color: "pink", cardNumber: 14, power: 6, resources: { attack: 3 },                                       boost: { special: "Reveal top {card}; if {pink}, deal +5 {attack}." } },
  { id: "pink_15", title: "Perfect Flow",        color: "pink", cardNumber: 15, power: 8, special: "Your next 2 {boost} are free.",                       boost: { count: 2, resource: "draw" } },

  // ── Colorless ───────────────────────────────────────────────────────────
  { id: "colorless_1", title: "Strike",         color: "colorless", cardNumber: 1, power: 1, resources: { attack: 2 } },
  { id: "colorless_2", title: "March",          color: "colorless", cardNumber: 2, power: 1, resources: { movement: 2 } },
  { id: "colorless_4", title: "Focus",          color: "colorless", cardNumber: 4, power: 2, resources: { draw: 1 } },
  { id: "colorless_5", title: "Recover",        color: "colorless", cardNumber: 5, power: 2, resources: { healing: 2 } },
  { id: "colorless_6", title: "Swift Strike",   color: "colorless", cardNumber: 6, power: 3, resources: { attack: 2, movement: 1 } },
]);

/**
 * Returns a frozen, normalized copy of a row. Adds default `special: null`,
 * `resources: {}`, `boost: null`, `boost2: null` so callers can rely on a
 * stable shape.
 */
function freezeCardDefinition(row) {
  return Object.freeze({
    id: row.id,
    title: row.title,
    color: row.color,
    cardNumber: row.cardNumber,
    power: row.power,
    special: row.special ?? null,
    resources: Object.freeze({ ...(row.resources ?? {}) }),
    boost: row.boost ? Object.freeze({ ...row.boost }) : null,
    boost2: row.boost2 ? Object.freeze({ ...row.boost2 }) : null,
  });
}

const ACTION_CARD_DEFINITIONS = Object.freeze(
  ACTION_CARD_ROWS.reduce((acc, row) => {
    acc[row.id] = freezeCardDefinition(row);
    return acc;
  }, {})
);
