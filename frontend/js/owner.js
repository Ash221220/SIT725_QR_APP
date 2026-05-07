let ownerMenuItems = [];

const MENU_CATEGORIES = ["Appetizers", "Mains", "Desserts", "Sides", "Beverages"];

document.addEventListener("DOMContentLoaded", () => {
  try {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;

    if (!token || !user) {
      window.location.href = "login.html";
      return;
    }

    if (user.role !== "owner") {
      safeToast("Access denied");
      window.location.href = "login.html";
      return;
    }

    const ownerWelcome = document.getElementById("ownerWelcome");
    if (ownerWelcome) {
      ownerWelcome.textContent = `Welcome, ${user.name || user.email}`;
    }

    const modals = document.querySelectorAll(".modal");
    if (window.M?.Modal) {
      M.Modal.init(modals);
    }

    const selects = document.querySelectorAll("select");
    if (window.M?.FormSelect) {
      M.FormSelect.init(selects);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
      });
    }

    const addItemBtn = document.getElementById("addItemBtn");
    if (addItemBtn) {
      addItemBtn.addEventListener("click", resetMenuItemForm);
    }

    const searchInput = document.getElementById("ownerMenuSearch");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        try {
          renderOwnerMenu();
          renderCategorySections();
        } catch (error) {
          console.error(error);
          safeToast("Unable to refresh menu view.");
        }
      });
    }

    const imageInput = document.getElementById("itemImage");
    if (imageInput) {
      imageInput.addEventListener("input", updateImagePreview);
    }

    const categorySelect = document.getElementById("itemCategory");
    if (categorySelect) {
      categorySelect.addEventListener("change", handleCategoryChange);
    }

    const menuItemForm = document.getElementById("menuItemForm");
    if (menuItemForm) {
      menuItemForm.addEventListener("submit", handleMenuItemSubmit);
    }

    loadOwnerMenu();
  } catch (error) {
    console.error(error);
    safeToast("Owner page failed to initialize. Please refresh.");
  }
});

