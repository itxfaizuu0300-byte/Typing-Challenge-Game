
// ==========================================
// TYPE QUEST - COMPLETE GAME JAVASCRIPT
// ==========================================

const homeScreen = document.querySelector("main");
const homeContent = homeScreen.innerHTML;

let selectedMode = "";
let selectedDifficulty = "easy";

let score = 0;
let timeLeft = 60;
let gameRunning = false;
let keyGameRunning = false;

let timerId = null;
let spawnId = null;
let animationId = null;
let targetChangeId = null;
let lastFrame = 0;

// BUBBLE RUSH VARIABLES
let bubbles = [];
let misses = 0;
let correctBubbles = 0;
let wrongBubbleKeys = 0;

const MISS_LIMIT = 6;

const difficultySettings = {
    easy: { speed: 35, spawn: 1300, time: 60 },
    medium: { speed: 55, spawn: 950, time: 60 },
    hard: { speed: 80, spawn: 700, time: 60 }
};

// KEYMAGNET VARIABLES
let targetKey = "";
let correctKeys = 0;
let wrongKeys = 0;
let responseTimes = [];
let targetStartTime = 0;
let selectedKeySet = "home";

const keySets = {
    home: ["A", "S", "D", "F", "J", "K", "L"],
    all: [
        "A", "S", "D", "F", "J", "K", "L",
        "Q", "W", "E", "R", "T", "Y", "U",
        "I", "O", "P", "Z", "X", "C", "V", "B", "N", "M"
    ]
};

const keyDifficultySettings = {
    easy: { time: 60, keys: "home", autoChange: 0 },
    medium: { time: 45, keys: "all", autoChange: 0 },
    hard: { time: 30, keys: "all", autoChange: 2000 }
};

// ==========================================
// HOME AND MODE SELECTION
// ==========================================

function selectMode(mode) {

    stopGame();

    selectedMode = mode;
    selectedDifficulty = "easy";
    selectedKeySet = "home";

    const modeName = mode === "bubbles"
        ? "Bubble Rush"
        : "KeyMagnet";

    const description = mode === "bubbles"
        ? "Catch the floating letters before they escape!"
        : "Match the target keys with speed and accuracy!";

    homeScreen.innerHTML = `
        <section class="hero">
            <h1>${modeName}</h1>
            <p>${description}</p>
        </section>

        <section class="mode-card">
            <h2>Choose Difficulty</h2>

            <select id="difficulty"
                onchange="changeDifficulty(this.value)"
                style="padding:12px;border-radius:10px;margin:15px;">

                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>

            </select>

            <br><br>

            <button class="play-btn" onclick="startGame()">
                START GAME
            </button>

            <br><br>

            <button class="play-btn" onclick="goHome()">
                BACK TO HOME
            </button>
        </section>
    `;
}

function changeDifficulty(level) {
    selectedDifficulty = level;
}

// ==========================================
// START SELECTED GAME
// ==========================================

function startGame() {

    stopGame();

    if (selectedMode === "bubbles") {
        startBubbleGame();
    } else if (selectedMode === "keymagnet") {
        startKeyMagnet();
    }
}

// ==========================================
// BUBBLE RUSH
// ==========================================

function startBubbleGame() {

    stopGame();

    score = 0;
    misses = 0;
    correctBubbles = 0;
    wrongBubbleKeys = 0;

    timeLeft = difficultySettings[selectedDifficulty].time;

    bubbles = [];
    gameRunning = true;
    lastFrame = 0;

    homeScreen.innerHTML = `
        <section class="hero">
            <h1>Bubble Rush</h1>
            <p>Press the matching letter to catch a bubble!</p>
        </section>

        <section class="game-panel">

            <div class="game-stats">
                <div class="stat-box">
                    <h3 id="score">0</h3>
                    <p>Score</p>
                </div>

                <div class="stat-box">
                    <h3 id="misses">0 / 6</h3>
                    <p>Misses</p>
                </div>

                <div class="stat-box">
                    <h3 id="timer">${timeLeft}</h3>
                    <p>Time Left</p>
                </div>

                <div class="stat-box">
                    <h3>${selectedDifficulty.toUpperCase()}</h3>
                    <p>Difficulty</p>
                </div>
            </div>

            <div class="game-feedback" id="feedback">
                Get ready! Catch the letters!
            </div>

            <div class="bubble-arena" id="arena"></div>

            <div class="game-controls">
                <button class="play-btn" onclick="restartGame()">
                    RESTART
                </button>

                <button class="play-btn" onclick="goHome()">
                    HOME
                </button>
            </div>

        </section>
    `;

    for (let i = 0; i < 5; i++) {
        createBubble();
    }

    updateBubbleStats();

    timerId = setInterval(() => {

        if (!gameRunning) return;

        timeLeft--;
        updateBubbleStats();

        if (timeLeft <= 0) {
            endBubbleGame("Time is over!");
        }

    }, 1000);

    spawnId = setInterval(() => {

        if (gameRunning && bubbles.length < 8) {
            createBubble();
        }

    }, difficultySettings[selectedDifficulty].spawn);

    document.addEventListener("keydown", handleBubbleKey);

    animationId = requestAnimationFrame(moveBubbles);
}

