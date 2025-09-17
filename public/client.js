const socket = io();
let pseudoValue = "";
const pseudoForm = document.getElementById("pseudo-form");
const pseudoInput = document.getElementById("pseudo-input");
const chatContainer = document.getElementById("chat-container");
const form = document.getElementById("form");
const inputMessage = document.getElementById("message");
const messages = document.getElementById("messages");

if (pseudoForm && pseudoInput) {
  pseudoForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (pseudoInput.value) {
      pseudoValue = pseudoInput.value;
      pseudoForm.style.display = "none";
      if (chatContainer) chatContainer.style.display = "block";
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
