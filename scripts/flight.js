// Flight grid rendering + flight stack state.
// Depends on: dom-refs.js (flightCardsStack), flight-card-data.js, flight-cards.js
//   (createFlightCardContainers, createFlightDeck, FLIGHT_STACK_SLOT_COUNT)

// ── Flight grid constants ────────────────────────────────────────────────────

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

// ── Flight stack state ──────────────────────────────────────────────────────

const TARGET_FLIGHT_STACK_SIZE = FLIGHT_STACK_SLOT_COUNT;

/** Live-queried flight card containers. Repopulated after init. */
let flightCardContainers = [];
let FLIGHT_STACK_SIZE = 0;

/** Track which flight cards are currently visible. */
let visibleFlightCards = new Set();

/** Active generated 10-card flight deck for the current run. */
let currentFlightDeck = createFlightDeck();

/** Cards currently loaded into the on-screen flight stack. */
let activeFlightCards = [];

/** Index of the next card to load from currentFlightDeck. */
let nextFlightDeckIndex = 0;

/** Whether a flight card fly-away animation is currently running. */
let isFlightAnimating = false;

function refreshFlightContainers() {
  flightCardContainers = Array.from(document.querySelectorAll(".flight-card-container"));
  FLIGHT_STACK_SIZE = flightCardContainers.length;
}

function applyFlightStackOffsets() {
  const total = flightCardContainers.length;
  flightCardContainers.forEach((container, index) => {
    container.style.setProperty("--stack-offset", `${index * 2}px`);
    container.style.setProperty("--stack-offset-x", `${index}px`);
    container.style.zIndex = String(total - index);
  });
}

// ── Visibility queries ──────────────────────────────────────────────────────

function getTopVisibleCardIndex() {
  for (let i = 0; i < FLIGHT_STACK_SIZE; i++) {
    if (visibleFlightCards.has(i)) return i;
  }
  return -1;
}

function getNextVisibleCardIndex(startIndex) {
  for (let i = startIndex + 1; i < FLIGHT_STACK_SIZE; i++) {
    if (visibleFlightCards.has(i) && !flightCardContainers[i].classList.contains("hidden")) {
      return i;
    }
  }
  return -1;
}

function getCurrentFlightCard() {
  const topIndex = getTopVisibleCardIndex();
  if (topIndex === -1) return null;
  return activeFlightCards[topIndex] ?? null;
}

// ── Grid cell builders ──────────────────────────────────────────────────────

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
  if (!content) return cell;

  cell.classList.add("has-icon");
  cell.style.display = "flex";
  cell.style.alignItems = "center";
  cell.style.justifyContent = "center";

  const imageSource = FLIGHT_ICON_IMAGE_BY_KEY[content];
  if (!imageSource) {
    cell.textContent = content;
    cell.style.fontSize = "1.5rem";
    return cell;
  }

  const icon = document.createElement("img");
  icon.className = "grid-cell-icon";
  if (content === "apple") icon.classList.add("grid-cell-icon-fit");
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
  return cell;
}

// ── Flight grid render ──────────────────────────────────────────────────────

function renderFlightGrid() {
  flightCardContainers.forEach((container, index) => {
    const cardData = activeFlightCards[index];
    const gridElement = container.querySelector(".flight-grid");
    if (!gridElement) return;

    const numberEl = container.querySelector(".flight-card-number");
    const boomEl = container.querySelector(".flight-card-boom-count");

    if (!cardData) {
      gridElement.replaceChildren();
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

    if (numberEl) numberEl.textContent = `#${cardData.cardNumber.toString().padStart(3, "0")}`;
    if (boomEl) boomEl.textContent = cardData.boomCount.toString().padStart(2, "0");
  });
}

// ── Stack lifecycle ─────────────────────────────────────────────────────────

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
    if (!visibleFlightCards.has(index) || container.classList.contains("hidden")) return;
    container.classList.add(index === topIndex ? "is-top-visible" : "is-below-top");
  });
}

function loadNextFlightStack() {
  const nextCards = currentFlightDeck.slice(nextFlightDeckIndex, nextFlightDeckIndex + FLIGHT_STACK_SIZE);
  activeFlightCards = nextCards;
  nextFlightDeckIndex += nextCards.length;

  visibleFlightCards = new Set(nextCards.map((_, index) => index));

  flightCardContainers.forEach((container, index) => {
    container.classList.remove("is-flying", "hidden");
    if (!activeFlightCards[index]) container.classList.add("hidden");
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

function resetFlightState() {
  isFlightAnimating = false;
  startNewFlightDeck();
}
