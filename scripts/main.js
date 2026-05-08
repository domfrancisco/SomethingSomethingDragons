const flyButton = document.querySelector(".fly-btn");
const deckButton = document.querySelector(".deck-btn");
const deckColorSelect = document.getElementById("deckColorSelect");
const actionCardsPanel = document.querySelector(".action-cards-panel");
const deckIndicatorShell = actionCardsPanel?.querySelector(".deck-indicator-shell") ?? null;
const deckStackVisual = document.getElementById("deckStackVisual");
const discardStackVisual = document.getElementById("discardStackVisual");
const deckCounter = document.getElementById("deckCounter");
const flightCardsStack = document.querySelector(".flight-cards-stack");
const saveStateButton = document.getElementById("menuSaveState");
const loadStateButton = document.getElementById("menuLoadState");
const resetStateButton = document.getElementById("menuResetState");
const autodrawButton = document.getElementById("menuAutodraw");

/** Whether action cards with a main-row draw resource auto-draw. */
let autodrawEnabled = true;

const STORAGE_KEY = "something-something-dragons.state.v1";
const TARGET_FLIGHT_STACK_SIZE = FLIGHT_STACK_SLOT_COUNT;

function initializeCardShells() {
  if (actionCardsPanel) {
    actionCardsPanel.querySelectorAll(".action-card-shell:not(.deck-indicator-shell)").forEach((node) => node.remove());

    const actionFragment = document.createDocumentFragment();
    createActionCardShells().forEach((card) => actionFragment.append(card));

    if (deckIndicatorShell) {
      actionCardsPanel.insertBefore(actionFragment, deckIndicatorShell);
    } else {
      actionCardsPanel.append(actionFragment);
    }
  }

  if (flightCardsStack) {
    const flightFragment = document.createDocumentFragment();
    createFlightCardContainers(TARGET_FLIGHT_STACK_SIZE).forEach((card) => flightFragment.append(card));
    flightCardsStack.replaceChildren(flightFragment);
  }
}

initializeCardShells();

let actionCards = Array.from(document.querySelectorAll(".action-card-shell:not(.deck-indicator-shell)"));
let flightCardContainers = Array.from(document.querySelectorAll(".flight-card-container"));

/** Re-query action card shells after any DOM mutation. */
function refreshActionCardShells() {
  actionCards = Array.from(document.querySelectorAll(".action-card-shell:not(.deck-indicator-shell)"));
}

function applyFlightStackOffsets() {
  const total = flightCardContainers.length;
  flightCardContainers.forEach((container, index) => {
    container.style.setProperty("--stack-offset", `${index * 2}px`);
    container.style.setProperty("--stack-offset-x", `${index}px`);
    container.style.zIndex = String(total - index);
  });
}

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

