/**
 * Action card data definitions.
 *
 * This file owns the raw action-card data only.
 */

const ACTION_CARD_DEFINITIONS = Object.freeze({
  attack_1: { id: "attack_1", text: "Attack 1. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.", color: "red" },
  attack_2: { id: "attack_2", text: "Attack 2. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.", color: "red" },
  move_1: { id: "move_1", text: "Move 1. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.", color: "green" },
  move_2: { id: "move_2", text: "Move 2. Consectetur adipisci velit, sed quia non numquam eius modi tempora incidunt.", color: "green" },
  heal_1: { id: "heal_1", text: "Heal 1. Ut labore et dolore magnam aliquam quaerat voluptatem in hac potenti turpis.", color: "pink" },
  freeze_1: { id: "freeze_1", text: "Freeze 1. At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.", color: "blue" },
  blast: { id: "blast", text: "Blast. Praesentium voluptatum deleniti atque corrupti et quos dolores et quas molestias excepturi sint.", color: "orange" },
});

const ACTION_DEFAULT_DECK_CARD_IDS = Object.freeze([
  ...Array(8).fill("attack_1"),
  ...Array(8).fill("move_1"),
  ...Array(4).fill("attack_2"),
  ...Array(4).fill("move_2"),
  ...Array(3).fill("heal_1"),
  ...Array(2).fill("freeze_1"),
  ...Array(1).fill("blast"),
]);