// Action card rendering: format resources, populate shells, render hand,
// and the flip-cascade animation.
// Depends on: dom-refs.js, deck.js (COLOR_CLASSES, currentActionCardIds,
//   getMainDrawCountForCard, drawCards, renderDeckIndicator),
//   action-cards.js (createActionCardShell, ACTION_CARD_SLOT_COUNT).

// ── Shell collection ───────────────────────────────────────────────────────

let actionCards = [];

/** Re-query action card shells after any DOM mutation. */
function refreshActionCardShells() {
  actionCards = Array.from(document.querySelectorAll(".action-card-shell:not(.deck-indicator-shell)"));
}

function setActionCardFlipOrder() {
  const columns = 3;
  actionCards.forEach((card, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    card.style.setProperty("--flip-order", String(row + col));
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

// ── Resource icon HTML ─────────────────────────────────────────────────────

const RESOURCE_IMAGE_PATH = "./img/";

/**
 * Renders the icon HTML for a resource. Some resources are composed of
 * multiple icons (damagePerCard, damagePer{Color}) or use a different
 * image than their key (draw -> card.png, kill -> death.png).
 *
 * For draw resources, `drawMeta` is { row: "main"|"boost",
 * key: "main"|"main2"|"boost"|"boost2", count: number }.
 */
function renderResourceIcon(resource, drawMeta) {
  if (!resource) return "";

  if (resource === "damagePerCard") {
    return `<img src="${RESOURCE_IMAGE_PATH}damage.png" alt="damage" class="resource-icon" onerror="this.style.display='none'" />`
      + `<span class="resource-divider resource-divider-inline">|</span>`
      + `<span class="resource-icon-wrap"><span class="card-icon-bg"></span>`
      + `<img src="${RESOURCE_IMAGE_PATH}card.png" alt="card" class="resource-icon card-icon" onerror="this.style.display='none'" /></span>`;
  }

  // damagePer{Color} -> damage icon | colored card icon
  const perColorMatch = /^damagePer([A-Z][a-zA-Z]+)$/.exec(resource);
  if (perColorMatch) {
    const color = perColorMatch[1].toLowerCase();
    return `<img src="${RESOURCE_IMAGE_PATH}damage.png" alt="damage" class="resource-icon" onerror="this.style.display='none'" />`
      + `<span class="resource-divider resource-divider-inline">|</span>`
      + `<span class="resource-icon-wrap action-card-${color}"><span class="card-icon-bg"></span>`
      + `<img src="${RESOURCE_IMAGE_PATH}card.png" alt="card ${color}" class="resource-icon card-icon" onerror="this.style.display='none'" /></span>`;
  }

  if (resource === "draw") {
    const meta = drawMeta || { row: "main", key: "main", count: 1 };
    const plural = meta.count === 1 ? "" : "s";
    return `<span class="resource-icon-wrap draw-pip" data-row="${meta.row}" data-draw-key="${meta.key}" `
      + `data-draw-count="${meta.count}" role="button" tabindex="0" aria-label="Draw ${meta.count} card${plural}">`
      + `<span class="card-icon-bg"></span>`
      + `<img src="${RESOURCE_IMAGE_PATH}card.png" alt="card" class="resource-icon card-icon" onerror="this.style.display='none'" /></span>`;
  }

  if (resource === "kill") {
    return `<img src="${RESOURCE_IMAGE_PATH}death.png" alt="kill" class="resource-icon" onerror="this.style.display='none'" />`;
  }

  return `<img src="${RESOURCE_IMAGE_PATH}${resource}.png" alt="${resource}" class="resource-icon" onerror="this.style.display='none'" />`;
}

/**
 * Formats a resource pair (e.g. main row or boost row).
 * `row` is "main" or "boost"; `keys` provides the draw-key for each slot
 * (e.g. ["main", "main2"]).
 */
function formatResourcePair(count, resource, count2, resource2, row, keys) {
  if (count === null || count === undefined || !resource) return "";
  const meta1 = resource === "draw" ? { row, key: keys[0], count } : null;
  let html = `<div class="resource-pair"><span>${count}:${renderResourceIcon(resource, meta1)}</span>`;
  if ((count2 !== null && count2 !== undefined) && resource2) {
    const meta2 = resource2 === "draw" ? { row, key: keys[1], count: count2 } : null;
    html += ` <span class="resource-divider">/</span> <span>${count2}:${renderResourceIcon(resource2, meta2)}</span>`;
  }
  html += "</div>";
  return html;
}

const DIAMOND_HR_HTML = `<div class="resource-divider-hr">
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

/** Formats a card's resource block as HTML. */
function formatCardResources(cardData) {
  let html = "";
  html += formatResourcePair(cardData.count, cardData.resource, cardData.count2, cardData.resource2, "main", ["main", "main2"]);

  const hasMain = (cardData.count !== null && cardData.count !== undefined && cardData.resource);
  const hasBoost = (cardData.boostCount !== null && cardData.boostCount !== undefined && cardData.boostResource);
  if (hasMain && hasBoost) html += DIAMOND_HR_HTML;

  html += formatResourcePair(cardData.boostCount, cardData.boostResource, cardData.boostCount2, cardData.boostResource2, "boost", ["boost", "boost2"]);
  return html || "<div></div>";
}

// ── Shell population ───────────────────────────────────────────────────────

/** Populates a single action card shell with the given card data. */
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
 * Renders an array of card definitions into the existing action card slots
 * without animation.
 */
function renderActionCards(cards) {
  currentActionCardIds = cards.filter(Boolean).map((card) => card.id);
  actionCards.forEach((shell, i) => {
    if (cards[i]) populateActionCardShell(shell, cards[i]);
  });
}

// ── Flip cascade animation ─────────────────────────────────────────────────

const FLIP_DURATION_MS = 760;   // total animation duration
const FLIP_MIDPOINT    = 0.40;  // fraction at which the card is edge-on
const FLIP_DELAY_MS    = 110;   // per-card stagger delay (matches CSS calc)

/** Whether a flip animation is currently running. */
let isAnimating = false;

/** Cards waiting to be rendered after the current animation completes. */
let pendingCards = null;

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
      if (cards[i]) populateActionCardShell(card, cards[i]);
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
 * Flips only the slots at `slotIndices` (indexes into `actionCards`),
 * populating each with the matching `cards[i]`. Other slots are untouched.
 * Calls `onComplete()` once all flips have finished. Used by the two-step
 * draw sequence when the draw pile must be reshuffled mid-deal.
 */
function flipSlots(slotIndices, cards, onComplete) {
  if (!slotIndices || slotIndices.length === 0) {
    if (onComplete) onComplete();
    return;
  }
  if (isAnimating) {
    setTimeout(() => flipSlots(slotIndices, cards, onComplete), 60);
    return;
  }
  isAnimating = true;

  const shells = slotIndices.map((idx) => actionCards[idx]).filter(Boolean);
  shells.forEach((shell) => {
    shell.classList.remove("is-flipping");
    void shell.offsetWidth;
    shell.classList.add("is-flipping");
  });

  let settled = 0;
  shells.forEach((shell, i) => {
    const flipOrder = parseFloat(shell.style.getPropertyValue("--flip-order")) || 0;
    const midpointMs = flipOrder * FLIP_DELAY_MS + FLIP_DURATION_MS * FLIP_MIDPOINT;

    setTimeout(() => {
      if (cards[i]) populateActionCardShell(shell, cards[i]);
    }, midpointMs);

    shell.addEventListener("animationend", function onEnd(event) {
      if (event.animationName !== "action-card-diagonal-flip") return;
      shell.classList.remove("is-flipping");
      shell.removeEventListener("animationend", onEnd);
      settled++;
      if (settled === shells.length) {
        renderDeckIndicator();
        isAnimating = false;
        if (onComplete) onComplete();
      }
    });
  });
}

/**
 * Appends new action card shells for `cards` and animates a flip-in.
 * Calls `onComplete(newShells)` once all flips have finished.
 */
function appendActionCardsWithFlip(cards, onComplete) {
  if (!cards || cards.length === 0) {
    if (onComplete) onComplete([]);
    return;
  }
  if (isAnimating) {
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
        if (onComplete) onComplete(newShells);
      }
    });
  });
}

// ── Draw chain ─────────────────────────────────────────────────────────────

/**
 * Marks the main-row draw pips on the given shells as consumed so they no
 * longer glow or respond to clicks.
 */
function markMainDrawPipsConsumed(shells) {
  shells.forEach((shell) => {
    shell.querySelectorAll('.draw-pip[data-row="main"]').forEach((pip) => {
      pip.classList.add("consumed");
      pip.setAttribute("aria-disabled", "true");
      pip.removeAttribute("role");
      pip.removeAttribute("tabindex");
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
  if (renderedShells && renderedShells.length) markMainDrawPipsConsumed(renderedShells);
  appendActionCardsWithFlip(newCards, (newShells) => processDrawChain(newCards, newShells));
}
