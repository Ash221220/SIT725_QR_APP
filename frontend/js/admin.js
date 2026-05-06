let restaurantsList = [];
let ownersList = [];
let pendingOwnersList = [];

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    window.location.href = "login.html";
    return;
  }

  if (user.role !== "super_admin" && user.role !== "admin") {
    M.toast({ html: "Access denied" });
    window.location.href = "login.html";
    return;
  }

  const modals = document.querySelectorAll(".modal");
  M.Modal.init(modals);

  const dropdowns = document.querySelectorAll(".dropdown-trigger");
  M.Dropdown.init(dropdowns, {
    constrainWidth: false,
    coverTrigger: false,
    closeOnClick: true,
    alignment: "left"
  });

  const adminWelcome = document.getElementById("adminWelcome");
  if (adminWelcome) {
    adminWelcome.textContent = `Welcome, ${user.name || user.email}`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  const logoutDropdownBtn = document.getElementById("logoutDropdownBtn");

  function handleLogout(e) {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  }

  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (logoutDropdownBtn) logoutDropdownBtn.addEventListener("click", handleLogout);

  const restaurantSearch = document.getElementById("restaurantSearch");
  if (restaurantSearch) {
    restaurantSearch.addEventListener("input", () => {
      renderRestaurants(restaurantsList);
    });
  }

  const ownerSearch = document.getElementById("ownerSearch");
  if (ownerSearch) {
    ownerSearch.addEventListener("input", () => {
      renderOwners(ownersList);
    });
  }
  const pendingOwnerSearch = document.getElementById("pendingOwnerSearch");
  if (pendingOwnerSearch) {
    pendingOwnerSearch.addEventListener("input", () => {
      renderPendingOwnerCards(pendingOwnersList);
    });
  }

  if (document.getElementById("pendingOwnerCards")) {
    loadPendingOwners();
  }

  if (document.getElementById("restaurantsTable")) {
    loadRestaurants();
  }

  if (document.getElementById("ownersTable")) {
    loadOwners();
  }

  if (document.getElementById("restaurantTablesContainer")) {
    loadIndividualRestaurantTables();
  }

  const saveTablesBtn = document.getElementById("saveTablesBtn");
  if (saveTablesBtn) {
    saveTablesBtn.addEventListener("click", saveTables);
  }
});

