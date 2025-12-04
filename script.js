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
let playbackSpeed = 1;

// New: sessionId to avoid race conditions when restarting/starting multiple times.
// Each play session increments sessionId; scheduled tasks check it to avoid running after restart.
let sessionId = 0;

// Keep track of scheduled reaction timeouts for cancellation on restart
let scheduledTimeouts = [];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function loadChat() {
    const res = await fetch("code.json");
    chatData = await res.json();
    // set a top avatar and name if present
    if (chatData && chatData.length) {
        const imgElem = document.getElementById("topAvatar").querySelector("img");
        if (imgElem && chatData[0].avatar) imgElem.src = chatData[0].avatar;
    }
    progressLabel.textContent = `0/${chatData.length}`;
}
loadChat();

function typingDuration(text) {
    const base =  Math.max(400, text.length * 200);
    return Math.round(base / playbackSpeed);
}

function showTyping(msg) {
    typingName.textContent = msg.name + " is typing…";
    typingAvatar.src = msg.avatar || "";
    typingBox.classList.remove("hidden");
}
function hideTyping() { typingBox.classList.add("hidden"); }

function clearScheduledTimeouts() {
    // Cancel scheduled reaction timeouts
    scheduledTimeouts.forEach(t => clearTimeout(t));
    scheduledTimeouts = [];
}

function addMessage(msg) {
    const div = document.createElement("div");
    div.className = `msg ${msg.side}`;

    div.innerHTML = `
        <div class="avatar"><img src="${msg.avatar}"></div>
        <div>
            <div class="metaRow">${msg.name}</div>
            <div class="bubble" data-id="${msg.id}">${msg.text}</div>
        </div>
    `;
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // If this message has a reaction in JSON, schedule showing it after a short delay.
    if (msg.reaction && msg.reaction.trim()) {
        // schedule reaction only for current session
        const thisSession = sessionId;
        const bubble = div.querySelector(".bubble");

        // delay = random between 500ms and 2200ms scaled by playbackSpeed (so faster playback = shorter waits)
        const baseDelay = 800 + Math.floor(Math.random() * 1300);
        const delay = Math.max(200, Math.round(baseDelay / playbackSpeed));

        const t = setTimeout(() => {
            // Only show reaction if session hasn't changed and not paused/stopped
            if (thisSession !== sessionId) return;
            // append reaction span
            const r = document.createElement("span");
            r.className = "reaction";
            r.textContent = msg.reaction;
            bubble.appendChild(r);
            // force a small show animation (toggle class)
            requestAnimationFrame(() => r.classList.add("show"));
        }, delay);

        scheduledTimeouts.push(t);
    }
}

async function playChat() {
    // start a new session: increment session id and clear old scheduled tasks
    sessionId++;
    const mySession = sessionId;
    playing = true;
    paused = false;

    // UI states
    playBtn.style.display = "none";
    pauseBtn.style.display = "inline-block";
    resumeBtn.style.display = "none";
    restartBtn.style.display = "inline-block";
    speedSelect.style.display = "inline-block";
    statusLabel.textContent = "Playing";

    // main replay loop - checks sessionId to avoid running if restarted
    while (playing && index < chatData.length) {
        // abort if session changed
        if (mySession !== sessionId) return;

        const msg = chatData[index];

        showTyping(msg);
        let duration = typingDuration(msg.text);

        let elapsed = 0;
        while (elapsed < duration) {
            if (!playing || mySession !== sessionId) return;
            if (paused) { await sleep(100); continue; }
            await sleep(100);
            elapsed += 100;
        }

        hideTyping();

        // ensure not paused or stopped
        while (paused) await sleep(100);
        if (!playing || mySession !== sessionId) return;

        // add message
        addMessage(msg);

        index++;
        progressLabel.textContent = `${index}/${chatData.length}`;

        // short post delay between messages
        let post = Math.round(50 / playbackSpeed);
        while (post > 0) {
            if (!playing || mySession !== sessionId) return;
            if (paused) { await sleep(100); continue; }
            await sleep(100);
            post -= 100;
        }
    }

    // finished playback for this session
    if (mySession !== sessionId) return;
    playing = false;

    playBtn.style.display = "inline-block";
    playBtn.textContent = "Play Again";
    pauseBtn.style.display = "none";
    resumeBtn.style.display = "none";
    restartBtn.style.display = "inline-block";

    statusLabel.textContent = "Finished";
}

playBtn.addEventListener("click", () => {
    // show controls
    pauseBtn.style.display = "inline-block";
    speedSelect.style.display = "inline-block";

    // start from beginning if at end
    if (!playing) {
        if (index >= chatData.length) {
            // cancel scheduled tasks from previous session
            clearScheduledTimeouts();
            chatWindow.innerHTML = "";
            index = 0;
            progressLabel.textContent = `0/${chatData.length}`;
        }
        playbackSpeed = parseFloat(speedSelect.value) || 1;
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

restartBtn.addEventListener("click", () => {
    // increment session id to cancel in-progress operations
    sessionId++;
    // clear scheduled reaction timeouts
    clearScheduledTimeouts();

    // reset state
    playing = false;
    paused = false;

    chatWindow.innerHTML = "";
    index = 0;
    progressLabel.textContent = `0/${chatData.length}`;

    // small delay to ensure previous async loops notice the sessionId increment
    setTimeout(() => {
        playbackSpeed = parseFloat(speedSelect.value) || 1;
        playChat();
    }, 50);
});

// fix: use 'change' event (was misspelled 'chnage')
speedSelect.addEventListener("change", () => {
    playbackSpeed = parseFloat(speedSelect.value) || 1;
});
