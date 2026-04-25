const menuButton = document.getElementById("menuButton");
const menuDropdown = document.getElementById("menuDropdown");

menuButton.addEventListener("click", () => {
  const isOpen = !menuDropdown.hasAttribute("hidden");
  if (isOpen) {
    menuDropdown.setAttribute("hidden", "");
    menuButton.setAttribute("aria-expanded", "false");
  } else {
    menuDropdown.removeAttribute("hidden");
    menuButton.setAttribute("aria-expanded", "true");
  }
});

// Close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
    menuDropdown.setAttribute("hidden", "");
    menuButton.setAttribute("aria-expanded", "false");
  }
});
