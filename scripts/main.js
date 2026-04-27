const flyButton = document.querySelector(".fly-btn");
const deckButton = document.querySelector(".deck-btn");
const actionCards = Array.from(document.querySelectorAll(".action-card-shell:not(.deck-indicator-shell)"));
const deckStackVisual = document.getElementById("deckStackVisual");
const discardStackVisual = document.getElementById("discardStackVisual");
const deckCounter = document.getElementById("deckCounter");
const flightCardsStack = document.querySelector(".flight-cards-stack");
let flightCardContainers = Array.from(document.querySelectorAll(".flight-card-container"));
const saveStateButton = document.getElementById("menuSaveState");
const loadStateButton = document.getElementById("menuLoadState");
const resetStateButton = document.getElementById("menuResetState");

const STORAGE_KEY = "something-something-dragons.state.v1";
const TARGET_FLIGHT_STACK_SIZE = 10;

function ensureFlightCardSlots(count) {
  if (!flightCardsStack || flightCardContainers.length === 0) return;

  const template = flightCardContainers[0];
  while (flightCardContainers.length < count) {
    const clone = template.cloneNode(true);
    clone.classList.remove("hidden", "is-flying");
    clone.setAttribute("data-card-index", String(flightCardContainers.length));
    flightCardsStack.append(clone);
    flightCardContainers.push(clone);
  }
}

function applyFlightStackOffsets() {
  const total = flightCardContainers.length;
  flightCardContainers.forEach((container, index) => {
    container.style.setProperty("--stack-offset", `${index * 2}px`);
    container.style.setProperty("--stack-offset-x", `${index}px`);
    container.style.zIndex = String(total - index);
  });
}

ensureFlightCardSlots(TARGET_FLIGHT_STACK_SIZE);
applyFlightStackOffsets();
const FLIGHT_STACK_SIZE = flightCardContainers.length;

// ── Flight Card State ──────────────────────────────────────────────────────

/** Track which flight cards are currently visible (all visible initially). */
let visibleFlightCards = new Set();

/** Active generated 10-card flight deck for the current run. */
let currentFlightDeck = createFlightDeck();

/** Cards currently loaded into the on-screen 10-card flight stack. */
let activeFlightCards = [];

/** Index of the next card to load from currentFlightDeck into the stack. */
let nextFlightDeckIndex = 0;

/** Get the topmost visible flight card index. */
function getTopVisibleCardIndex() {
  for (let i = 0; i < FLIGHT_STACK_SIZE; i++) {
    if (visibleFlightCards.has(i)) {
      return i;
    }
  }
  return -1;
}

/** Get the current flight card data. */
function getCurrentFlightCard() {
  const topIndex = getTopVisibleCardIndex();
  if (topIndex === -1) return null;
  return activeFlightCards[topIndex] ?? null;
}

// ── Flight grid ───────────────────────────────────────────────────────────────

const flightCard = {
  columns: "ABCDE".split(""),
  rows: Array.from({ length: 5 }, (_, i) => i + 1),
};

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

function createGridCell(coordinate, content) {
  const cell = document.createElement("div");
  cell.className = "grid-cell";
  cell.dataset.coordinate = coordinate;
  if (content) {
    cell.classList.add("has-icon");
    cell.textContent = content;
    cell.style.fontSize = "1.5rem";
    cell.style.display = "flex";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
  }
  return cell;
}

