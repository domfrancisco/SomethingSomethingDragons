const flightCard = {
  cardNumber: 103,
  boomCount: 8,
  columns: "ABCDEF".split(""),
  rows: Array.from({ length: 6 }, (_, index) => index + 1),
};

const flightGrid = document.getElementById("flightGrid");

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