/** Get the next visible card index after a given card index. */
function getNextVisibleCardIndex(startIndex) {
  for (let i = startIndex + 1; i < FLIGHT_STACK_SIZE; i++) {
    if (visibleFlightCards.has(i) && !flightCardContainers[i].classList.contains("hidden")) {
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
  columns: "ABCDEF".split(""),
  rows: Array.from({ length: 4 }, (_, i) => i + 1),
};

const FLIGHT_ICON_IMAGE_BY_KEY = Object.freeze({
  enemy1: "./img/enemy_ph1.png",
  enemy2: "./img/enemy_ph2.png",
  enemy3: "./img/enemy_ph3.png",
  apple: "./img/apple_ph.png",
});

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
    cell.style.display = "flex";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";

    const imageSource = FLIGHT_ICON_IMAGE_BY_KEY[content];
    if (imageSource) {
      const icon = document.createElement("img");
      icon.className = "grid-cell-icon";
      if (content === "apple") {
        icon.classList.add("grid-cell-icon-fit");
      }
      icon.src = imageSource;
      icon.alt = "";
      icon.setAttribute("aria-hidden", "true");
      icon.loading = "lazy";
      cell.append(icon);
      if (content !== "apple") {
        const badges = document.createElement("div");
        badges.className = "grid-cell-badges";
        badges.setAttribute("aria-hidden", "true");
        badges.innerHTML =
          '<span class="grid-cell-badge grid-cell-badge-circle"></span>'
          + '<span class="grid-cell-badge grid-cell-badge-shield">'
          + '<svg viewBox="0 0 24 28" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
          + '<path d="M12 1 L23 4 V14 C23 21 18 26 12 27 C6 26 1 21 1 14 V4 Z" '
          + 'fill="#e5e7eb" stroke="#1f2937" stroke-width="2" stroke-linejoin="round"/>'
          + '</svg></span>';
        cell.append(badges);
      }
    } else {
      cell.textContent = content;
      cell.style.fontSize = "1.5rem";
    }
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
        const cellIndex = (row - 1) * flightCard.columns.length + colIndex;
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

/** Card IDs that have been discarded (no longer displayed). */
let discardPile = [];

/**
 * Renders the deck and discard piles as stacked rectangles.
 * Currently displayed cards are not shown in either stack.
 */
function renderDeckIndicator() {
  // Calculate remaining cards in current draw pile
  const cardsRemaining = Math.max(0, drawPile.length - drawIndex);
  const cardsInDiscard = Math.max(0, Math.min(discardPile.length, DECK_MAX_SIZE));
  
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
  for (let i = 0; i < cardsInDiscard; i++) {
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
    discardStackVisual.style.minHeight = calcHeight(cardsInDiscard);
  }

  // Update counter: remaining / total
  const totalDeck = DECK_MAX_SIZE;
  if (deckCounter) {
    deckCounter.textContent = `${cardsRemaining}/${totalDeck}`;
  }
}

// ── Action card deck state ────────────────────────────────────────────────────

/** All color classes that may be on an action card shell. */
const COLOR_CLASSES = ["action-card-red", "action-card-orange", "action-card-green", "action-card-blue", "action-card-pink", "action-card-colorless"];

function buildDeckColorOptions() {
  if (!deckColorSelect) return;

  const fragment = document.createDocumentFragment();
  const sortedDecks = [...ACTION_DECK_DATABASE].sort((a, b) => a.label.localeCompare(b.label));
  
  sortedDecks.forEach((deckEntry) => {
    const option = document.createElement("option");
    option.value = deckEntry.key;
    option.textContent = deckEntry.label;

    if (deckEntry.key === "green") {
      option.selected = true;
    }

    fragment.append(option);
  });

  deckColorSelect.replaceChildren(fragment);
}

buildDeckColorOptions();

function normalizeDeckKey(deckKey) {
  if (deckKey === "default") {
    return "green";
  }
  return Object.prototype.hasOwnProperty.call(ACTION_DECK_CARD_IDS_BY_KEY, deckKey)
    ? deckKey
    : "green";
}

let activeActionDeckKey = normalizeDeckKey(deckColorSelect?.value ?? "green");
let activeActionDeck = getActionDeckByKey(activeActionDeckKey);

/** Current draw pile — starts as a shuffled copy of defaultDeck.cards. */
let drawPile = shuffleDeck(activeActionDeck);

/** Index of the next card to draw from drawPile. */
let drawIndex = 0;

/** IDs of cards currently displayed in action card slots. */
let currentActionCardIds = [];

/**
 * Draws the next `count` cards from the pile.
 * If the draw pile runs out mid-draw, the discard pile is shuffled
 * back into a fresh draw pile and drawing continues.
 * Returns fewer cards if the deck and discard combined are exhausted.
 * @param {number} count
 * @returns {{ id: string, title: string, text: string, color: string }[]}
 */
function drawCards(count) {
  const drawn = [];
  while (drawn.length < count) {
    if (drawIndex >= drawPile.length) {
      if (discardPile.length === 0) break;
      drawPile = shuffleArray([...discardPile]);
      discardPile = [];
      drawIndex = 0;
    }
    const cardId = drawPile[drawIndex++];
    drawn.push(getCard(cardId));
  }
  return drawn;
}

/**
 * Returns the total number of "draw" resource pips on the MAIN row only.
 * Boost-row draw pips are click-only and never auto-drawn.
 */
function getMainDrawCountForCard(cardData) {
  if (!cardData) return 0;
  let total = 0;
  if (cardData.resource === "draw" && typeof cardData.count === "number" && cardData.count > 0) {
    total += cardData.count;
  }
  if (cardData.resource2 === "draw" && typeof cardData.count2 === "number" && cardData.count2 > 0) {
    total += cardData.count2;
  }
  return total;
}

/**
 * Returns the total number of "draw" resource pips on a card,
 * summing both main and boost rows.
 */
function getDrawCountForCard(cardData) {
  if (!cardData) return 0;
  const fields = [
    [cardData.count, cardData.resource],
    [cardData.count2, cardData.resource2],
    [cardData.boostCount, cardData.boostResource],
    [cardData.boostCount2, cardData.boostResource2],
  ];
  let total = 0;
  for (const [c, r] of fields) {
    if (r === "draw" && typeof c === "number" && c > 0) total += c;
  }
  return total;
}

/**
 * Formats card resources into HTML display.
 * @param {{ count: number|null, resource: string|null, boostCount: number|null, boostResource: string|null, count2: number|null, resource2: string|null, boostCount2: number|null, boostResource2: string|null }} cardData
 * @returns {string} HTML string with formatted resources
 */
function formatCardResources(cardData) {
  const resourceImagePath = './img/';

  // Helper to render the icon portion for a resource. Some resources are
  // composed of multiple icons (e.g. damagePerCard) or use a different
  // image than their resource key (e.g. draw -> card.png).
  // For draw resources, `drawMeta` is { row: "main"|"boost", key: "main"|"main2"|"boost"|"boost2", count: number }.
  function renderResourceIcon(resource, drawMeta) {
    if (!resource) return '';
    if (resource === 'damagePerCard') {
      return `<img src="${resourceImagePath}damage.png" alt="damage" class="resource-icon" onerror="this.style.display='none'" />`
        + `<span class="resource-divider resource-divider-inline">|</span>`
        + `<span class="resource-icon-wrap"><span class="card-icon-bg"></span><img src="${resourceImagePath}card.png" alt="card" class="resource-icon card-icon" onerror="this.style.display='none'" /></span>`;
    }
    // damagePer{Color} -> damage icon | colored card icon
    const perColorMatch = /^damagePer([A-Z][a-zA-Z]+)$/.exec(resource);
    if (perColorMatch) {
      const color = perColorMatch[1].toLowerCase();
      return `<img src="${resourceImagePath}damage.png" alt="damage" class="resource-icon" onerror="this.style.display='none'" />`
        + `<span class="resource-divider resource-divider-inline">|</span>`
        + `<span class="resource-icon-wrap action-card-${color}"><span class="card-icon-bg"></span><img src="${resourceImagePath}card.png" alt="card ${color}" class="resource-icon card-icon" onerror="this.style.display='none'" /></span>`;
    }
    if (resource === 'draw') {
      const meta = drawMeta || { row: 'main', key: 'main', count: 1 };
      return `<span class="resource-icon-wrap draw-pip" data-row="${meta.row}" data-draw-key="${meta.key}" data-draw-count="${meta.count}" role="button" tabindex="0" aria-label="Draw ${meta.count} card${meta.count === 1 ? '' : 's'}"><span class="card-icon-bg"></span><img src="${resourceImagePath}card.png" alt="card" class="resource-icon card-icon" onerror="this.style.display='none'" /></span>`;
    }
    if (resource === 'kill') {
      return `<img src="${resourceImagePath}death.png" alt="kill" class="resource-icon" onerror="this.style.display='none'" />`;
    }
    return `<img src="${resourceImagePath}${resource}.png" alt="${resource}" class="resource-icon" onerror="this.style.display='none'" />`;
  }

  // Helper function to format a resource pair. `row` is "main" or "boost",
  // and `keys` provides the draw-key for each slot (e.g. ["main","main2"]).
  function formatResourcePair(count, resource, count2, resource2, row, keys) {
    if (count === null || count === undefined || !resource) return '';
    const meta1 = resource === 'draw' ? { row, key: keys[0], count } : null;
    let html = `<div class="resource-pair"><span>${count}:${renderResourceIcon(resource, meta1)}</span>`;
    if ((count2 !== null && count2 !== undefined) && resource2) {
      const meta2 = resource2 === 'draw' ? { row, key: keys[1], count: count2 } : null;
      html += ` <span class="resource-divider">/</span> <span>${count2}:${renderResourceIcon(resource2, meta2)}</span>`;
    }
    html += '</div>';
    return html;
  }

  let html = '';

  // Top line: main resources
  html += formatResourcePair(cardData.count, cardData.resource, cardData.count2, cardData.resource2, 'main', ['main', 'main2']);
  
  // Diamond HR - only show if both main and boost resources exist
  const hasMain = (cardData.count !== null && cardData.count !== undefined && cardData.resource);
  const hasBoost = (cardData.boostCount !== null && cardData.boostCount !== undefined && cardData.boostResource);
  if (hasMain && hasBoost) {
    html += `<div class="resource-divider-hr">
      <svg width="100%" height="4" viewBox="0 0 100 4" preserveAspectRatio="none">
        <defs>
          <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#555555;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#000000;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#333333;stop-opacity:1" />
          </linearGradient>
        </defs>
        <polygon points="0,2 50,0 100,2 50,4" fill="url(#diamondGradient)" />
      </svg>
    </div>`;
  }
  
  // Bottom line: boost resources
  html += formatResourcePair(cardData.boostCount, cardData.boostResource, cardData.boostCount2, cardData.boostResource2, 'boost', ['boost', 'boost2']);
  
  return html || '<div></div>';
}

/**
 * Renders an array of card definitions into the action card DOM slots.
 * @param {{ id: string, title: string, text: string, color: string }[]} cards
 */
function renderActionCards(cards) {
  currentActionCardIds = cards.filter(Boolean).map((card) => card.id);

  actionCards.forEach((shell, i) => {
    const cardData = cards[i];
    if (!cardData) return;

    shell.dataset.cardId = cardData.id;

    // Swap color class.
    COLOR_CLASSES.forEach((cls) => shell.classList.remove(cls));
    shell.classList.add(`action-card-${cardData.color}`);

    // Update aria-label.
    shell.setAttribute("aria-label", `${cardData.title}: ${cardData.text}`);

    // Update title overlay.
    const titleEl = shell.querySelector(".action-title");
    if (titleEl) {
      titleEl.setAttribute("aria-label", cardData.title);
      titleEl.querySelector(".action-title-space").textContent = cardData.title;
      titleEl.querySelector(".action-title-discovery").textContent = cardData.title;

      // Update power badge.
      const powerBadgeNumber = titleEl.querySelector(".action-power-badge-number");
      if (powerBadgeNumber) {
        powerBadgeNumber.textContent = cardData.power;
        powerBadgeNumber.setAttribute("data-number", cardData.power);
      }
    }

    // Update body with resources.
    const bodyEl = shell.querySelector(".action-card-body > p");
    if (bodyEl) {
      bodyEl.innerHTML = formatCardResources(cardData);
    }

    // Set random image background.
    const imageEl = shell.querySelector(".action-card-image");
    if (imageEl) {
      const randomId = Math.floor(Math.random() * 1000);
      const imageUrl = `https://picsum.photos/700/500?random=${randomId}`;
      imageEl.style.backgroundImage = `url('${imageUrl}')`;
    }
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

  // Track the new hand so save/load reflects what is actually displayed.
  currentActionCardIds = cards.filter(Boolean).map((card) => card.id);

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

      card.dataset.cardId = cardData.id;

      COLOR_CLASSES.forEach((cls) => card.classList.remove(cls));
      card.classList.add(`action-card-${cardData.color}`);
      card.setAttribute("aria-label", `${cardData.title}: ${cardData.text}`);

      const titleEl = card.querySelector(".action-title");
      if (titleEl) {
        titleEl.setAttribute("aria-label", cardData.title);
        titleEl.querySelector(".action-title-space").textContent = cardData.title;
        titleEl.querySelector(".action-title-discovery").textContent = cardData.title;

        // Update power badge.
        const powerBadgeNumber = titleEl.querySelector(".action-power-badge-number");
        if (powerBadgeNumber) {
          powerBadgeNumber.textContent = cardData.power;
          powerBadgeNumber.setAttribute("data-number", cardData.power);
        }
      }

      const bodyEl = card.querySelector(".action-card-body > p");
      if (bodyEl) bodyEl.innerHTML = formatCardResources(cardData);
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
        } else {
          processDrawChain(cards, actionCards.slice(0, cards.length));
        }
      }
    });
  });
}