function renderFlightGrid() {
  // Render the currently loaded stack cards.
  flightCardContainers.forEach((container, index) => {
    const cardData = activeFlightCards[index];
    
    // Find the grid element within this container
    const gridElement = container.querySelector(".flight-grid");
    if (!gridElement) return;
    
    if (!cardData) {
      gridElement.replaceChildren();
      const numberEl = container.querySelector(".flight-card-number");
      const boomEl = container.querySelector(".flight-card-boom-count");
      if (numberEl) numberEl.textContent = "";
      if (boomEl) boomEl.textContent = "";
      return;
    }

    const fragment = document.createDocumentFragment();

    flightCard.rows.forEach((row) => {
      fragment.append(createGridLabel(String(row).padStart(2, "0"), "grid-coordinate"));
      flightCard.columns.forEach((column, colIndex) => {
        const cellIndex = (row - 1) * 5 + colIndex;
        const content = cardData.grid[cellIndex];
        const coordinate = `${column}${String(row).padStart(2, "0")}`;
        fragment.append(createGridCell(coordinate, content));
      });
    });

    fragment.append(createGridLabel("", "grid-corner grid-corner-bottom"));
    flightCard.columns.forEach((column) => {
      fragment.append(createGridLabel(column, "grid-coordinate grid-coordinate-bottom"));
    });

    gridElement.replaceChildren(fragment);
    
    // Update the flight card number and boom count for this card.
    const numberEl = container.querySelector(".flight-card-number");
    const boomEl = container.querySelector(".flight-card-boom-count");
    if (numberEl) {
      numberEl.textContent = `#${cardData.cardNumber.toString().padStart(3, "0")}`;
    }
    if (boomEl) {
      boomEl.textContent = cardData.boomCount.toString().padStart(2, "0");
    }
  });
}

function loadNextFlightStack() {
  const nextCards = currentFlightDeck.slice(nextFlightDeckIndex, nextFlightDeckIndex + FLIGHT_STACK_SIZE);
  activeFlightCards = nextCards;
  nextFlightDeckIndex += nextCards.length;

  visibleFlightCards = new Set(nextCards.map((_, index) => index));

  flightCardContainers.forEach((container, index) => {
    container.classList.remove("is-flying", "hidden");
    if (!activeFlightCards[index]) {
      container.classList.add("hidden");
    }
  });

  renderFlightGrid();
  updateFlightStackClasses();
  setFlyButtonText("Fly");
}

function startNewFlightDeck() {
  currentFlightDeck = createFlightDeck();
  nextFlightDeckIndex = 0;
  loadNextFlightStack();
}

// ── Deck indicator state ──────────────────────────────────────────────────

/** Cards that have been drawn and discarded (no longer displayed). */
let discardedCount = 0;

/**
 * Renders the deck and discard piles as stacked rectangles.
 * Currently displayed cards (5) are not shown in either stack.
 */
function renderDeckIndicator() {
  // Calculate remaining cards in current draw pile
  const cardsRemaining = Math.max(0, drawPile.length - drawIndex);
  
  // Clear existing stacks
  deckStackVisual.replaceChildren();
  discardStackVisual.replaceChildren();

  // Render deck stack - show ALL remaining cards
  for (let i = 0; i < cardsRemaining; i++) {
    const rect = document.createElement("div");
    rect.className = "card-rect";
    deckStackVisual.append(rect);
  }

  // Render discard stack - show ALL discarded cards
  for (let i = 0; i < discardedCount; i++) {
    const rect = document.createElement("div");
    rect.className = "card-rect";
    discardStackVisual.append(rect);
  }

  // Calculate and set the min-height for each stack to enable grow/shrink animation
  // Each card is 0.3rem tall with -2px margin overlap (except first)
  const cardHeightRem = 0.3;
  const overlapPx = 2;
  const pxPerRem = 16;
  
  const calcHeight = (count) => {
    if (count === 0) return "0";
    // First card: full height, subsequent cards have overlap
    const totalPx = (cardHeightRem * count * pxPerRem) - (overlapPx * Math.max(0, count - 1));
    return (totalPx / pxPerRem).toFixed(3) + "rem";
  };

  if (deckStackVisual) {
    deckStackVisual.style.minHeight = calcHeight(cardsRemaining);
  }
  if (discardStackVisual) {
    discardStackVisual.style.minHeight = calcHeight(discardedCount);
  }

  // Update counter: remaining / total
  const totalDeck = DECK_MAX_SIZE;
  if (deckCounter) {
    deckCounter.textContent = `${cardsRemaining}/${totalDeck}`;
  }
}