async function apiRequest(endpoint, method = "GET", body = null) {
  const token = localStorage.getItem("token");

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

async function loadPendingOwners() {
  const cardsContainer = document.getElementById("pendingOwnersCards");

  if (!cardsContainer) return;

  try {
    const owners = await apiRequest("/admin/owners/pending");
    pendingOwnersList = owners || [];

    renderPendingOwnerCards(pendingOwnersList);

  } catch (error) {
    cardsContainer.innerHTML = `
      <div class="col s12">
        <div class="card-panel red-text center-align">${error.message}</div>
      </div>
    `;
  }
}

function renderPendingOwners(owners) {
  const container = document.getElementById("pendingOwnersCards");
  const searchInput = document.getElementById("pendingOwnerSearch");

  if (!container) return;

  const searchText = searchInput
    ? searchInput.value.toLowerCase().trim()
    : "";

  const filteredOwners = owners.filter(owner => {
    const name = owner.name || "";
    const email = owner.email || "";
    const status = owner.status || "pending";

    return (
      name.toLowerCase().includes(searchText) ||
      email.toLowerCase().includes(searchText) ||
      status.toLowerCase().includes(searchText)
    );
  });

  if (!filteredOwners.length) {
    container.innerHTML = `
      <div class="col s12">
        <div class="card-panel center-align">No pending owners found</div>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredOwners.map(owner => `
    <div class="col s12 m6 l4">
      <div class="card pending-owner-card">
        <div class="card-content">
          <span class="card-title">${owner.name || "-"}</span>
          <p><strong>Email:</strong> ${owner.email || "-"}</p>
          <p>
            <strong>Status:</strong>
            <span class="badge-status badge-pending">
              ${owner.status || "pending"}
            </span>
          </p>
        </div>

        <div class="card-action pending-owner-actions">
          <button class="btn-small green" onclick="approveOwner('${owner._id}')">
            Approve
          </button>

          <button class="btn-small red" onclick="rejectOwner('${owner._id}')">
            Deny
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

async function loadRestaurants() {
  const tableBody = document.getElementById("restaurantsTable");

  if (!tableBody) return;

  try {
    const restaurants = await apiRequest("/admin/restaurants");
    restaurantsList = restaurants.restaurants || [];
    renderRestaurants(restaurantsList);
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="center-align red-text">${error.message}</td>
      </tr>
    `;
  }
}

function renderRestaurants(restaurants) {
  const tableBody = document.getElementById("restaurantsTable");
  const restaurantCount = document.getElementById("restaurantCount");
  const searchInput = document.getElementById("restaurantSearch");
  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

  if (!tableBody) return;

  const filteredRestaurants = restaurants.filter(restaurant => {
    const name = restaurant.name || "";
    const address = restaurant.address || "";
    const status = restaurant.isActive ? "active yes" : "inactive no";
    const totalTables = String(restaurant.totalTables || 0);

    return (
      name.toLowerCase().includes(searchText) ||
      address.toLowerCase().includes(searchText) ||
      status.toLowerCase().includes(searchText) ||
      totalTables.includes(searchText)
    );
  });

  if (restaurantCount) {
    restaurantCount.textContent = restaurantsList.length;
  }

  if (!filteredRestaurants.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="center-align">No restaurants found</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredRestaurants.map(restaurant => `
    <tr 
      class="clickable-row"
      onclick="goToRestaurantDetails('${restaurant._id}', '${escapeQuotes(restaurant.name || "Restaurant")}')"
    >
      <td>${restaurant.name || "-"}</td>
      <td>${restaurant.address || "-"}</td>
      <td>${restaurant.isActive ? "Yes" : "No"}</td>
      <td>${restaurant.totalTables || 0}</td>
    </tr>
  `).join("");
}

function goToRestaurantDetails(restaurantId, restaurantName) {
  window.location.href = `ind_restaurant.html?id=${restaurantId}&name=${encodeURIComponent(restaurantName)}`;
}

async function loadOwners() {
  const tableBody = document.getElementById("ownersTable");

  if (!tableBody) return;

  try {
    const response = await apiRequest("/admin/owners");
    ownersList = response.owners || response.data || response || [];
    renderOwners(ownersList);
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="center-align red-text">${error.message}</td>
      </tr>
    `;
  }
}

function renderOwners(owners) {
  const tableBody = document.getElementById("ownersTable");
  const searchInput = document.getElementById("ownerSearch");
  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

  if (!tableBody) return;

  const filteredOwners = owners.filter(owner => {
    const name = owner.name || "";
    const email = owner.email || "";
    const status = owner.status || "";
    const restaurantName = owner.restaurantName || owner.restaurant?.name || "";

    return (
      name.toLowerCase().includes(searchText) ||
      email.toLowerCase().includes(searchText) ||
      status.toLowerCase().includes(searchText) ||
      restaurantName.toLowerCase().includes(searchText)
    );
  });

  if (!filteredOwners.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="center-align">No owners found</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredOwners.map(owner => `
    <tr>
      <td>${owner.name || "-"}</td>
      <td>${owner.email || "-"}</td>
      <td>
        <span class="badge-status ${owner.status === "approved" ? "badge-approved" :
      owner.status === "disabled" ? "badge-disabled" :
        owner.status === "rejected" ? "badge-rejected" :
          "badge-pending"
    }">
          ${owner.status || "-"}
        </span>
      </td>
      <td>${owner.restaurantName || owner.restaurant?.name || "-"}</td>
      <td>
        <button
          class="btn-small red action-btn"
          onclick="removeOwnerAccess('${owner._id}')"
        >
          Remove Access
        </button>
      </td>
    </tr>
  `).join("");
}

function getQueryParam(paramName) {
  const params = new URLSearchParams(window.location.search);
  return params.get(paramName);
}

async function loadIndividualRestaurantTables() {
  const restaurantId = getQueryParam("id");
  const restaurantName = getQueryParam("name");
  const title = document.getElementById("restaurantDetailsTitle");
  const container = document.getElementById("restaurantTablesContainer");

  if (!container) return;

  if (title) {
    title.textContent = restaurantName
      ? `${restaurantName} - Tables & QR Codes`
      : "Restaurant Tables";
  }

  if (!restaurantId) {
    container.innerHTML = `
      <div class="col s12">
        <div class="card-panel red-text center-align">
          Restaurant ID is missing from the URL.
        </div>
      </div>
    `;
    return;
  }

  try {
    const response = await apiRequest(
      `/admin/restaurants/${restaurantId}/tables`,
      "GET"
    );

    const tables = response.tables || response.data || response || [];

    console.log("Loaded tables:", tables);

    if (!tables.length) {
      container.innerHTML = `
        <div class="col s12">
          <div class="card-panel center-align">
            No tables found for this restaurant.
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = tables.map(table => {
      const qrUrl = getQrImageUrl(table.qrCodeUrl);

      return `
        <div class="col s12 m6 l4">
          <div class="card table-qr-card hoverable">
            <div class="card-content center-align">

              <span class="card-title">
                Table ${table.tableNumber || "-"}
              </span>

              <p>Status: ${table.isActive ? "Active" : "Inactive"}</p>

              ${table.qrCodeUrl
          ? `
                    <img 
                      src="${qrUrl}" 
                      alt="QR Code for Table ${table.tableNumber}"
                      class="qr-image"
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                    >

                    <p class="red-text" style="display:none;">
                      QR image failed to load
                    </p>
                  `
          : `
                    <p class="red-text">
                      QR code not available
                    </p>
                  `
        }

            </div>
          </div>
        </div>
      `;
    }).join("");

  } catch (error) {
    container.innerHTML = `
      <div class="col s12">
        <div class="card-panel red-text center-align">
          ${error.message}
        </div>
      </div>
    `;
  }
}

function getQrImageUrl(qrCodeUrl) {
  if (!qrCodeUrl) return "";

  const cleanUrl = String(qrCodeUrl).trim();

  if (cleanUrl.startsWith("data:image")) {
    return cleanUrl;
  }

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  const backendBaseUrl = API_BASE_URL.replace("/api", "");

  if (cleanUrl.startsWith("/")) {
    return `${backendBaseUrl}${cleanUrl}`;
  }

  return `${backendBaseUrl}/${cleanUrl}`;
}

async function approveOwner(ownerId) {
  try {
    await apiRequest(`/admin/owners/${ownerId}/approve`, "PATCH");
    M.toast({ html: "Owner approved successfully" });

    loadPendingOwners();

  } catch (error) {
    M.toast({ html: error.message });
  }
}

async function rejectOwner(ownerId) {
  try {
    await apiRequest(`/admin/owners/${ownerId}/reject`, "PATCH");
    M.toast({ html: "Owner denied successfully" });

    loadPendingOwners();

  } catch (error) {
    M.toast({ html: error.message });
  }
}

async function removeOwnerAccess(ownerId) {
  const confirmed = confirm("Are you sure you want to remove this owner's access?");
  if (!confirmed) return;

  try {
    await apiRequest(`/admin/owners/${ownerId}/disable`, "PATCH");
    M.toast({ html: "Owner access removed successfully" });

    if (document.getElementById("ownersTable")) {
      loadOwners();
    }
  } catch (error) {
    M.toast({ html: error.message });
  }
}

function openTablesModal(restaurantId, restaurantName) {
  const selectedRestaurantId = document.getElementById("selectedRestaurantId");
  const selectedRestaurantName = document.getElementById("selectedRestaurantName");
  const totalTablesInput = document.getElementById("totalTablesInput");
  const tablesModalElement = document.getElementById("tablesModal");

  if (!selectedRestaurantId || !selectedRestaurantName || !totalTablesInput || !tablesModalElement) {
    return;
  }

  selectedRestaurantId.value = restaurantId;
  selectedRestaurantName.textContent = restaurantName;
  totalTablesInput.value = "";
  M.updateTextFields();

  const modal = M.Modal.getInstance(tablesModalElement);
  if (modal) {
    modal.open();
  }
}

async function saveTables() {
  const selectedRestaurantId = document.getElementById("selectedRestaurantId");
  const totalTablesInput = document.getElementById("totalTablesInput");
  const tablesModalElement = document.getElementById("tablesModal");

  if (!selectedRestaurantId || !totalTablesInput || !tablesModalElement) {
    return;
  }

  const restaurantId = selectedRestaurantId.value;
  const totalTables = parseInt(totalTablesInput.value, 10);

  if (!restaurantId || !totalTables || totalTables < 1) {
    M.toast({ html: "Enter a valid number of tables" });
    return;
  }

  try {
    await apiRequest(`/admin/restaurants/${restaurantId}/tables`, "POST", {
      totalTables
    });

    M.toast({ html: "Tables set successfully" });

    const modal = M.Modal.getInstance(tablesModalElement);
    if (modal) {
      modal.close();
    }

    if (document.getElementById("restaurantsTable")) {
      loadRestaurants();
    }
  } catch (error) {
    M.toast({ html: error.message });
  }
}

function escapeQuotes(text) {
  return String(text).replace(/'/g, "\\'");
}