/**
 * Removes any action card shells that were appended dynamically beyond the
 * base hand size.
 */
function removeExtraActionCardShells() {
  if (!actionCardsPanel) return;
  const shells = Array.from(actionCardsPanel.querySelectorAll(".action-card-shell:not(.deck-indicator-shell)"));
  for (let i = ACTION_CARD_SLOT_COUNT; i < shells.length; i++) {
    shells[i].remove();
  }
  refreshActionCardShells();
  setActionCardFlipOrder();
}

/**
 * Populates an action card shell with the given card data.
 */
function populateActionCardShell(shell, cardData) {
  if (!shell || !cardData) return;
  shell.dataset.cardId = cardData.id;
  COLOR_CLASSES.forEach((cls) => shell.classList.remove(cls));
  shell.classList.add(`action-card-${cardData.color}`);
  shell.setAttribute("aria-label", `${cardData.title}: ${cardData.text}`);

  const titleEl = shell.querySelector(".action-title");
  if (titleEl) {
    titleEl.setAttribute("aria-label", cardData.title);
    const spaceEl = titleEl.querySelector(".action-title-space");
    const discoveryEl = titleEl.querySelector(".action-title-discovery");
    if (spaceEl) spaceEl.textContent = cardData.title;
    if (discoveryEl) discoveryEl.textContent = cardData.title;
    const powerBadgeNumber = titleEl.querySelector(".action-power-badge-number");
    if (powerBadgeNumber) {
      powerBadgeNumber.textContent = cardData.power;
      powerBadgeNumber.setAttribute("data-number", cardData.power);
    }
  }

  const bodyEl = shell.querySelector(".action-card-body > p");
  if (bodyEl) bodyEl.innerHTML = formatCardResources(cardData);

  const imageEl = shell.querySelector(".action-card-image");
  if (imageEl) {
    const randomId = Math.floor(Math.random() * 1000);
    imageEl.style.backgroundImage = `url('https://picsum.photos/700/500?random=${randomId}')`;
  }
}

