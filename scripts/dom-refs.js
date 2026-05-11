// Centralised DOM element references shared across modules.
// Loaded before any module that consumes them.

const flyButton = document.querySelector(".fly-btn");
const deckButton = document.querySelector(".deck-icon-btn-new-hand");
const drawTopButton = document.querySelector(".deck-icon-btn-draw-top");
const drawBottomButton = document.querySelector(".deck-icon-btn-draw-bottom");
const shuffleDeckButton = document.querySelector(".deck-icon-btn-shuffle");
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
