/**
 * Monster (flight grid enemy) database.
 *
 * Two layers of keys:
 *
 *   1. Legacy keys (enemy1/2/3) still used by flight-card-data.js for
 *      placeholder grid encounters. Preserved verbatim.
 *
 *   2. Per-enemy keys imported one-time from data/enemy-data.xlsx:
 *        colorless_1..4   — neutral enemies, art ./img/colorless_01.png etc.
 *        <color>_1..9     — one per color (green/red/blue/yellow/pink).
 *      Each entry is stored individually (not built from a template) so
 *      individual stats can be hand-tuned later without ripple effects.
 *
 * Entry shape:
 *   { color, power, health, special? }
 *   `defense` is exposed as an alias of `health` for back-compat with the
 *   existing shield-badge renderer in flight.js.
 *
 * `color` matches the action-card color tokens defined in styles/main.css
 * (e.g. "red", "green", "pink").
 */

/** Freezes a monster record and adds `defense` alias of `health`. */
function freezeMonster(entry) {
  const out = {
    color: entry.color,
    power: entry.power,
    health: entry.health,
    defense: entry.health,
    special: entry.special || null,
  };
  return Object.freeze(out);
}

const MONSTER_DEFINITIONS = Object.freeze({
  // ── Legacy placeholder keys (referenced by flight-card-data.js) ─────────
  enemy1: freezeMonster({ color: "red",   power: 3, health: 3 }),
  enemy2: freezeMonster({ color: "green", power: 3, health: 3 }),
  enemy3: freezeMonster({ color: "pink",  power: 3, health: 3 }),

  // ── Colorless (4) ───────────────────────────────────────────────────────
  colorless_1: freezeMonster({ color: "colorless", power: 1, health: 1 }),
  colorless_2: freezeMonster({ color: "colorless", power: 1, health: 1 }),
  colorless_3: freezeMonster({ color: "colorless", power: 2, health: 2 }),
  colorless_4: freezeMonster({ color: "colorless", power: 2, health: 2 }),

  // ── Green (1..9) ────────────────────────────────────────────────────────
  green_1: freezeMonster({ color: "green", power: 2, health: 3 }),
  green_2: freezeMonster({ color: "green", power: 2, health: 1, special: "range" }),
  green_3: freezeMonster({ color: "green", power: 1, health: 2, special: "escalate" }),
  green_4: freezeMonster({ color: "green", power: 1, health: 5 }),
  green_5: freezeMonster({ color: "green", power: 4, health: 2, special: "quick" }),
  green_6: freezeMonster({ color: "green", power: 3, health: 4, special: "poison" }),
  green_7: freezeMonster({ color: "green", power: 4, health: 4, special: "incorporeal" }),
  green_8: freezeMonster({ color: "green", power: 1, health: 3, special: "empowering" }),
  green_9: freezeMonster({ color: "green", power: 5, health: 10 }),

  // ── Red (1..9) ──────────────────────────────────────────────────────────
  red_1: freezeMonster({ color: "red", power: 2, health: 3 }),
  red_2: freezeMonster({ color: "red", power: 2, health: 1, special: "range" }),
  red_3: freezeMonster({ color: "red", power: 1, health: 2, special: "escalate" }),
  red_4: freezeMonster({ color: "red", power: 1, health: 5 }),
  red_5: freezeMonster({ color: "red", power: 4, health: 2, special: "quick" }),
  red_6: freezeMonster({ color: "red", power: 3, health: 4, special: "poison" }),
  red_7: freezeMonster({ color: "red", power: 4, health: 4, special: "incorporeal" }),
  red_8: freezeMonster({ color: "red", power: 1, health: 3, special: "empowering" }),
  red_9: freezeMonster({ color: "red", power: 5, health: 10 }),

  // ── Blue (1..9) ─────────────────────────────────────────────────────────
  blue_1: freezeMonster({ color: "blue", power: 2, health: 3 }),
  blue_2: freezeMonster({ color: "blue", power: 2, health: 1, special: "range" }),
  blue_3: freezeMonster({ color: "blue", power: 1, health: 2, special: "escalate" }),
  blue_4: freezeMonster({ color: "blue", power: 1, health: 5 }),
  blue_5: freezeMonster({ color: "blue", power: 4, health: 2, special: "quick" }),
  blue_6: freezeMonster({ color: "blue", power: 3, health: 4, special: "poison" }),
  blue_7: freezeMonster({ color: "blue", power: 4, health: 4, special: "incorporeal" }),
  blue_8: freezeMonster({ color: "blue", power: 1, health: 3, special: "empowering" }),
  blue_9: freezeMonster({ color: "blue", power: 5, health: 10 }),

  // ── Yellow (1..9) ───────────────────────────────────────────────────────
  yellow_1: freezeMonster({ color: "yellow", power: 2, health: 3 }),
  yellow_2: freezeMonster({ color: "yellow", power: 2, health: 1, special: "range" }),
  yellow_3: freezeMonster({ color: "yellow", power: 1, health: 2, special: "escalate" }),
  yellow_4: freezeMonster({ color: "yellow", power: 1, health: 5 }),
  yellow_5: freezeMonster({ color: "yellow", power: 4, health: 2, special: "quick" }),
  yellow_6: freezeMonster({ color: "yellow", power: 3, health: 4, special: "poison" }),
  yellow_7: freezeMonster({ color: "yellow", power: 4, health: 4, special: "incorporeal" }),
  yellow_8: freezeMonster({ color: "yellow", power: 1, health: 3, special: "empowering" }),
  yellow_9: freezeMonster({ color: "yellow", power: 5, health: 10 }),

  // ── Pink (1..9) ─────────────────────────────────────────────────────────
  pink_1: freezeMonster({ color: "pink", power: 2, health: 3 }),
  pink_2: freezeMonster({ color: "pink", power: 2, health: 1, special: "range" }),
  pink_3: freezeMonster({ color: "pink", power: 1, health: 2, special: "escalate" }),
  pink_4: freezeMonster({ color: "pink", power: 1, health: 5 }),
  pink_5: freezeMonster({ color: "pink", power: 4, health: 2, special: "quick" }),
  pink_6: freezeMonster({ color: "pink", power: 3, health: 4, special: "poison" }),
  pink_7: freezeMonster({ color: "pink", power: 4, health: 4, special: "incorporeal" }),
  pink_8: freezeMonster({ color: "pink", power: 1, health: 3, special: "empowering" }),
  pink_9: freezeMonster({ color: "pink", power: 5, health: 10 }),
});

/**
 * CSS color values used to paint the circle (power) badge on the flight
 * grid. Mirrors the `--card-mid-2` family from action-card colors so
 * monster icons match their card-color theme.
 */
const MONSTER_BADGE_COLORS = Object.freeze({
  red:       "#78212b",
  green:     "#155e48",
  pink:      "#7c2d76",
  blue:      "#1c4980",
  yellow:    "#a87a18",
  colorless: "#5f5f5f",
  orange:    "#9a5e14",
});

/**
 * Returns the monster definition for an icon key (e.g. "enemy1",
 * "red_5"), or null if the key is not a registered monster.
 * @param {string} key
 * @returns {{ color: string, power: number, health: number, defense: number, special: string|null } | null}
 */
function getMonsterDefinition(key) {
  return MONSTER_DEFINITIONS[key] ?? null;
}
