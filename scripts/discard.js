// Discard dialog: clicking an action card's header opens a confirmation
// dialog centered over the top two rows of the action cards panel. On
// confirm, the card flips out, is removed, and added to the discard pile.
//
// Depends on: dom-refs.js, action-render.js (actionCards,
//   refreshActionCardShells, setActionCardFlipOrder, isAnimating),
//   deck.js (discardPile, currentActionCardIds, renderDeckIndicator),
//   action-cards.js (getCard).

/** Currently open discard dialog element, or null. */
let activeDiscardDialog = null;

/** Shell currently pending discard confirmation, or null. */
let pendingDiscardShell = null;

/** Closes any open discard dialog. */
function closeDiscardDialog() {
  if (activeDiscardDialog) {
    activeDiscardDialog.remove();
    activeDiscardDialog = null;
  }
  pendingDiscardShell = null;
  if (actionCardsPanel) actionCardsPanel.classList.remove("has-discard-dialog");
}

/**
 * Positions the dialog so it is centered over the union bounding rect of the
 * action card shells occupying the first two grid rows.
 */
function positionDiscardDialog(dialog) {
  if (!actionCardsPanel || !dialog) return;
  const shells = Array.from(
    actionCardsPanel.querySelectorAll(".action-card-shell:not(.deck-indicator-shell)")
  );
  if (shells.length === 0) return;

  const panelRect = actionCardsPanel.getBoundingClientRect();
  // First two rows = up to first 6 shells in a 3-column layout. Use whatever
  // is present; rely on each shell's own bounding rect so responsive
  // breakpoints (2-column) still work.
  const rowsToCover = shells.slice(0, 6);
  let top = Infinity;
  let bottom = -Infinity;
  // Group by row using top coordinate.
  const byTop = new Map();
  rowsToCover.forEach((shell) => {
    const rect = shell.getBoundingClientRect();
    const key = Math.round(rect.top);
    if (!byTop.has(key)) byTop.set(key, []);
    byTop.get(key).push(rect);
  });
  const rowKeys = Array.from(byTop.keys()).sort((a, b) => a - b).slice(0, 2);
  rowKeys.forEach((k) => {
    byTop.get(k).forEach((rect) => {
      if (rect.top < top) top = rect.top;
      if (rect.bottom > bottom) bottom = rect.bottom;
    });
  });
  if (!isFinite(top) || !isFinite(bottom)) return;

  const overlayTop = top - panelRect.top;
  const overlayHeight = bottom - top;
  dialog.style.top = `${overlayTop}px`;
  dialog.style.height = `${overlayHeight}px`;
  dialog.style.left = "0";
  dialog.style.right = "0";
}

/** Builds the dialog DOM and returns the root element. */
function buildDiscardDialog(cardTitle, cardColor) {
  const overlay = document.createElement("div");
  overlay.className = "discard-dialog-overlay";
  if (cardColor) {
    // Inherits --card-light/--card-mid-*/--card-dark tokens so the Yes
    // button can be themed to match the source card's color.
    overlay.classList.add(`action-card-${cardColor}`);
  }
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", `Discard ${cardTitle}?`);

  const box = document.createElement("div");
  box.className = "discard-dialog-box";

  const message = document.createElement("p");
  message.className = "discard-dialog-message";
  message.textContent = `Discard ${cardTitle}?`;

  const buttons = document.createElement("div");
  buttons.className = "discard-dialog-buttons";

  const yesBtn = document.createElement("button");
  yesBtn.type = "button";
  yesBtn.className = "discard-dialog-btn discard-dialog-yes";
  yesBtn.textContent = "Yes";

  const noBtn = document.createElement("button");
  noBtn.type = "button";
  noBtn.className = "discard-dialog-btn discard-dialog-no";
  noBtn.textContent = "No";

  buttons.append(yesBtn, noBtn);
  box.append(message, buttons);
  overlay.append(box);
  return { overlay, yesBtn, noBtn };
}

/**
 * Performs the discard: flip-out animation, remove shell, update piles and
 * shell collection, refresh deck indicator.
 */
function performDiscard(shell) {
  if (!shell) return;
  const cardId = shell.dataset.cardId;

  // Update logical state up-front so subsequent draws don't desync.
  if (cardId) {
    const idx = currentActionCardIds.indexOf(cardId);
    if (idx !== -1) currentActionCardIds.splice(idx, 1);
    discardPile.push(cardId);
  }

  shell.classList.add("is-discarding");
  shell.style.pointerEvents = "none";

  const finalize = () => {
    shell.removeEventListener("animationend", onEnd);
    shell.remove();
    refreshActionCardShells();
    setActionCardFlipOrder();
    renderDeckIndicator();
  };

  const onEnd = (event) => {
    if (event.animationName !== "action-card-discard-flip") return;
    finalize();
  };
  shell.addEventListener("animationend", onEnd);
  // Safety fallback in case animationend doesn't fire.
  setTimeout(() => {
    if (shell.isConnected) finalize();
  }, 900);
}

/** Opens the discard dialog for the given shell. */
function openDiscardDialog(shell) {
  if (!shell || !actionCardsPanel) return;
  if (activeDiscardDialog) closeDiscardDialog();
  if (typeof isAnimating !== "undefined" && isAnimating) return;

  const cardId = shell.dataset.cardId;
  if (!cardId) return;
  const cardData = getCard(cardId);
  if (!cardData) return;

  pendingDiscardShell = shell;
  const { overlay, yesBtn, noBtn } = buildDiscardDialog(cardData.title, cardData.color);
  activeDiscardDialog = overlay;
  actionCardsPanel.classList.add("has-discard-dialog");
  actionCardsPanel.append(overlay);
  positionDiscardDialog(overlay);

  yesBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const target = pendingDiscardShell;
    closeDiscardDialog();
    performDiscard(target);
  });
  noBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeDiscardDialog();
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeDiscardDialog();
  });

  noBtn.focus();
}

function wireDiscardDialog() {
  if (!actionCardsPanel) return;

  actionCardsPanel.addEventListener("click", (event) => {
    // Don't intercept clicks on draw pips or other interactive children.
    if (event.target.closest(".draw-pip")) return;
    if (event.target.closest(".discard-dialog-overlay")) return;

    const title = event.target.closest(".action-title");
    if (!title) return;
    const shell = title.closest(".action-card-shell:not(.deck-indicator-shell)");
    if (!shell || !actionCardsPanel.contains(shell)) return;
    event.preventDefault();
    event.stopPropagation();
    openDiscardDialog(shell);
  });

  // Reposition while the dialog is open.
  window.addEventListener("resize", () => {
    if (activeDiscardDialog) positionDiscardDialog(activeDiscardDialog);
  });

  // Dismiss with Escape.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeDiscardDialog) closeDiscardDialog();
  });
}

wireDiscardDialog();
