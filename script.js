/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content

  // Show message
  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

/* ============================================================
   L'Oréal Smart Product Advisor — script.js
   This file:
   1. Grabs the HTML elements we need to work with
   2. Keeps a running list of the conversation ("messages")
   3. Sends that list to the class Cloudflare Worker when the
      user submits the form
   4. Shows the assistant's reply in the chat window
   ============================================================ */

/* -------- 1. Grab the DOM elements -------- */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* -------- 2. Where to send chat requests --------
   This is the class-hosted Cloudflare Worker from the README.
   It holds the OpenAI key for us — we never handle the key here. */
const WORKER_URL = "https://loreal-chatbot.nidhisgokidi.workers.dev/";
// TODO: replace the URL above with the exact Worker URL from the README.

/* -------- 3. The system prompt --------
   This is the very first message in the conversation. It tells the
   assistant how to behave. It is sent to the Worker along with every
   user message, but it is never shown in the chat window. */
const systemMessage = {
  role: "system",
  content: `You are the L'Oréal Smart Product Advisor, a friendly beauty
assistant. You help users discover L'Oréal products — makeup, skincare,
haircare, and fragrance — and suggest simple, personalized routines based
on what they tell you about their skin, hair, and goals.

Only answer questions about L'Oréal products, beauty routines, and
related beauty topics. If someone asks about something unrelated, kindly
say you can only help with L'Oréal products and routines, and invite them
to ask a beauty-related question instead. Keep answers short and friendly.`,
};

/* -------- 4. Keep a running conversation history --------
   We start with just the system message. Every time the user sends a
   message, we add it here, and every time we get a reply, we add that
   too. Sending the whole history each time lets the assistant remember
   what was already said. */
const messages = [systemMessage];

/* -------- 5. Show a message in the chat window --------
   role is either "user" or "ai", used to pick the CSS color style. */
function addMessageToChat(role, text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `msg ${role}`;
  messageDiv.textContent = text;
  chatWindow.appendChild(messageDiv);

  // Auto-scroll to the newest message
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Show a friendly greeting when the page first loads */
addMessageToChat(
  "ai",
  "👋 Hello! Tell me about your skin, hair, or beauty goals and I'll help you find the right L'Oréal products.",
);

/* -------- 6. Handle sending a message -------- */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // stop the page from reloading

  const text = userInput.value.trim();
  if (!text) return; // ignore empty submissions

  // Show the user's message right away
  addMessageToChat("user", text);
  messages.push({ role: "user", content: text });

  // Clear the input box and disable it while we wait for a reply
  userInput.value = "";
  userInput.disabled = true;

  // Show a temporary "thinking" message
  addMessageToChat("ai", "Thinking…");
  const thinkingBubble = chatWindow.lastElementChild;

  try {
    // Send the whole conversation to the class Cloudflare Worker
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });

    const data = await response.json();

    // Read the assistant's reply out of the response
    const reply = data.choices[0].message.content;

    // Replace the "Thinking…" bubble with the real reply
    thinkingBubble.textContent = reply;
    messages.push({ role: "assistant", content: reply });
  } catch (error) {
    thinkingBubble.textContent =
      "Sorry, something went wrong. Please try again.";
    console.error("Chat request failed:", error);
  } finally {
    userInput.disabled = false;
    userInput.focus();
  }
});