async function ownerApiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  } catch (error) {
    throw new Error("Network error. Please check backend connection.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data || {};
}

function getFilteredItems() {
  const searchInput = document.getElementById("ownerMenuSearch");
  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

  return ownerMenuItems.filter((item) => {
    const name = item.name || "";
    const category = normalizeCategory(item.category);
    const dietary = formatDietaryType(item.dietaryType);

    return (
      name.toLowerCase().includes(searchText) ||
      category.toLowerCase().includes(searchText) ||
      dietary.toLowerCase().includes(searchText)
    );
  });
}

async function loadOwnerMenu() {
  const tableBody = document.getElementById("ownerMenuTable");

  try {
    const response = await ownerApiRequest("/menu/my");
    ownerMenuItems = response.menu || [];
    renderOwnerMenu();
    renderCategorySections();
    updateOwnerStats();
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="center-align red-text">${error.message}</td>
      </tr>
    `;
  }
}

function renderOwnerMenu() {
  const tableBody = document.getElementById("ownerMenuTable");
  if (!tableBody) return;
  const filteredItems = getFilteredItems();

  if (!filteredItems.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="center-align">No menu items found</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredItems
    .map(
      (item) => `
      <tr>
        <td>${item.name || "-"}</td>
        <td>${normalizeCategory(item.category)}</td>
        <td><span class="dietary-badge ${item.dietaryType === "veg" ? "veg" : "non-veg"}">${formatDietaryType(item.dietaryType)}</span></td>
        <td>$${Number(item.price || 0).toFixed(2)}</td>
        <td>
          <span class="badge-status ${item.isAvailable ? "badge-approved" : "badge-disabled"}">
            ${item.isAvailable ? "Available" : "Unavailable"}
          </span>
        </td>
        <td>
          <button class="btn-small teal action-btn" onclick="editMenuItem('${item._id}')">Edit</button>
          <button class="btn-small ${item.isAvailable ? "orange" : "green"} action-btn" onclick="toggleMenuItemAvailability('${item._id}', ${!item.isAvailable})">
            ${item.isAvailable ? "Mark Unavailable" : "Mark Available"}
          </button>
          <button class="btn-small red action-btn" onclick="deleteMenuItem('${item._id}')">Delete</button>
        </td>
      </tr>
    `
    )
    .join("");
}

function renderCategorySections() {
  const container = document.getElementById("menuCategorySections");
  const filteredItems = getFilteredItems();

  if (!container) return;

  container.innerHTML = MENU_CATEGORIES.map((category) => {
    const items = filteredItems.filter((item) => normalizeCategory(item.category) === category);

    return `
      <div class="col s12 m6 l4">
        <div class="card owner-category-card">
          <div class="card-content">
            <span class="card-title">${category} (${items.length})</span>
            ${items.length
              ? items.map((item) => `
                <div class="category-item-row clickable-row" onclick="editMenuItem('${item._id}')">
                  <div>
                    <strong>${item.name}</strong>
                    <div class="grey-text text-darken-1">$${Number(item.price || 0).toFixed(2)}</div>
                  </div>
                  <span class="dietary-badge ${item.dietaryType === "veg" ? "veg" : "non-veg"}">${formatDietaryType(item.dietaryType)}</span>
                </div>
              `).join("")
              : '<p class="grey-text">No items in this category</p>'}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function updateOwnerStats() {
  const menuCount = document.getElementById("menuCount");
  const availableCount = document.getElementById("availableCount");
  const unavailableCount = document.getElementById("unavailableCount");

  const available = ownerMenuItems.filter((item) => item.isAvailable).length;
  const unavailable = ownerMenuItems.length - available;

  if (menuCount) menuCount.textContent = ownerMenuItems.length;
  if (availableCount) availableCount.textContent = available;
  if (unavailableCount) unavailableCount.textContent = unavailable;
}

function resetMenuItemForm() {
  try {
    const form = document.getElementById("menuItemForm");
    if (!form) return;
    form.reset();

    document.getElementById("menuItemId").value = "";
    document.getElementById("menuModalHeading").textContent = "Add Menu Item";
    document.getElementById("itemAvailable").checked = true;

    setSelectValue("itemCategory", "");
    setSelectValue("itemDietaryType", "");
    setDietaryRequired(true);
    updateImagePreview();

    if (window.M?.updateTextFields) {
      M.updateTextFields();
    }
  } catch (error) {
    console.error(error);
    safeToast("Unable to reset form.");
  }
}

function editMenuItem(itemId) {
  const item = ownerMenuItems.find((menuItem) => menuItem._id === itemId);
  if (!item) return;

  document.getElementById("menuItemId").value = item._id;
  document.getElementById("itemName").value = item.name || "";
  document.getElementById("itemDescription").value = item.description || "";
  document.getElementById("itemPrice").value = item.price;
  document.getElementById("itemImage").value = item.image || "";
  document.getElementById("itemAvailable").checked = !!item.isAvailable;

  setSelectValue("itemCategory", normalizeCategory(item.category));
  setSelectValue("itemDietaryType", item.dietaryType === "veg" ? "veg" : "non_veg");
  handleCategoryChange();

  document.getElementById("menuModalHeading").textContent = "Edit Menu Item";
  updateImagePreview();
  if (window.M?.updateTextFields) {
    M.updateTextFields();
  }

  const modalElement = document.getElementById("menuItemModal");
  const modalInstance = window.M?.Modal ? M.Modal.getInstance(modalElement) : null;
  if (modalInstance) {
    modalInstance.open();
  } else {
    safeToast("Modal could not be opened.");
  }
}

async function handleMenuItemSubmit(event) {
  event.preventDefault();
  const form = document.getElementById("menuItemForm");
  handleCategoryChange();
  if (!form.reportValidity()) {
    return;
  }

  const itemId = document.getElementById("menuItemId").value;
  const name = document.getElementById("itemName").value.trim();
  const category = document.getElementById("itemCategory").value;
  const dietaryType = document.getElementById("itemDietaryType").value;
  const description = document.getElementById("itemDescription").value.trim();
  const priceRaw = document.getElementById("itemPrice").value;
  const image = document.getElementById("itemImage").value.trim();

  const price = Number(priceRaw);
  if (Number.isNaN(price) || price < 0) {
    M.toast({ html: "Please enter a valid price." });
    return;
  }

  const payload = {
    name,
    category: normalizeCategory(category),
    dietaryType: dietaryType || undefined,
    description,
    price,
    image,
    isAvailable: document.getElementById("itemAvailable").checked,
  };

  try {
    if (itemId) {
      await ownerApiRequest(`/menu/my/${itemId}`, "PUT", payload);
      M.toast({ html: "Menu item updated" });
    } else {
      await ownerApiRequest("/menu/my", "POST", payload);
      M.toast({ html: "Menu item created" });
    }

    const modalElement = document.getElementById("menuItemModal");
    const modalInstance = window.M?.Modal ? M.Modal.getInstance(modalElement) : null;
    if (modalInstance) {
      modalInstance.close();
    }

    await loadOwnerMenu();
  } catch (error) {
    M.toast({ html: error.message });
  }
}

async function toggleMenuItemAvailability(itemId, isAvailable) {
  try {
    await ownerApiRequest(`/menu/my/${itemId}/availability`, "PATCH", { isAvailable });
    M.toast({ html: "Availability updated" });
    await loadOwnerMenu();
  } catch (error) {
    M.toast({ html: error.message });
  }
}

async function deleteMenuItem(itemId) {
  const confirmed = confirm("Delete this menu item?");
  if (!confirmed) return;

  try {
    await ownerApiRequest(`/menu/my/${itemId}`, "DELETE");
    M.toast({ html: "Menu item deleted" });
    await loadOwnerMenu();
  } catch (error) {
    M.toast({ html: error.message });
  }
}

function normalizeCategory(category) {
  return MENU_CATEGORIES.includes(category) ? category : "Mains";
}

function formatDietaryType(type) {
  return type === "veg" ? "Veg" : "Non-Veg";
}

function setSelectValue(selectId, value) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.value = value;
  if (window.M?.FormSelect) {
    M.FormSelect.init(select);
  }
}

function updateImagePreview() {
  const imageInput = document.getElementById("itemImage");
  const imageEl = document.getElementById("itemImagePreview");
  const wrapEl = document.getElementById("itemImagePreviewWrap");
  if (!imageInput || !imageEl || !wrapEl) return;

  const imageUrl = imageInput.value.trim();

  if (!imageUrl) {
    wrapEl.classList.add("hide");
    imageEl.removeAttribute("src");
    return;
  }

  imageEl.src = imageUrl;
  wrapEl.classList.remove("hide");
  imageEl.onerror = () => {
    wrapEl.classList.add("hide");
  };
}

function handleCategoryChange() {
  const categorySelect = document.getElementById("itemCategory");
  const dietarySelect = document.getElementById("itemDietaryType");
  const dietaryFieldWrap = document.getElementById("dietaryFieldWrap");
  if (!categorySelect || !dietarySelect) return;

  const category = categorySelect.value;
  const isBeverage = category === "Beverages";

  setDietaryRequired(!isBeverage);

  if (isBeverage) {
    setSelectValue("itemDietaryType", "");
    if (dietaryFieldWrap) dietaryFieldWrap.classList.add("hide");
  } else {
    if (dietaryFieldWrap) dietaryFieldWrap.classList.remove("hide");
  }

  dietarySelect.setCustomValidity("");
}

function setDietaryRequired(required) {
  const dietarySelect = document.getElementById("itemDietaryType");
  if (!dietarySelect) return;
  dietarySelect.required = required;
}

function safeToast(message) {
  if (window.M?.toast) {
    M.toast({ html: message });
  } else {
    console.warn(message);
  }
}