// ── Action card deck state ────────────────────────────────────────────────────

/** All color classes that may be on an action card shell. */
const COLOR_CLASSES = ["action-card-red", "action-card-orange", "action-card-green", "action-card-blue", "action-card-pink"];

/** Current draw pile — starts as a shuffled copy of defaultDeck.cards. */
let drawPile = shuffleDeck(defaultDeck);

/** Index of the next card to draw from drawPile. */
let drawIndex = 0;

/** IDs of cards currently displayed in action card slots. */
let currentActionCardIds = [];

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
  currentActionCardIds = cards.filter(Boolean).map((card) => card.id);

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

/** Whether a flight card fly-away animation is currently running. */
let isFlightAnimating = false;

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
        renderDeckIndicator();
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

function setFlyButtonText(text) {
  if (!flyButton) return;
  const flySpace = flyButton.querySelector(".fly-btn-space");
  const flyDiscovery = flyButton.querySelector(".fly-btn-discovery");
  if (flySpace) flySpace.textContent = text;
  if (flyDiscovery) flyDiscovery.textContent = text;
}

function updateFlightStackClasses() {
  const topIndex = getTopVisibleCardIndex();

  flightCardContainers.forEach((container, index) => {
    container.classList.remove("is-top-visible", "is-below-top");

    if (!visibleFlightCards.has(index) || container.classList.contains("hidden")) {
      return;
    }

    if (index === topIndex) {
      container.classList.add("is-top-visible");
    } else {
      container.classList.add("is-below-top");
    }
  });
}

function resetFlightState() {
  isFlightAnimating = false;
  startNewFlightDeck();
}

function resetActionState() {
  drawPile = shuffleDeck(defaultDeck);
  drawIndex = 0;
  discardedCount = 0;
  isAnimating = false;
  pendingCards = null;

  const initialCards = drawCards(actionCards.length);
  renderActionCards(initialCards);
  renderDeckIndicator();
}

