// Bootstrap: builds initial DOM, wires button handlers, and kicks off the
// initial render. All domain logic lives in the sibling modules.
//
// Load order (see index.html):
//   1. action-card-data.js
//   2. action-deck-data.js
//   3. action-cards.js
//   4. flight-card-data.js
//   5. flight-cards.js
//   6. particles.js
//   7. menu.js
//   8. dom-refs.js
//   9. flight.js
//  10. deck.js
//  11. action-render.js
//  12. autodraw.js
//  13. save-load.js
//  14. main.js   <-- this file

// ── Build initial card shells ──────────────────────────────────────────────

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
refreshActionCardShells();
refreshFlightContainers();
applyFlightStackOffsets();

// ── Initial state setup ────────────────────────────────────────────────────

buildDeckColorOptions();
activeActionDeckKey = normalizeDeckKey(deckColorSelect?.value ?? "green");
activeActionDeck = getActionDeckByKey(activeActionDeckKey);
drawPile = shuffleDeck(activeActionDeck);

setActionCardFlipOrder();
startNewFlightDeck();
applySelectedDeck(activeActionDeckKey);
loadGameState();
setAutodrawState(true);

// ── Event wiring ───────────────────────────────────────────────────────────

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
    // Re-instate any shells that were removed by discards so the hand is
    // dealt back to the full base slot count.
    ensureBaseActionCardShells();

    const slotCount = actionCards.length;
    const remainingInPile = Math.max(0, drawPile.length - drawIndex);

    // Fast path: enough cards in the pile (or no discards to recycle).
    if (remainingInPile >= slotCount || discardPile.length === 0) {
      triggerFlipThenRender(drawCards(slotCount));
      return;
    }

    // Two-step: flip the last few cards in the pile, then visually move the
    // discards into the draw pile, then flip the remaining slots.
    const phase1Count = remainingInPile;
    const phase1Cards = [];
    for (let i = 0; i < phase1Count; i++) {
      phase1Cards.push(getCard(drawPile[drawIndex++]));
    }
    currentActionCardIds.push(...phase1Cards.map((c) => c.id));
    renderDeckIndicator();

    const phase1Slots = Array.from({ length: phase1Count }, (_, i) => i);
    flipSlots(phase1Slots, phase1Cards, () => {
      // Hold the animation lock through the visual reshuffle pause.
      isAnimating = true;
      setTimeout(() => {
        drawPile = shuffleArray([...discardPile]);
        discardPile = [];
        drawIndex = 0;
        renderDeckIndicator();

        setTimeout(() => {
          isAnimating = false;
          const phase2Cards = drawCards(slotCount - phase1Count);
          currentActionCardIds.push(...phase2Cards.map((c) => c.id));
          const phase2Slots = phase2Cards.map((_, i) => phase1Count + i);
          flipSlots(phase2Slots, phase2Cards, () => {
            const allCards = [...phase1Cards, ...phase2Cards];
            processDrawChain(allCards, actionCards.slice(0, allCards.length));
          });
        }, 350);
      }, 250);
    });
  });
}

/**
 * Draws a single card and appends it to the hand without discarding the
 * existing hand. `source` is "top" or "bottom" and chooses the draw side.
 */
function drawSingleCardToHand(source) {
  if (typeof isAnimating !== "undefined" && isAnimating) return;
  const newCards = source === "bottom" ? drawBottomCards(1) : drawCards(1);
  if (newCards.length === 0) return;
  appendActionCardsWithFlip(newCards, (newShells) => {
    renderDeckIndicator();
    if (autodrawEnabled) processDrawChain(newCards, newShells);
  });
}

if (drawTopButton) {
  drawTopButton.addEventListener("click", () => drawSingleCardToHand("top"));
}

if (drawBottomButton) {
  drawBottomButton.addEventListener("click", () => drawSingleCardToHand("bottom"));
}

/**
 * Shuffles the remaining (un-drawn) portion of the draw pile in place. The
 * discard pile is left untouched. Plays a brief visual pulse on the deck
 * stack so the user can tell the shuffle happened.
 */
function shuffleRemainingDrawPile() {
  if (typeof isAnimating !== "undefined" && isAnimating) return;
  const remainingCount = drawPile.length - drawIndex;
  // Always trigger the visual indicator so the click feels acknowledged
  // even if there is 0 or 1 card left to shuffle.
  if (remainingCount > 1) {
    const remaining = drawPile.slice(drawIndex);
    shuffleArray(remaining);
    drawPile = drawPile.slice(0, drawIndex).concat(remaining);
  }
  triggerShuffleIndicator();
}

function triggerShuffleIndicator() {
  if (!deckStackVisual) return;
  deckStackVisual.classList.remove("is-shuffling");
  // Force reflow so removing + re-adding restarts the animation.
  void deckStackVisual.offsetWidth;
  deckStackVisual.classList.add("is-shuffling");
  // Clean up after the animation so subsequent clicks can re-trigger.
  setTimeout(() => deckStackVisual.classList.remove("is-shuffling"), 700);
}

if (shuffleDeckButton) {
  shuffleDeckButton.addEventListener("click", shuffleRemainingDrawPile);
}

if (flyButton) {
  flyButton.addEventListener("click", () => {
    if (isFlightAnimating) return;

    const topIndex = getTopVisibleCardIndex();
    if (topIndex === -1) {
      if (nextFlightDeckIndex >= currentFlightDeck.length) {
        startNewFlightDeck();
      } else {
        loadNextFlightStack();
      }
      return;
    }

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

      if (visibleFlightCards.size === 0) {
        setFlyButtonText(nextFlightDeckIndex >= currentFlightDeck.length ? "New Flight" : "Fly");
      }
    });
  });
}

if (saveStateButton) saveStateButton.addEventListener("click", saveGameState);
if (loadStateButton) loadStateButton.addEventListener("click", loadGameState);
if (resetStateButton) resetStateButton.addEventListener("click", resetGameState);

wireAutodrawControls();
