const API_URL = "https://script.google.com/macros/s/AKfycbzdI3US6ZQG3s_QZ2rbla6HHmzat7B4M21xk-oH6NS_bI0Cq1gJhcIDy4cIjhJUdjKUXw/exec";

let PIN = "";
let allMessages = [];

const loginBox = document.getElementById("loginBox");
const dashboard = document.getElementById("dashboard");
const pinInput = document.getElementById("pin");
const loginBtn = document.getElementById("loginBtn");
const loginResult = document.getElementById("loginResult");

const messagesBox = document.getElementById("messages");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("search");

const total = document.getElementById("total");
const pending = document.getElementById("pending");
const progress = document.getElementById("progress");
const done = document.getElementById("done");

loginBtn.addEventListener("click", login);

pinInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    login();
  }
});

document.getElementById("refreshBtn").addEventListener("click", loadMessages);

document.getElementById("printBtn").addEventListener("click", function() {
  window.print();
});

categoryFilter.addEventListener("change", render);
statusFilter.addEventListener("change", render);
searchInput.addEventListener("input", render);

async function login() {
  const pin = pinInput.value.trim();

  if (!pin) {
    loginResult.className = "result error";
    loginResult.textContent = "❌ Entre le PIN.";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Connexion…";
  loginResult.textContent = "";

  try {
    const data = await api({
      action: "auth",
      pin: pin
    });

    if (!data.ok) {
      throw new Error(data.error || "PIN incorrect.");
    }

    PIN = pin;

    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");

    await loadMessages();

  } catch (error) {
    loginResult.className = "result error";
    loginResult.textContent = "❌ " + error.message;

  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "🔐 Se connecter";
  }
}

async function loadMessages() {
  messagesBox.innerHTML = '<p class="loading">Chargement des demandes…</p>';

  try {
    const data = await api({
      action: "list",
      pin: PIN
    });

    if (!data.ok) {
      throw new Error(data.error || "Impossible de récupérer les demandes.");
    }

    allMessages = data.rows || [];

    updateStats();
    render();

  } catch (error) {
    messagesBox.innerHTML =
      '<p class="error-message">❌ ' +
      escapeHtml(error.message) +
      "</p>";
  }
}

async function changeStatus(id, statut) {
  try {
    const data = await api({
      action: "status",
      pin: PIN,
      id: id,
      statut: statut
    });

    if (!data.ok) {
      throw new Error(data.error || "Impossible de modifier le statut.");
    }

    const item = allMessages.find(function(row) {
      return row.id === id;
    });

    if (item) {
      item.statut = statut;
    }

    updateStats();
    render();

  } catch (error) {
    alert("Erreur : " + error.message);
  }
}

function updateStats() {
  total.textContent = allMessages.length;

  pending.textContent = allMessages.filter(function(row) {
    return row.statut === "À traiter";
  }).length;

  progress.textContent = allMessages.filter(function(row) {
    return row.statut === "En cours";
  }).length;

  done.textContent = allMessages.filter(function(row) {
    return row.statut === "Traité";
  }).length;
}

function render() {
  const category = categoryFilter.value;
  const status = statusFilter.value;
  const search = searchInput.value.trim().toLowerCase();

  const filtered = allMessages.filter(function(row) {

    if (category && row.categorie !== category) {
      return false;
    }

    if (status && row.statut !== status) {
      return false;
    }

    if (search) {
      const text = [
        row.prenom,
        row.categorie,
        row.message,
        row.statut,
        row.date
      ].join(" ").toLowerCase();

      if (!text.includes(search)) {
        return false;
      }
    }

    return true;
  });

  if (!filtered.length) {
    messagesBox.innerHTML =
      '<div class="empty">📭 Aucune demande correspondant aux critères.</div>';
    return;
  }

  messagesBox.innerHTML = filtered.map(function(row) {

    const auteur = row.anonyme
      ? "🔒 Anonyme"
      : "👤 " + escapeHtml(row.prenom);

    let statusClass = "status-pending";

    if (row.statut === "En cours") {
      statusClass = "status-progress";
    }

    if (row.statut === "Traité") {
      statusClass = "status-done";
    }

    return `
      <article class="message-card">

        <div class="message-header">

          <div>
            <strong>${auteur}</strong>
            <div class="date">
              ${escapeHtml(row.date)} à ${escapeHtml(row.heure)}
            </div>
          </div>

          <span class="category">
            ${escapeHtml(row.categorie)}
          </span>

        </div>

        <div class="message-content">
          ${escapeHtml(row.message)}
        </div>

        <div class="message-footer">

          <span class="status ${statusClass}">
            ${escapeHtml(row.statut)}
          </span>

          <select
            class="status-select"
            data-id="${escapeHtml(row.id)}"
          >
            <option value="À traiter" ${row.statut === "À traiter" ? "selected" : ""}>
              🔴 À traiter
            </option>

            <option value="En cours" ${row.statut === "En cours" ? "selected" : ""}>
              🟠 En cours
            </option>

            <option value="Traité" ${row.statut === "Traité" ? "selected" : ""}>
              🟢 Traité
            </option>
          </select>

        </div>

      </article>
    `;
  }).join("");

  document.querySelectorAll(".status-select").forEach(function(select) {
    select.addEventListener("change", function() {
      changeStatus(this.dataset.id, this.value);
    });
  });
}

async function api(params) {
  const url = API_URL + "?" + new URLSearchParams(params).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Erreur de connexion au serveur.");
  }

  return await response.json();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