// CREATE BUBBLE
function createBubble() {

    const arena = document.getElementById("arena");

    if (!arena || !gameRunning) return;

    const letters = "ASDFJKLQWERTYUIOPZXCVBNM";

    const letter = letters[
        Math.floor(Math.random() * letters.length)
    ];

    const size = 55;

    const maxLeft = Math.max(0, arena.clientWidth - size);

    const bubble = {
        letter: letter,
        x: Math.random() * maxLeft,
        y: arena.clientHeight + Math.random() * 60,
        element: document.createElement("div")
    };

    bubble.element.className = "bubble";
    bubble.element.textContent = letter;

    bubble.element.style.left = bubble.x + "px";
    bubble.element.style.top = bubble.y + "px";

    arena.appendChild(bubble.element);

    bubbles.push(bubble);
}

// MOVE BUBBLES
function moveBubbles(timestamp) {

    if (!gameRunning) return;

    const delta = lastFrame
        ? Math.min((timestamp - lastFrame) / 1000, 0.05)
        : 0;

    lastFrame = timestamp;

    const settings = difficultySettings[selectedDifficulty];

    for (let i = bubbles.length - 1; i >= 0; i--) {

        if (!gameRunning) return;

        const bubble = bubbles[i];

        // Speed gradually increases during gameplay
        const progress = 1 + (60 - timeLeft) / 120;

        bubble.y -= settings.speed * progress * delta;
        bubble.element.style.top = bubble.y + "px";

        if (bubble.y + 55 < 0) {

            bubble.element.remove();
            bubbles.splice(i, 1);

            misses++;

            updateBubbleFeedback("Bubble missed! Try again.", false);
            updateBubbleStats();

            if (misses >= MISS_LIMIT) {
                endBubbleGame("You reached the miss limit!");
                return;
            }
        }
    }

    if (gameRunning) {
        animationId = requestAnimationFrame(moveBubbles);
    }
}

// CHECK BUBBLE KEY
function handleBubbleKey(event) {

    if (!gameRunning || event.repeat) return;

    const key = event.key.toUpperCase();

    if (!/^[A-Z]$/.test(key)) return;

    const index = bubbles.findIndex(
        bubble => bubble.letter === key
    );

    if (index !== -1) {

        const bubble = bubbles[index];

        bubble.element.remove();
        bubbles.splice(index, 1);

        score += 10;
        correctBubbles++;

        updateBubbleFeedback("Correct! +10 points", true);

    } else {

        score = Math.max(0, score - 2);
        wrongBubbleKeys++;

        updateBubbleFeedback("Wrong key! -2 points", false);
    }

    updateBubbleStats();
}

// UPDATE BUBBLE STATS
function updateBubbleStats() {

    const scoreElement = document.getElementById("score");
    const missElement = document.getElementById("misses");
    const timerElement = document.getElementById("timer");

    if (scoreElement) scoreElement.textContent = score;

    if (missElement) {
        missElement.textContent = misses + " / " + MISS_LIMIT;
    }

    if (timerElement) {
        timerElement.textContent = timeLeft;
    }
}

// BUBBLE FEEDBACK
function updateBubbleFeedback(message, correct) {

    const feedback = document.getElementById("feedback");

    if (!feedback) return;

    feedback.textContent = message;

    feedback.style.color = correct
        ? "#4ade80"
        : "#fb7185";
}

