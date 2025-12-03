let chatData = [];
let currentIndex = 0;
let playing = false;
let speedMultiplier = 1;

const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const speedSelect = document.getElementById("speedSelect");
const chatWindow = document.getElementById("chatWindow");
const typingBar = document.getElementById("typingBar");
const typingAvatar = document.getElementById("typingAvatar");
const typingName = document.getElementById("typingName");

speedSelect.addEventListener("change", () => {
    speedMultiplier = parseFloat(speedSelect.value);
});

playBtn.addEventListener("click", () => {
    if (chatData.length === 0) return;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    playing = true;
    playback();
});

pauseBtn.addEventListener("click", () => {
    playing = false;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
});

async function loadChatData() {
    const res = await fetch("chat_data.json");
    chatData = await res.json();
}
loadChatData();

function showTyping(msg) {
    typingAvatar.src = msg.avatar;
    typingName.innerText = msg.name + " is typing";
    typingBar.classList.remove("hidden");
}

function hideTyping() {
    typingBar.classList.add("hidden");
}

function addMessage(msg) {
    const div = document.createElement("div");
    div.className = `message ${msg.side}`;

    div.innerHTML = `
        <img src="${msg.avatar}">
        <div>
            <div class="bubble">${msg.text}</div>
            ${msg.reaction ? `<div class="reaction">${msg.reaction}</div>` : ""}
        </div>
    `;

    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function playback() {
    while (playing && currentIndex < chatData.length) {
        const msg = chatData[currentIndex];

        showTyping(msg);
        await new Promise(r => setTimeout(r, 800 / speedMultiplier));
        hideTyping();

        addMessage(msg);

        currentIndex++;
        await new Promise(r => setTimeout(r, 600 / speedMultiplier));
    }
}