function saveGameState() {
  const state = {
    drawPile,
    drawIndex,
    discardedCount,
    currentActionCardIds,
    currentFlightDeck,
    activeFlightCards,
    nextFlightDeckIndex,
    visibleFlightCardIndices: Array.from(visibleFlightCards),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadGameState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  let state;
  try {
    state = JSON.parse(raw);
  } catch {
    return false;
  }

  if (!state || typeof state !== "object") return false;

  if (Array.isArray(state.drawPile)) {
    drawPile = state.drawPile.filter((id) => Boolean(getCard(id)));
  }

  if (typeof state.drawIndex === "number") {
    drawIndex = Math.max(0, Math.min(Math.floor(state.drawIndex), drawPile.length));
  }

  if (typeof state.discardedCount === "number") {
    discardedCount = Math.max(0, Math.floor(state.discardedCount));
  }

  if (Array.isArray(state.currentActionCardIds)) {
    const loadedCards = state.currentActionCardIds
      .map((id) => getCard(id))
      .filter(Boolean);

    if (loadedCards.length === actionCards.length) {
      renderActionCards(loadedCards);
    }
  }

  if (Array.isArray(state.currentFlightDeck)) {
    currentFlightDeck = state.currentFlightDeck
      .filter((card) => card && typeof card === "object" && Array.isArray(card.grid))
      .map((card) => ({
        id: String(card.id),
        cardNumber: Number(card.cardNumber),
        boomCount: Number(card.boomCount),
        grid: [...card.grid],
      }));
  }

  if (typeof state.nextFlightDeckIndex === "number") {
    nextFlightDeckIndex = Math.max(0, Math.min(Math.floor(state.nextFlightDeckIndex), currentFlightDeck.length));
  }

  if (Array.isArray(state.activeFlightCards)) {
    activeFlightCards = state.activeFlightCards
      .filter((card) => card && typeof card === "object" && Array.isArray(card.grid))
      .map((card) => ({
        id: String(card.id),
        cardNumber: Number(card.cardNumber),
        boomCount: Number(card.boomCount),
        grid: [...card.grid],
      }));
  }

  if (activeFlightCards.length === 0 && currentFlightDeck.length > 0) {
    const startIndex = Math.max(0, nextFlightDeckIndex - FLIGHT_STACK_SIZE);
    activeFlightCards = currentFlightDeck.slice(startIndex, startIndex + FLIGHT_STACK_SIZE);
  }

  renderFlightGrid();

  if (Array.isArray(state.visibleFlightCardIndices)) {
    visibleFlightCards = new Set(
      state.visibleFlightCardIndices
        .map((n) => Number(n))
        .filter((n) => Number.isInteger(n) && n >= 0 && n < flightCardContainers.length)
    );
  } else {
    visibleFlightCards = new Set(activeFlightCards.map((_, index) => index));
  }

  flightCardContainers.forEach((container, index) => {
    container.classList.remove("is-flying");
    const shouldHide = !activeFlightCards[index] || !visibleFlightCards.has(index);
    container.classList.toggle("hidden", shouldHide);
  });

  updateFlightStackClasses();
  setFlyButtonText(visibleFlightCards.size === 0 && nextFlightDeckIndex >= currentFlightDeck.length ? "New Flight" : "Fly");

  isFlightAnimating = false;
  renderDeckIndicator();
  return true;
}

function resetGameState() {
  localStorage.removeItem(STORAGE_KEY);
  resetFlightState();
  resetActionState();
}

// ── Initialise ────────────────────────────────────────────────────────────────

setActionCardFlipOrder();

// Load first 5 cards immediately on page load (no animation).
// Load first flight stack on page load.
startNewFlightDeck();
renderActionCards(drawCards(actionCards.length));
renderDeckIndicator();
loadGameState();

if (deckButton) {
  deckButton.addEventListener("click", () => {
    // Cards currently displayed are being discarded.
    discardedCount += actionCards.length;
    triggerFlipThenRender(drawCards(actionCards.length));
  });
}

if (flyButton) {
  flyButton.addEventListener("click", () => {
    if (isFlightAnimating) return;

    const topIndex = getTopVisibleCardIndex();
    
    if (topIndex === -1) {
      if (nextFlightDeckIndex >= currentFlightDeck.length) {
        // Deck exhausted: start a brand-new generated flight deck.
        startNewFlightDeck();
      } else {
        // More cards are available in this deck: load the next stack.
        loadNextFlightStack();
      }
    } else {
      // Animate the top visible card toward the viewer, then hide it.
      const topCard = flightCardContainers[topIndex];
      isFlightAnimating = true;
      topCard.classList.remove("is-flying");
      void topCard.offsetWidth;
      topCard.classList.add("is-flying");

      topCard.addEventListener("animationend", function onFlightEnd(event) {
        if (event.animationName !== "flight-card-fly-away") return;

        topCard.removeEventListener("animationend", onFlightEnd);
        topCard.classList.remove("is-flying");
        topCard.classList.add("hidden");
        visibleFlightCards.delete(topIndex);
        isFlightAnimating = false;
        updateFlightStackClasses();

        // If stack is empty, show the next expected action on the button.
        if (visibleFlightCards.size === 0) {
          setFlyButtonText(nextFlightDeckIndex >= currentFlightDeck.length ? "New Flight" : "Fly");
        }
      });
    }
  });
}

if (saveStateButton) {
  saveStateButton.addEventListener("click", saveGameState);
}

if (loadStateButton) {
  loadStateButton.addEventListener("click", loadGameState);
}

if (resetStateButton) {
  resetStateButton.addEventListener("click", resetGameState);
}