// END BUBBLE GAME
function endBubbleGame(message) {

    if (!gameRunning) return;

    stopGame();

    bubbles.forEach(bubble => bubble.element.remove());
    bubbles = [];

    const attempts = correctBubbles + wrongBubbleKeys;

    const accuracy = attempts > 0
        ? (correctBubbles / attempts * 100).toFixed(1)
        : "0.0";

    homeScreen.innerHTML = `
        <section class="game-panel">
            <div class="hero">
                <h1>Bubble Rush Results!</h1>
                <p>${message}</p>

                <h2>Final Score: ${score}</h2>
                <h3>Correct Bubbles: ${correctBubbles}</h3>
                <h3>Wrong Keys: ${wrongBubbleKeys}</h3>
                <h3>Missed Bubbles: ${misses}</h3>
                <h3>Accuracy: ${accuracy}%</h3>
                <h3>Difficulty: ${selectedDifficulty.toUpperCase()}</h3>
                <h3>Time Remaining: ${timeLeft}s</h3>
            </div>

            <div class="game-controls">
                <button class="play-btn" onclick="restartGame()">
                    PLAY AGAIN
                </button>

                <button class="play-btn" onclick="goHome()">
                    HOME
                </button>
            </div>
        </section>
    `;
}

// ==========================================
// KEYMAGNET
// ==========================================

function startKeyMagnet() {

    stopGame();

    score = 0;
    correctKeys = 0;
    wrongKeys = 0;
    responseTimes = [];

    timeLeft = keyDifficultySettings[selectedDifficulty].time;
    selectedKeySet = keyDifficultySettings[selectedDifficulty].keys;

    keyGameRunning = true;

    homeScreen.innerHTML = `
        <section class="hero">
            <h1>KeyMagnet</h1>
            <p>Press the target key as quickly as you can!</p>
        </section>

        <section class="game-panel">

            <div class="game-stats">
                <div class="stat-box">
                    <h3 id="kmScore">0</h3>
                    <p>Score</p>
                </div>

                <div class="stat-box">
                    <h3 id="kmCorrect">0</h3>
                    <p>Correct</p>
                </div>

                <div class="stat-box">
                    <h3 id="kmWrong">0</h3>
                    <p>Incorrect</p>
                </div>

                <div class="stat-box">
                    <h3 id="kmTimer">${timeLeft}</h3>
                    <p>Time Left</p>
                </div>
            </div>

            <div class="game-feedback" id="kmFeedback">
                Get ready!
            </div>

            <div class="mode-card">
                <h2>Target Key</h2>

                <h1 id="targetKey"
                    style="font-size:70px;color:#a78bfa;">
                    A
                </h1>

                <label for="keySet">Choose Key Set:</label>

                <select id="keySet"
                    onchange="changeKeySet(this.value)"
                    style="padding:12px;border-radius:10px;">

                    <option value="home">Home Row (A S D F J K L)</option>
                    <option value="all">All Letters</option>

                </select>
            </div>

            <h2>Keyboard</h2>

            <div class="keyboard" id="keyboard"></div>

            <div class="game-controls">
                <button class="play-btn" onclick="restartGame()">
                    RESTART
                </button>

                <button class="play-btn" onclick="goHome()">
                    HOME
                </button>
            </div>

        </section>
    `;

    // Keep selector consistent with selected difficulty
    document.getElementById("keySet").value = selectedKeySet;

    createKeyboard();
    generateTargetKey();

    document.addEventListener("keydown", handleKeyMagnet);

    // Hard mode automatically changes target every 2 seconds
    const autoChange = keyDifficultySettings[selectedDifficulty].autoChange;

    if (autoChange > 0) {

        targetChangeId = setInterval(() => {

            if (!keyGameRunning) return;

            generateTargetKey();
            updateKeyFeedback("Target changed! Be quick!", false);

        }, autoChange);
    }

    timerId = setInterval(() => {

        if (!keyGameRunning) return;

        timeLeft--;

        const timer = document.getElementById("kmTimer");

        if (timer) {
            timer.textContent = timeLeft;
        }

        if (timeLeft <= 0) {
            endKeyMagnet();
        }

    }, 1000);
}

// CREATE KEYBOARD
function createKeyboard() {

    const keyboard = document.getElementById("keyboard");

    if (!keyboard) return;

    keyboard.innerHTML = "";

    const rows = [
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    ];

    rows.forEach(row => {

        const rowElement = document.createElement("div");
        rowElement.className = "keyboard-row";

        for (const letter of row) {

            const keyButton = document.createElement("div");

            keyButton.className = "keyboard-key";
            keyButton.id = "key-" + letter;
            keyButton.textContent = letter;

            rowElement.appendChild(keyButton);
        }

        keyboard.appendChild(rowElement);
    });
}

