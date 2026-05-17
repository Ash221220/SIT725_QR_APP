const MENU_CATEGORIES = ["Appetizers", "Mains", "Desserts", "Sides", "Beverages"];

const GUEST_CONTEXT_KEY = "guestContext";

document.addEventListener("DOMContentLoaded", () => {
  const restaurantId = getRestaurantIdFromUrl();
  const tableNumber = getQueryParam("table");

  if (!restaurantId) {
    showError("Invalid menu link — restaurant not found.");
    return;
  }

  storeGuestContext(restaurantId, tableNumber);
  updateTableLabel(tableNumber);
  loadPublicMenu(restaurantId);
});

function getRestaurantIdFromUrl() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const menuIndex = parts.indexOf("menu");
  if (menuIndex !== -1 && parts[menuIndex + 1]) {
    return parts[menuIndex + 1];
  }
  return getQueryParam("restaurantId");
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function storeGuestContext(restaurantId, tableNumber) {
  const context = { restaurantId };
  if (tableNumber) {
    context.tableNumber = tableNumber;
  }
  sessionStorage.setItem(GUEST_CONTEXT_KEY, JSON.stringify(context));
}

function updateTableLabel(tableNumber) {
  const tableLabel = document.getElementById("tableLabel");
  if (!tableLabel || !tableNumber) return;

  tableLabel.textContent = `Table ${tableNumber}`;
  tableLabel.classList.remove("hide");
}

function hideLoading() {
  const statusEl = document.getElementById("menuStatus");
  if (statusEl) statusEl.classList.add("hide");
}

function showError(message) {
  hideLoading();
  const errorWrap = document.getElementById("menuError");
  const panel = errorWrap?.querySelector(".card-panel");
  if (errorWrap && panel) {
    panel.textContent = message;
    errorWrap.classList.remove("hide");
  }
}

async function loadPublicMenu(restaurantId) {
  try {
    const response = await fetch(`${API_BASE_URL}/menu/public/${restaurantId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load menu");
    }

    hideLoading();
    renderMenu(data.menu || []);
  } catch (error) {
    showError(error.message);
  }
}

function renderMenu(items) {
  const container = document.getElementById("menuContainer");
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `
      <div class="card-panel center-align grey-text text-darken-1">
        No menu items are available right now. Please check back later.
      </div>
    `;
    return;
  }

  const sections = MENU_CATEGORIES.map((category) => {
    const categoryItems = items.filter((item) => normalizeCategory(item.category) === category);
    if (!categoryItems.length) return "";

    return `
      <section class="menu-category-section">
        <h5 class="menu-category-title">${escapeHtml(category)}</h5>
        <div class="row">
          ${categoryItems.map(renderMenuItemCard).join("")}
        </div>
      </section>
    `;
  }).filter(Boolean);

  container.innerHTML = sections.length
    ? sections.join("")
    : `<div class="card-panel center-align">No items to display.</div>`;
}

function renderMenuItemCard(item) {
  const dietaryClass = item.dietaryType === "veg" ? "veg" : "non-veg";
  const dietaryLabel = item.dietaryType === "veg" ? "Veg" : "Non-Veg";
  const showDietary = item.category !== "Beverages" && item.dietaryType;
  const imageHtml = item.image
    ? `<div class="menu-item-image-wrap">
         <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="menu-item-image" loading="lazy" />
       </div>`
    : "";

  return `
    <div class="col s12 m6 l4">
      <div class="card menu-item-card hoverable">
        ${imageHtml}
        <div class="card-content">
          <span class="card-title">${escapeHtml(item.name || "Item")}</span>
          ${item.description ? `<p class="grey-text text-darken-1 menu-item-desc">${escapeHtml(item.description)}</p>` : ""}
          <p class="menu-item-price">$${Number(item.price || 0).toFixed(2)}</p>
          ${showDietary ? `<span class="dietary-badge ${dietaryClass}">${dietaryLabel}</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function normalizeCategory(category) {
  return MENU_CATEGORIES.includes(category) ? category : "Mains";
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
