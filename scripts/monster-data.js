/**
 * Monster (flight grid enemy) database.
 *
 * Each entry maps a flight-grid icon key to its display color and the
 * numeric values shown on the circle (power) and shield (defense) badges.
 *
 * `color` matches the action-card color tokens defined in styles/main.css
 * (e.g. "red", "green", "pink").
 */

const MONSTER_DEFINITIONS = Object.freeze({
  enemy1: { color: "red",   power: 3, defense: 3 },
  enemy2: { color: "green", power: 3, defense: 3 },
  enemy3: { color: "pink",  power: 3, defense: 3 },
});

/**
 * CSS color values used to paint the circle (power) badge on the flight
 * grid. Mirrors the `--card-mid-2` family from action-card colors so
 * monster icons match their card-color theme.
 */
const MONSTER_BADGE_COLORS = Object.freeze({
  red:   "#78212b",
  green: "#155e48",
  pink:  "#7c2d76",
  blue:  "#1c4980",
  orange:"#9a5e14",
});

/**
 * Returns the monster definition for an icon key (e.g. "enemy1"), or null
 * if the key is not a registered monster.
 * @param {string} key
 * @returns {{ color: string, power: number, defense: number } | null}
 */
function getMonsterDefinition(key) {
  return MONSTER_DEFINITIONS[key] ?? null;
}
