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

/**
 * Ensures the panel has at least `ACTION_CARD_SLOT_COUNT` non-indicator
 * shells, appending blank shells before the deck indicator if any have been
 * removed (e.g. by discarding cards from the hand).
 */
function ensureBaseActionCardShells() {
  if (!actionCardsPanel) return;
  const existing = actionCardsPanel.querySelectorAll(".action-card-shell:not(.deck-indicator-shell)").length;
  const missing = ACTION_CARD_SLOT_COUNT - existing;
  if (missing <= 0) return;
  for (let i = 0; i < missing; i++) {
    const shell = createActionCardShell();
    if (deckIndicatorShell && deckIndicatorShell.parentNode === actionCardsPanel) {
      actionCardsPanel.insertBefore(shell, deckIndicatorShell);
    } else {
      actionCardsPanel.append(shell);
    }
  }
  refreshActionCardShells();
  setActionCardFlipOrder();
}

// ── Resource icon HTML ─────────────────────────────────────────────────────

const RESOURCE_IMAGE_PATH = "./img/";

/**
 * Renders the icon HTML for a resource key from the new card schema
 * (e.g. "attack", "movement", "draw"). `drawMeta` is supplied for "draw"
 * resources to wire up the click-to-draw pip:
 *   { row: "main"|"boost", key: "main"|"main2"|"boost"|"boost2", count: number }
 */
function renderResourceIcon(resourceKey, drawMeta) {
  if (!resourceKey) return "";

  if (resourceKey === "draw") {
    const meta = drawMeta || { row: "main", key: "main", count: 1 };
    const plural = meta.count === 1 ? "" : "s";
    return `<span class="resource-icon-wrap draw-pip" data-row="${meta.row}" data-draw-key="${meta.key}" `
      + `data-draw-count="${meta.count}" role="button" tabindex="0" aria-label="Draw ${meta.count} card${plural}">`
      + `<span class="card-icon-bg"></span>`
      + `<img src="${RESOURCE_IMAGE_PATH}card.png" alt="card" class="resource-icon card-icon" onerror="this.style.display='none'" /></span>`;
  }

  const iconBase = (typeof RESOURCE_ICON_BY_KEY !== "undefined" && RESOURCE_ICON_BY_KEY[resourceKey])
    ? RESOURCE_ICON_BY_KEY[resourceKey]
    : resourceKey;
  return `<img src="${RESOURCE_IMAGE_PATH}${iconBase}.png" alt="${resourceKey}" class="resource-icon" onerror="this.style.display='none'" />`;
}

/**
 * Replaces `{token}` substrings in special-text strings with inline
 * resource icons. Unknown tokens render as the bracketed word in italic.
 * `row`/`keyPrefix` lets `{card}`/`{draw}` tokens be wired into the same
 * draw pip click flow as the numeric pips (so e.g. "Draw 2 {card}" works).
 */
