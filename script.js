const playBtn = document.getElementById("playBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const speedSelect = document.getElementById("speedSelect");

const chatWindow = document.getElementById("chatWindow");
const typingBox = document.getElementById("typingBox");
const typingName = document.getElementById("typingName");
const typingAvatar = document.getElementById("typingAvatar");

const statusLabel = document.getElementById("statusLabel");
const progressLabel = document.getElementById("progressLabel");

let chatData = [];
let index = 0;
let playing = false;
let paused = false;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function loadChat() {
    const res = await fetch("code.json");
    chatData = await res.json();
    document.getElementById("topAvatar").querySelector("img").src = chatData[0].avatar;
    progressLabel.textContent = `0/${chatData.length}`;
}
loadChat();

/* Typing delay: 0.2 sec per character */
function typingDuration(text) {
    return Math.max(400, text.length * 200);
}

function showTyping(msg) {
    typingName.textContent = msg.name + " is typing…";
    typingAvatar.src = msg.avatar;
    typingBox.classList.remove("hidden");
}
function hideTyping() { typingBox.classList.add("hidden"); }

function addMessage(msg) {
    const div = document.createElement("div");
    div.className = `msg ${msg.side}`;

    div.innerHTML = `
        <div class="avatar"><img src="${msg.avatar}"></div>
        <div>
            <div class="metaRow">${msg.name}</div>
            <div class="bubble">${msg.text}</div>
        </div>
    `;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* ------------------------ MAIN PLAYBACK LOOP ------------------------ */
async function playChat() {
    playing = true;
    paused = false;

    playBtn.style.display = "none";          // hide play during playing
    pauseBtn.style.display = "inline-block"; // show pause
    resumeBtn.style.display = "none";        
    restartBtn.style.display = "inline-block"; // enable restart

    statusLabel.textContent = "Playing";

    while (playing && index < chatData.length) {
        const msg = chatData[index];

        showTyping(msg);
        let duration = typingDuration(msg.text);

        let elapsed = 0;
        while (elapsed < duration) {
            if (!playing) return;
            if (paused) { await sleep(100); continue; }
            await sleep(100);
            elapsed += 100;
        }

        hideTyping();

        // wait for resume if paused
        while (paused) await sleep(100);
        if (!playing) return;

        addMessage(msg);

        index++;
        progressLabel.textContent = `${index}/${chatData.length}`;

        let post = 600;
        while (post > 0) {
            if (!playing) return;
            if (paused) { await sleep(100); continue; }
            await sleep(100);
            post -= 100;
        }
    }

    playing = false;

    // At end
    playBtn.style.display = "inline-block";
    playBtn.textContent = "Play Again";
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "none";
    restartBtn.style.display = "inline-block";

    statusLabel.textContent = "Finished";
}

/* ------------------------ BUTTON HANDLERS ------------------------ */

playBtn.addEventListener("click", () => {
    if (!playing) {
        if (index >= chatData.length) {
            chatWindow.innerHTML = "";
            index = 0;
            progressLabel.textContent = `0/${chatData.length}`;
        }
        playChat();
    }
});

pauseBtn.addEventListener("click", () => {
    paused = true;
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "inline-block";
    statusLabel.textContent = "Paused";
});

resumeBtn.addEventListener("click", () => {
    paused = false;
    resumeBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
    statusLabel.textContent = "Playing";
});

// NEW: dedicated restart button
restartBtn.addEventListener("click", () => {
    playing = false;
    paused = false;

    chatWindow.innerHTML = "";
    index = 0;
    progressLabel.textContent = `0/${chatData.length}`;

    playChat();
});