// GENERATE TARGET
function generateTargetKey() {

    const keys = keySets[selectedKeySet];

    targetKey = keys[
        Math.floor(Math.random() * keys.length)
    ];

    const targetElement = document.getElementById("targetKey");

    if (targetElement) {
        targetElement.textContent = targetKey;
    }

    targetStartTime = Date.now();

    document.querySelectorAll(".keyboard-key").forEach(key => {
        key.classList.remove("active-key");
    });

    const activeKey = document.getElementById("key-" + targetKey);

    if (activeKey) {
        activeKey.classList.add("active-key");
    }
}

// CHANGE KEY SET
function changeKeySet(value) {

    if (!keyGameRunning) return;

    selectedKeySet = value;
    generateTargetKey();
}

// CHECK KEYMAGNET KEY
function handleKeyMagnet(event) {

    if (!keyGameRunning || event.repeat) return;

    const key = event.key.toUpperCase();

    if (!/^[A-Z]$/.test(key)) return;

    if (key === targetKey) {

        correctKeys++;
        score += 10;

        const responseTime = (Date.now() - targetStartTime) / 1000;

        responseTimes.push(responseTime);

        updateKeyFeedback("Correct! +10 points", true);

        generateTargetKey();

    } else {

        wrongKeys++;

        updateKeyFeedback("Wrong key! Try again.", false);
    }

    const scoreElement = document.getElementById("kmScore");
    const correctElement = document.getElementById("kmCorrect");
    const wrongElement = document.getElementById("kmWrong");

    if (scoreElement) scoreElement.textContent = score;
    if (correctElement) correctElement.textContent = correctKeys;
    if (wrongElement) wrongElement.textContent = wrongKeys;
}

// KEYMAGNET FEEDBACK
function updateKeyFeedback(message, correct) {

    const feedback = document.getElementById("kmFeedback");

    if (!feedback) return;

    feedback.textContent = message;

    feedback.style.color = correct
        ? "#4ade80"
        : "#fb7185";
}

// END KEYMAGNET
function endKeyMagnet() {

    if (!keyGameRunning) return;

    keyGameRunning = false;

    clearInterval(timerId);
    clearInterval(targetChangeId);

    timerId = null;
    targetChangeId = null;

    document.removeEventListener("keydown", handleKeyMagnet);

    const totalAttempts = correctKeys + wrongKeys;

    const accuracy = totalAttempts > 0
        ? (correctKeys / totalAttempts * 100).toFixed(1)
        : "0.0";

    const averageTime = responseTimes.length > 0
        ? (
            responseTimes.reduce((total, time) => total + time, 0) /
            responseTimes.length
        ).toFixed(2)
        : "0.00";

    homeScreen.innerHTML = `
        <section class="game-panel">
            <div class="hero">
                <h1>KeyMagnet Results!</h1>

                <h2>Final Score: ${score}</h2>
                <h3>Correct Keys: ${correctKeys}</h3>
                <h3>Incorrect Keys: ${wrongKeys}</h3>
                <h3>Accuracy: ${accuracy}%</h3>
                <h3>Average Response Time: ${averageTime}s</h3>
                <h3>Difficulty: ${selectedDifficulty.toUpperCase()}</h3>
            </div>

            <div class="game-controls">
                <button class="play-btn" onclick="restartGame()">
                    PLAY AGAIN
                </button>

                <button class="play-btn" onclick="goHome()">
                    HOME
                </button>
            </div>
        </section>
    `;
}

// ==========================================
// RESTART GAME
// ==========================================

function restartGame() {

    if (selectedMode === "bubbles") {
        startBubbleGame();
    } else if (selectedMode === "keymagnet") {
        startKeyMagnet();
    }
}

// ==========================================
// STOP ALL GAME LOOPS
// ==========================================

function stopGame() {

    gameRunning = false;
    keyGameRunning = false;

    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    clearInterval(timerId);
    clearInterval(spawnId);
    clearInterval(targetChangeId);

    timerId = null;
    spawnId = null;
    targetChangeId = null;

    document.removeEventListener("keydown", handleBubbleKey);
    document.removeEventListener("keydown", handleKeyMagnet);
}

// ==========================================
// RETURN HOME
// ==========================================

function goHome() {

    stopGame();

    bubbles.forEach(bubble => bubble.element.remove());
    bubbles = [];

    selectedMode = "";

    homeScreen.innerHTML = homeContent;
}
