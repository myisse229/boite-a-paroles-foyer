const API_URL = "https://script.google.com/macros/s/AKfycbzdI3US6ZQG3s_QZ2rbla6HHmzat7B4M21xk-oH6NS_bI0Cq1gJhcIDy4cIjhJUdjKUXw/exec";

const form = document.getElementById("form");
const prenomBox = document.getElementById("prenomBox");
const prenom = document.getElementById("prenom");
const message = document.getElementById("message");
const count = document.getElementById("count");
const result = document.getElementById("result");
const submit = document.getElementById("submit");

document.querySelectorAll('input[name="identite"]').forEach(function(radio) {
  radio.addEventListener("change", function() {
    const withName =
      document.querySelector('input[name="identite"]:checked').value === "prenom";

    prenomBox.classList.toggle("hidden", !withName);
    prenom.required = withName;
  });
});

message.addEventListener("input", function() {
  count.textContent = message.value.length;
});

form.addEventListener("submit", async function(e) {
  e.preventDefault();

  result.className = "result";
  result.textContent = "";

  submit.disabled = true;
  submit.textContent = "Envoi en cours…";

  const anonymous =
    document.querySelector('input[name="identite"]:checked').value === "anonyme";

  const params = new URLSearchParams({
    action: "send",
    categorie: document.getElementById("categorie").value,
    anonyme: String(anonymous),
    prenom: anonymous ? "" : prenom.value.trim(),
    message: message.value.trim()
  });

  try {
    const response = await fetch(API_URL + "?" + params.toString());
    const data = await response.json();

    if (!data.ok) {
      throw new Error(
        data.error || "Impossible d'envoyer la note."
      );
    }

    result.className = "result ok";
    result.textContent = "✅ Ta note a bien été transmise.";

    form.reset();

    document.querySelector(
      'input[name="identite"][value="anonyme"]'
    ).checked = true;

    prenomBox.classList.add("hidden");
    prenom.required = false;
    count.textContent = "0";

  } catch (err) {
    result.className = "result error";
    result.textContent = "❌ " + err.message;

  } finally {
    submit.disabled = false;
    submit.textContent = "📤 Envoyer ma note";
  }
});
