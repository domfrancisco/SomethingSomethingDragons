// Save / load / reset persistent game state (localStorage) plus the
// active-deck switching and reset-action helpers.
// Depends on: dom-refs.js, deck.js, action-render.js, flight.js,
//   action-cards.js (createActionCardShell, ACTION_CARD_SLOT_COUNT,
//   shuffleDeck, getActionDeckByKey), action-card-data.js (getCard).

const STORAGE_KEY = "something-something-dragons.state.v1";

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

function applySelectedDeck(deckKey) {
  activeActionDeckKey = normalizeDeckKey(deckKey);
  activeActionDeck = getActionDeckByKey(activeActionDeckKey);
  drawPile = shuffleDeck(activeActionDeck);
  drawIndex = 0;
  discardPile = [];
  isAnimating = false;
  pendingCards = null;
  removeExtraActionCardShells();

  if (deckColorSelect) deckColorSelect.value = activeActionDeckKey;

  const nextCards = drawCards(actionCards.length);
  renderActionCards(nextCards);
  renderDeckIndicator();
  processDrawChain(nextCards, actionCards.slice(0, nextCards.length));
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

  // Action deck.
  activeActionDeckKey = normalizeDeckKey(state.actionDeckKey);
  activeActionDeck = getActionDeckByKey(activeActionDeckKey);
  if (deckColorSelect) deckColorSelect.value = activeActionDeckKey;

  if (Array.isArray(state.drawPile)) {
    drawPile = state.drawPile.filter((id) => Boolean(getCard(id)));
  }
  if (typeof state.drawIndex === "number") {
    drawIndex = Math.max(0, Math.min(Math.floor(state.drawIndex), drawPile.length));
  }

  discardPile = Array.isArray(state.discardPile)
    ? state.discardPile.filter((id) => Boolean(getCard(id)))
    : [];

  if (Array.isArray(state.currentActionCardIds)) {
    const loadedCards = state.currentActionCardIds.map((id) => getCard(id)).filter(Boolean);
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

  // Flight deck.
  const sanitizeFlightCard = (card) => ({
    id: String(card.id),
    cardNumber: Number(card.cardNumber),
    boomCount: Number(card.boomCount),
    grid: [...card.grid],
  });
  const isFlightCard = (card) => card && typeof card === "object" && Array.isArray(card.grid);

  if (Array.isArray(state.currentFlightDeck)) {
    currentFlightDeck = state.currentFlightDeck.filter(isFlightCard).map(sanitizeFlightCard);
  }
  if (typeof state.nextFlightDeckIndex === "number") {
    nextFlightDeckIndex = Math.max(0, Math.min(Math.floor(state.nextFlightDeckIndex), currentFlightDeck.length));
  }
  if (Array.isArray(state.activeFlightCards)) {
    activeFlightCards = state.activeFlightCards.filter(isFlightCard).map(sanitizeFlightCard);
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
