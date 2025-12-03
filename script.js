
const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const speedSelect = document.getElementById("speedSelect");

const chatWindow = document.getElementById("chatWindow");
const typingBox = document.getElementById("typingBox");
const typingName = document.getElementById("typingName");
const typingAvatar = document.getElementById("typingAvatar");

const statusLabel = document.getElementById("statusLabel");
const progressLabel = document.getElementById("progressLabel");

const themeToggle = document.getElementById("themeToggle");
const amoledToggle = document.getElementById("amoledToggle");

let chatData = [];
let index = 0;
let playing = false;
let speed = 1;


async function loadChat() {
    const res = await fetch("chat_data.json");
    chatData = await res.json();
    document.getElementById("topAvatar").querySelector("img").src = chatData[0].avatar;
    progressLabel.textContent = `0/${chatData.length}`;
}
loadChat();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }


function showTyping(msg) {
    typingName.textContent = msg.name + " is typing…";
    typingAvatar.src = msg.avatar;
    typingBox.classList.remove("hidden");
}

function hideTyping() {
    typingBox.classList.add("hidden");
}

function addMessage(msg) {
    const div = document.createElement("div");
    div.className = `msg ${msg.side}`;

    div.innerHTML = `
        <div class="avatar"><img src="${msg.avatar}"></div>
        <div>
            <div class="metaRow">${msg.name}</div>
            <div class="bubble">${msg.text}</div>
            ${msg.reaction ? `<div class="react">${msg.reaction}</div>` : ""}
        </div>
    `;

    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}


async function playChat() {
    playing = true;

    while (playing && index < chatData.length) {
        let msg = chatData[index];

        showTyping(msg);
        await sleep(800 / speed);

        hideTyping();
        addMessage(msg);

        index++;
        progressLabel.textContent = `${index}/${chatData.length}`;

        await sleep(650 / speed);
    }

    if (index >= chatData.length) {
        playing = false;
        playBtn.disabled = false;
        pauseBtn.disabled = true;
        statusLabel.textContent = "Finished";
    }
}


playBtn.addEventListener("click", () => {
    if (index >= chatData.length) {
        chatWindow.innerHTML = "";
        index = 0;
    }

    speed = parseFloat(speedSelect.value);
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    statusLabel.textContent = "Playing";

    playChat();
});

pauseBtn.addEventListener("click", () => {
    playing = false;
    pauseBtn.disabled = true;
    playBtn.disabled = false;
    statusLabel.textContent = "Paused";
});


if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

if (localStorage.getItem("amoled") === "true") {
    document.body.classList.add("amoled");
    amoledToggle.checked = true;
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

amoledToggle.addEventListener("change", () => {
    if (amoledToggle.checked) {
        document.body.classList.add("amoled");
        localStorage.setItem("amoled", "true");
    } else {
        document.body.classList.remove("amoled");
        localStorage.setItem("amoled", "false");
    }
});

/* system dark mode detection */
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
if (prefersDark.matches && !localStorage.getItem("theme")) {
    document.body.classList.add("dark");
}

/* Space = play/pause */
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        e.preventDefault();
        if (playing) pauseBtn.click();
        else playBtn.click();
    }
});