/**
 * Appends new action card shells for `cards` and animates a flip-in.
 * Calls `onComplete` once all flips have finished.
 */
function appendActionCardsWithFlip(cards, onComplete) {
  if (!cards || cards.length === 0) {
    if (onComplete) onComplete();
    return;
  }
  if (isAnimating) {
    // Wait for the current animation, then run.
    setTimeout(() => appendActionCardsWithFlip(cards, onComplete), 60);
    return;
  }
  isAnimating = true;

  const newShells = [];
  cards.forEach((card) => {
    const shell = createActionCardShell();
    populateActionCardShell(shell, card);
    actionCardsPanel.append(shell);
    newShells.push(shell);
  });

  refreshActionCardShells();
  setActionCardFlipOrder();
  currentActionCardIds.push(...cards.map((c) => c.id));

  let settled = 0;
  newShells.forEach((shell) => {
    void shell.offsetWidth;
    shell.classList.add("is-flipping");
    shell.addEventListener("animationend", function onEnd(event) {
      if (event.animationName !== "action-card-diagonal-flip") return;
      shell.classList.remove("is-flipping");
      shell.removeEventListener("animationend", onEnd);
      settled++;
      if (settled === newShells.length) {
        renderDeckIndicator();
        isAnimating = false;
        if (onComplete) onComplete();
      }
    });
  });
}

