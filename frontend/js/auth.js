document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    loginMessage.textContent = "Logging in...";
    loginMessage.className = "status-message center-align blue-text";

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        console.log("Login error response:", data.message);
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      const profileData = data.user;

      localStorage.setItem("user", JSON.stringify(profileData));

      if (profileData.role === "super_admin" || profileData.role === "admin") {
        window.location.href = "../pages/admin-dashboard.html";
      } else if (profileData.role === "owner") {
        window.location.href = "../pages/owner-dashboard.html";
      } else {
        throw new Error("Unauthorized role");
      }

    } catch (error) {
      loginMessage.textContent = error.message;
      loginMessage.className = "status-message center-align red-text";
    }
  });
});