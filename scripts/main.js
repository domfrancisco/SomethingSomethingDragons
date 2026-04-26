const flightCard = {
  cardNumber: 103,
  boomCount: 8,
  columns: "ABCDE".split(""),
  rows: Array.from({ length: 5 }, (_, index) => index + 1),
};

const flightGrid = document.getElementById("flightGrid");
const deckButton = document.querySelector(".deck-btn");
const actionCards = Array.from(document.querySelectorAll(".action-card-shell"));

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
  if (!flightGrid) {
    return;
  }

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

function setActionCardFlipOrder() {
  const columns = 2;

  actionCards.forEach((card, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    card.style.setProperty("--flip-order", String(row + column));
  });
}

function triggerActionCardFlipCascade() {
  if (!actionCards.length) {
    return;
  }

  actionCards.forEach((card) => {
    card.classList.remove("is-flipping");
    // Force style recalculation so repeated clicks reliably restart animation.
    void card.offsetWidth;
    card.classList.add("is-flipping");
  });
}

setActionCardFlipOrder();

actionCards.forEach((card) => {
  card.addEventListener("animationend", (event) => {
    if (event.animationName === "action-card-diagonal-flip") {
      card.classList.remove("is-flipping");
    }
  });
});

if (deckButton) {
  deckButton.addEventListener("click", triggerActionCardFlipCascade);
}
