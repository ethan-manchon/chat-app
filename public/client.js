const socket = io();
let pseudoValue = "";
const loginForm = document.getElementById("login-form");
const pseudoInput = document.getElementById("pseudo-input");
const passwordInput = document.getElementById("password-input");
const chatContainer = document.getElementById("chat-container");
const form = document.getElementById("form");
const inputMessage = document.getElementById("message");
const messages = document.getElementById("messages");
const logoutButton = document.getElementById("logout");

if (loginForm && pseudoInput) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (pseudoInput.value && passwordInput.value) {
      try {
        const response = await fetch("/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pseudo: pseudoInput.value,
            password: passwordInput.value,
          }),
        });
        const result = await response.json();
        console.log("Réponse du serveur:", result);
        console.log("Response OK:", response.ok);
        console.log("Result:", result.success);
        if (response.ok && result && result.success) {
          pseudoValue = pseudoInput.value;
          loginForm.style.display = "none";
          if (chatContainer) chatContainer.style.display = "block";
        } else {
          alert("Identifiants invalides : pseudo: " + pseudoInput.value + " password: " + passwordInput.value);
        }
      } catch (err) {
        alert("Erreur serveur ou réseau");
      }
    }
  });
}
// Vérifie la session au chargement de la page
window.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch("/me", { method: "GET" });
    const result = await response.json();
    if (response.ok && result && result.pseudo) {
      pseudoValue = result.pseudo;
      if (loginForm) loginForm.style.display = "none";
      if (chatContainer) chatContainer.style.display = "block";
    }
  } catch (err) {
    // ignore, pas de session
  }
});
if (logoutButton) {
  logoutButton.addEventListener("click", async function () {
    try {
      await fetch("/logout", { method: "GET" });
      window.location.reload();
    } catch (err) {
      alert("Erreur lors de la déconnexion");
    }
  });
}

if (form && inputMessage && messages) {
  socket.on("chat history", function (data) {
    messages.innerHTML = "";
    data.forEach(function (msg) {
      const item = document.createElement("li");
      const pseudoSpan = document.createElement("span");
      pseudoSpan.className = "pseudo";
      pseudoSpan.textContent = msg.author + ": ";
      const messageSpan = document.createElement("span");
      messageSpan.className = "message";
      messageSpan.textContent = msg.message;
      item.appendChild(pseudoSpan);
      item.appendChild(messageSpan);
      messages.appendChild(item);
    });
    messages.scrollTop = messages.scrollHeight;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (pseudoValue && inputMessage.value) {
      socket.emit("chat message", {
        author: pseudoValue,
        message: inputMessage.value,
      });
      inputMessage.value = "";
      inputMessage.focus();
    }
  });

  socket.on("chat message", function (data) {
    const item = document.createElement("li");
    const pseudoSpan = document.createElement("span");
    pseudoSpan.className = "pseudo";
    pseudoSpan.textContent = data.author + ": ";
    const messageSpan = document.createElement("span");
    messageSpan.className = "message";
    messageSpan.textContent = data.message;
    item.appendChild(pseudoSpan);
    item.appendChild(messageSpan);
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  });
}