function renderSpecialText(text, row, keyPrefix) {
  if (!text) return "";
  // Escape HTML in the surrounding text first to prevent injection from
  // any future user-authored cards. Tokens are always ASCII identifiers.
  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

  let drawIndex = 0;
  return escapeHtml(text).replace(/\{(\w+)\}/g, (full, rawToken) => {
    const token = rawToken.toLowerCase();

    // 1. Resource icon tokens (attack, movement, card, magic, ...).
    const resourceKey = (typeof RESOURCE_TOKENS !== "undefined")
      ? RESOURCE_TOKENS[token]
      : null;
    if (resourceKey) {
      let meta = null;
      if (resourceKey === "draw") {
        const key = drawIndex === 0 ? keyPrefix : `${keyPrefix}${drawIndex + 1}`;
        meta = { row, key, count: 1 };
        drawIndex++;
      }
      return `<span class="special-token">${renderResourceIcon(resourceKey, meta)}</span>`;
    }

    // 2. Tag icon tokens (discard, boost, enemy).
    const tagBase = (typeof TAG_ICON_BY_KEY !== "undefined")
      ? TAG_ICON_BY_KEY[token]
      : null;
    if (tagBase) {
      return `<span class="special-token"><img src="${RESOURCE_IMAGE_PATH}${tagBase}.png" alt="${token}" class="resource-icon" onerror="this.style.display='none'" /></span>`;
    }

    // 3. Color-name tokens render as a colored dot.
    const dotColor = (typeof COLOR_DOT_BY_KEY !== "undefined")
      ? COLOR_DOT_BY_KEY[token]
      : null;
    if (dotColor) {
      return `<span class="special-token color-dot" style="background-color:${dotColor}" aria-label="${token}"></span>`;
    }

    // 4. Unknown — render bracketed word in italic.
    return `<em class="special-token special-token-unknown">${rawToken}</em>`;
  });
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

/**
 * Builds the HTML for the main resource row from cardData.resources, in
 * the order defined by RESOURCE_DISPLAY_ORDER. Skips zero/missing entries.
 */
function formatMainResourceRow(cardData) {
  const resources = cardData.resources || {};
  const order = (typeof RESOURCE_DISPLAY_ORDER !== "undefined")
    ? RESOURCE_DISPLAY_ORDER
    : Object.keys(resources);

  const parts = [];
  let drawIndex = 0;
  for (const key of order) {
    const count = resources[key];
    if (!count) continue;
    let meta = null;
    if (key === "draw") {
      meta = { row: "main", key: drawIndex === 0 ? "main" : `main${drawIndex + 1}`, count };
      drawIndex++;
    }
    parts.push(`<span>${count}:${renderResourceIcon(key, meta)}</span>`);
  }
  if (parts.length === 0) return "";
  return `<div class="resource-pair">`
    + parts.join(' <span class="resource-divider">/</span> ')
    + `</div>`;
}

/** Builds the boost-row HTML (numeric or special). */
function formatBoostRow(cardData) {
  const boost = cardData.boost;
  if (!boost) return "";

  if (boost.special) {
    return `<div class="resource-pair resource-pair-special">`
      + renderSpecialText(boost.special, "boost", "boost")
      + `</div>`;
  }

  if (!boost.count || !boost.resource) return "";

  let meta1 = null;
  if (boost.resource === "draw") meta1 = { row: "boost", key: "boost", count: boost.count };
  let html = `<div class="resource-pair"><span>${boost.count}:${renderResourceIcon(boost.resource, meta1)}</span>`;

  const boost2 = cardData.boost2;
  if (boost2 && boost2.count && boost2.resource) {
    let meta2 = null;
    if (boost2.resource === "draw") meta2 = { row: "boost", key: "boost2", count: boost2.count };
    html += ` <span class="resource-divider">/</span> <span>${boost2.count}:${renderResourceIcon(boost2.resource, meta2)}</span>`;
  }
  html += "</div>";
  return html;
}

/** Formats a card's resource block as HTML. */
function formatCardResources(cardData) {
  // Special main-row text override.
  const hasSpecial = !!cardData.special;
  let html = hasSpecial
    ? `<div class="resource-pair resource-pair-special">`
        + renderSpecialText(cardData.special, "main", "main")
        + `</div>`
    : formatMainResourceRow(cardData);

  const hasMain = hasSpecial || (cardData.resources && Object.values(cardData.resources).some((n) => n));
  const boostHtml = formatBoostRow(cardData);
  if (hasMain && boostHtml) html += DIAMOND_HR_HTML;
  html += boostHtml;
  return html || "<div></div>";
}

// ── Shell population ───────────────────────────────────────────────────────

/** Populates a single action card shell with the given card data. */
function populateActionCardShell(shell, cardData) {
  if (!shell || !cardData) return;
  shell.dataset.cardId = cardData.id;
  COLOR_CLASSES.forEach((cls) => shell.classList.remove(cls));
  shell.classList.add(`action-card-${cardData.color}`);
  const summary = cardData.special
    ? cardData.special.replace(/[{}]/g, "")
    : "";
  shell.setAttribute("aria-label", `${cardData.title}${summary ? `: ${summary}` : ""}`);

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
