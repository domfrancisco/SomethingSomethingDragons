const flightCard = {
  cardNumber: 103,
  boomCount: 8,
  columns: "ABCDE".split(""),
  rows: Array.from({ length: 5 }, (_, i) => i + 1),
};

const flightGrid = document.getElementById("flightGrid");
const deckButton = document.querySelector(".deck-btn");
const actionCards = Array.from(document.querySelectorAll(".action-card-shell"));

// ── Flight grid ───────────────────────────────────────────────────────────────

function createGridLabel(value, className) {
  const label = document.createElement("div");
  label.className = className;

  if (className.includes("grid-coordinate") && value) {
    label.setAttribute("aria-label", value);

    const underlay = document.createElement("span");
    underlay.className = "grid-coordinate-space";
    underlay.textContent = value;
    underlay.setAttribute("aria-hidden", "true");

    const overlay = document.createElement("span");
    overlay.className = "grid-coordinate-discovery";
    overlay.textContent = value;
    overlay.setAttribute("aria-hidden", "true");

    label.append(underlay, overlay);
  } else {
    label.textContent = value;
  }

  return label;
}

function createGridCell(coordinate) {
  const cell = document.createElement("div");
  cell.className = "grid-cell";
  cell.dataset.coordinate = coordinate;
  return cell;
}

function renderFlightGrid() {
  if (!flightGrid) return;

  const fragment = document.createDocumentFragment();

  flightCard.rows.forEach((row) => {
    fragment.append(createGridLabel(String(row).padStart(2, "0"), "grid-coordinate"));
    flightCard.columns.forEach((column) => {
      fragment.append(createGridCell(`${column}${String(row).padStart(2, "0")}`));
    });
  });

  fragment.append(createGridLabel("", "grid-corner grid-corner-bottom"));
  flightCard.columns.forEach((column) => {
    fragment.append(createGridLabel(column, "grid-coordinate grid-coordinate-bottom"));
  });

  flightGrid.replaceChildren(fragment);
}

renderFlightGrid();

// ── Action card deck state ────────────────────────────────────────────────────

/** All color classes that may be on an action card shell. */
const COLOR_CLASSES = ["action-card-red", "action-card-orange", "action-card-green", "action-card-blue", "action-card-pink"];

/** Current draw pile — starts as a shuffled copy of defaultDeck.cards. */
let drawPile = shuffleDeck(defaultDeck);

/** Index of the next card to draw from drawPile. */
let drawIndex = 0;

/**
 * Draws the next `count` cards from the pile.
 * Reshuffles automatically when the pile is exhausted.
 * @param {number} count
 * @returns {{ id: string, text: string, color: string }[]}
 */
function drawCards(count) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (drawIndex >= drawPile.length) {
      drawPile = shuffleDeck(defaultDeck);
      drawIndex = 0;
    }
    const cardId = drawPile[drawIndex++];
    drawn.push(getCard(cardId));
  }
  return drawn;
}

/**
 * Renders an array of card definitions into the action card DOM slots.
 * @param {{ id: string, text: string, color: string }[]} cards
 */
function renderActionCards(cards) {
  actionCards.forEach((shell, i) => {
    const cardData = cards[i];
    if (!cardData) return;

    // Swap color class.
    COLOR_CLASSES.forEach((cls) => shell.classList.remove(cls));
    shell.classList.add(`action-card-${cardData.color}`);

    // Update aria-label.
    shell.setAttribute("aria-label", cardData.text);

    // Update title overlay.
    const titleEl = shell.querySelector(".action-title");
    if (titleEl) {
      titleEl.setAttribute("aria-label", "Action Card");
      titleEl.querySelector(".action-title-space").textContent = "Action Card";
      titleEl.querySelector(".action-title-discovery").textContent = "Action Card";
    }

    // Update body text.
    const bodyEl = shell.querySelector(".action-card-content > p");
    if (bodyEl) bodyEl.textContent = cardData.text;
  });
}

// ── Flip cascade animation ────────────────────────────────────────────────────

/** Whether a flip animation is currently running. */
let isAnimating = false;

/** Cards waiting to be rendered after the current animation completes. */
let pendingCards = null;

function setActionCardFlipOrder() {
  const columns = 3;
  actionCards.forEach((card, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    card.style.setProperty("--flip-order", String(row + col));
  });
}

// Duration constants must match the CSS animation.
const FLIP_DURATION_MS = 760;   // total animation duration
const FLIP_MIDPOINT    = 0.40;  // fraction at which the card is edge-on
const FLIP_DELAY_MS    = 110;   // per-card stagger delay (matches CSS calc)

function triggerFlipThenRender(cards) {
  if (isAnimating) {
    pendingCards = cards;
    return;
  }

  isAnimating = true;

  actionCards.forEach((card) => {
    card.classList.remove("is-flipping");
    void card.offsetWidth;
    card.classList.add("is-flipping");
  });

  // Swap content per-card at the edge-on midpoint so the new face is
  // already in place when the card rotates back into view.
  let settled = 0;

  actionCards.forEach((card, i) => {
    const flipOrder = parseFloat(card.style.getPropertyValue("--flip-order")) || 0;
    const midpointMs = flipOrder * FLIP_DELAY_MS + FLIP_DURATION_MS * FLIP_MIDPOINT;

    setTimeout(() => {
      const cardData = cards[i];
      if (!cardData) return;

      COLOR_CLASSES.forEach((cls) => card.classList.remove(cls));
      card.classList.add(`action-card-${cardData.color}`);
      card.setAttribute("aria-label", cardData.text);

      const titleEl = card.querySelector(".action-title");
      if (titleEl) {
        titleEl.setAttribute("aria-label", "Action Card");
        titleEl.querySelector(".action-title-space").textContent = "Action Card";
        titleEl.querySelector(".action-title-discovery").textContent = "Action Card";
      }

      const bodyEl = card.querySelector(".action-card-content > p");
      if (bodyEl) bodyEl.textContent = cardData.text;
    }, midpointMs);

    card.addEventListener("animationend", function onEnd(event) {
      if (event.animationName !== "action-card-diagonal-flip") return;
      card.classList.remove("is-flipping");
      card.removeEventListener("animationend", onEnd);

      settled++;
      if (settled === actionCards.length) {
        isAnimating = false;

        if (pendingCards) {
          const next = pendingCards;
          pendingCards = null;
          triggerFlipThenRender(next);
        }
      }
    });
  });
}

// ── Initialise ────────────────────────────────────────────────────────────────

setActionCardFlipOrder();

// Load first 5 cards immediately on page load (no animation).
renderActionCards(drawCards(actionCards.length));

if (deckButton) {
  deckButton.addEventListener("click", () => {
    triggerFlipThenRender(drawCards(actionCards.length));
  });
}

