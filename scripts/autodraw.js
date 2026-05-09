// Autodraw toggle + clickable draw-pip behavior.
// Depends on: dom-refs.js, deck.js (drawCards), action-render.js
//   (appendActionCardsWithFlip, processDrawChain, isAnimating).

/** Whether action cards with a main-row draw resource auto-draw. */
let autodrawEnabled = true;

function setAutodrawState(enabled) {
  autodrawEnabled = !!enabled;
  document.body.classList.toggle("autodraw-off", !autodrawEnabled);
  if (!autodrawButton) return;

  const label = autodrawEnabled ? "Autodraw: On" : "Autodraw: Off";
  autodrawButton.dataset.autodraw = autodrawEnabled ? "on" : "off";

  const labelWrap = autodrawButton.querySelector(".menu-item-label");
  if (labelWrap) labelWrap.setAttribute("aria-label", label);
  const spaceEl = autodrawButton.querySelector(".menu-item-space");
  const discoveryEl = autodrawButton.querySelector(".menu-item-discovery");
  if (spaceEl) spaceEl.textContent = label;
  if (discoveryEl) discoveryEl.textContent = label;
}

/** Marks a pip element as consumed and removes its interactive affordances. */
function consumePip(pip) {
  pip.classList.add("consumed");
  pip.setAttribute("aria-disabled", "true");
  pip.removeAttribute("role");
  pip.removeAttribute("tabindex");
}

/** Activates a single draw pip (user click or keyboard). */
function handleDrawPipActivate(pip) {
  if (!pip || pip.classList.contains("consumed")) return;
  if (isAnimating) return;
  const count = Math.max(0, parseInt(pip.dataset.drawCount || "0", 10));
  if (count <= 0) return;
  const newCards = drawCards(count);
  if (newCards.length === 0) return;
  consumePip(pip);
  appendActionCardsWithFlip(newCards, (newShells) => {
    // Newly drawn cards may also have main-row draw pips; if autodraw is on,
    // chain them automatically; if off, leave them glowing for the user.
    if (autodrawEnabled) processDrawChain(newCards, newShells);
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
    total += Math.max(0, parseInt(pip.dataset.drawCount || "0", 10));
    consumePip(pip);
  });
  if (total <= 0) return;

  const newCards = drawCards(total);
  if (newCards.length === 0) return;
  appendActionCardsWithFlip(newCards, (newShells) => processDrawChain(newCards, newShells));
}

function wireAutodrawControls() {
  if (autodrawButton) {
    autodrawButton.addEventListener("click", () => {
      setAutodrawState(!autodrawEnabled);
      if (autodrawEnabled) processOutstandingMainDrawPips();
    });
  }

  if (actionCardsPanel) {
    actionCardsPanel.addEventListener("click", (event) => {
      const pip = event.target.closest(".draw-pip");
      if (pip && actionCardsPanel.contains(pip)) {
        event.preventDefault();
        handleDrawPipActivate(pip);
      }
    });
    actionCardsPanel.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const pip = event.target.closest(".draw-pip");
      if (pip && actionCardsPanel.contains(pip)) {
        event.preventDefault();
        handleDrawPipActivate(pip);
      }
    });
  }
}