/**
 * Marks the main-row draw pips on the given shells as consumed so they no
 * longer glow or respond to clicks. Returns nothing.
 */
function markMainDrawPipsConsumed(shells) {
  shells.forEach((shell) => {
    shell.querySelectorAll('.draw-pip[data-row="main"]').forEach((pip) => {
      pip.classList.add('consumed');
      pip.setAttribute('aria-disabled', 'true');
      pip.removeAttribute('role');
      pip.removeAttribute('tabindex');
    });
  });
}

/**
 * Walks rendered cards, drawing extra cards for each main-row "draw" pip and
 * recursing on the newly added cards. Only runs when autodraw is enabled.
 * Boost-row draws are click-only and never auto-drawn.
 */
function processDrawChain(renderedCards, renderedShells) {
  if (!autodrawEnabled) return;
  if (!renderedCards || renderedCards.length === 0) return;
  const totalDraws = renderedCards.reduce((s, c) => s + getMainDrawCountForCard(c), 0);
  if (totalDraws <= 0) return;
  const newCards = drawCards(totalDraws);
  if (newCards.length === 0) return;
  // Mark the source shells' main draw pips as consumed.
  if (renderedShells && renderedShells.length) {
    markMainDrawPipsConsumed(renderedShells);
  }
  appendActionCardsWithFlip(newCards, (newShells) => processDrawChain(newCards, newShells));
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
    container.classList.remove("is-top-visible", "is-below-top", "is-next-reveal");

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
  drawPile = shuffleDeck(activeActionDeck);
  drawIndex = 0;
  discardPile = [];
  isAnimating = false;
  pendingCards = null;
  removeExtraActionCardShells();

  const initialCards = drawCards(actionCards.length);
  renderActionCards(initialCards);
  renderDeckIndicator();
  processDrawChain(initialCards, actionCards.slice(0, initialCards.length));
}

function saveGameState() {
  const state = {
    actionDeckKey: activeActionDeckKey,
    drawPile,
    drawIndex,
    discardPile,
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

  activeActionDeckKey = normalizeDeckKey(state.actionDeckKey);
  activeActionDeck = getActionDeckByKey(activeActionDeckKey);
  if (deckColorSelect) {
    deckColorSelect.value = activeActionDeckKey;
  }

  if (Array.isArray(state.drawPile)) {
    drawPile = state.drawPile.filter((id) => Boolean(getCard(id)));
  }

  if (typeof state.drawIndex === "number") {
    drawIndex = Math.max(0, Math.min(Math.floor(state.drawIndex), drawPile.length));
  }

  if (Array.isArray(state.discardPile)) {
    discardPile = state.discardPile.filter((id) => Boolean(getCard(id)));
  } else {
    discardPile = [];
  }

  if (Array.isArray(state.currentActionCardIds)) {
    const loadedCards = state.currentActionCardIds
      .map((id) => getCard(id))
      .filter(Boolean);

    if (loadedCards.length > 0) {
      removeExtraActionCardShells();
      const extraNeeded = loadedCards.length - ACTION_CARD_SLOT_COUNT;
      for (let i = 0; i < extraNeeded; i++) {
        actionCardsPanel.append(createActionCardShell());
      }
      refreshActionCardShells();
      setActionCardFlipOrder();
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

function applySelectedDeck(deckKey) {
  activeActionDeckKey = normalizeDeckKey(deckKey);
  activeActionDeck = getActionDeckByKey(activeActionDeckKey);
  drawPile = shuffleDeck(activeActionDeck);
  drawIndex = 0;
  discardPile = [];
  isAnimating = false;
  pendingCards = null;
  removeExtraActionCardShells();

  if (deckColorSelect) {
    deckColorSelect.value = activeActionDeckKey;
  }

  const nextCards = drawCards(actionCards.length);
  renderActionCards(nextCards);
  renderDeckIndicator();
  processDrawChain(nextCards, actionCards.slice(0, nextCards.length));
}

// ── Initialise ────────────────────────────────────────────────────────────────

setActionCardFlipOrder();

// Load first 5 cards immediately on page load (no animation).
// Load first flight stack on page load.
startNewFlightDeck();
applySelectedDeck(activeActionDeckKey);
loadGameState();

if (deckColorSelect) {
  deckColorSelect.addEventListener("change", (event) => {
    const selectedDeckKey = event.target instanceof HTMLSelectElement
      ? event.target.value
      : "green";
    applySelectedDeck(selectedDeckKey);
  });
}

if (deckButton) {
  deckButton.addEventListener("click", () => {
    if (isAnimating) return;
    // Discard everything currently in hand (including any extras drawn from
    // the "draw" resource on previous cards).
    discardPile.push(...currentActionCardIds);
    currentActionCardIds = [];
    removeExtraActionCardShells();
    // drawCards handles partial draws and reshuffling the discard pile when
    // the draw pile alone cannot satisfy the request.
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
      const nextRevealIndex = getNextVisibleCardIndex(topIndex);

      if (nextRevealIndex !== -1) {
        flightCardContainers[nextRevealIndex].classList.add("is-next-reveal");
      }

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

// ── Autodraw toggle ─────────────────────────────────────────────────────────
function setAutodrawState(enabled) {
  autodrawEnabled = !!enabled;
  document.body.classList.toggle('autodraw-off', !autodrawEnabled);
  if (autodrawButton) {
    const label = autodrawEnabled ? 'Autodraw: On' : 'Autodraw: Off';
    autodrawButton.dataset.autodraw = autodrawEnabled ? 'on' : 'off';
    const labelWrap = autodrawButton.querySelector('.menu-item-label');
    if (labelWrap) labelWrap.setAttribute('aria-label', label);
    const spaceEl = autodrawButton.querySelector('.menu-item-space');
    const discoveryEl = autodrawButton.querySelector('.menu-item-discovery');
    if (spaceEl) spaceEl.textContent = label;
    if (discoveryEl) discoveryEl.textContent = label;
  }
}

if (autodrawButton) {
  autodrawButton.addEventListener('click', () => {
    setAutodrawState(!autodrawEnabled);
    // If we just turned autodraw on, fire any unconsumed main-row pips.
    if (autodrawEnabled) {
      processOutstandingMainDrawPips();
    }
  });
}

// ── Clickable draw pips ────────────────────────────────────────────────────
function handleDrawPipActivate(pip) {
  if (!pip || pip.classList.contains('consumed')) return;
  if (isAnimating) return;
  const count = Math.max(0, parseInt(pip.dataset.drawCount || '0', 10));
  if (count <= 0) return;
  const newCards = drawCards(count);
  if (newCards.length === 0) return;
  pip.classList.add('consumed');
  pip.setAttribute('aria-disabled', 'true');
  pip.removeAttribute('role');
  pip.removeAttribute('tabindex');
  appendActionCardsWithFlip(newCards, (newShells) => {
    // Newly drawn cards may also have main-row draw pips; if autodraw is on,
    // chain them automatically; if off, leave them glowing for the user.
    if (autodrawEnabled) {
      processDrawChain(newCards, newShells);
    }
  });
}

/**
 * Fires every unconsumed main-row draw pip currently in the hand. Used when
 * autodraw is toggled from off to on so pending pips resolve immediately.
 */
function processOutstandingMainDrawPips() {
  if (!actionCardsPanel) return;
  const pips = Array.from(actionCardsPanel.querySelectorAll('.draw-pip[data-row="main"]:not(.consumed)'));
  if (pips.length === 0) return;
  let total = 0;
  pips.forEach((pip) => {
    total += Math.max(0, parseInt(pip.dataset.drawCount || '0', 10));
    pip.classList.add('consumed');
    pip.setAttribute('aria-disabled', 'true');
    pip.removeAttribute('role');
    pip.removeAttribute('tabindex');
  });
  if (total <= 0) return;
  const newCards = drawCards(total);
  if (newCards.length === 0) return;
  appendActionCardsWithFlip(newCards, (newShells) => processDrawChain(newCards, newShells));
}

if (actionCardsPanel) {
  actionCardsPanel.addEventListener('click', (event) => {
    const pip = event.target.closest('.draw-pip');
    if (pip && actionCardsPanel.contains(pip)) {
      event.preventDefault();
      handleDrawPipActivate(pip);
    }
  });
  actionCardsPanel.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const pip = event.target.closest('.draw-pip');
    if (pip && actionCardsPanel.contains(pip)) {
      event.preventDefault();
      handleDrawPipActivate(pip);
    }
  });
}

// Initialise autodraw state to On.
setAutodrawState(true);

