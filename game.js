import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

// ELEMENTS
const game = document.getElementById("game");
const timerDisplay = document.getElementById("timer");
const startButton = document.getElementById("startButton");
const message = document.getElementById("game-message");

// SCENE 3D
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9edcf5);
scene.fog = new THREE.Fog(0x9edcf5, 25, 100);

const camera = new THREE.PerspectiveCamera(
    65,
    game.clientWidth / game.clientHeight,
    0.1,
    150
);
camera.position.set(0, 5, 10);
camera.lookAt(0, 1, -8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(game.clientWidth, game.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
game.appendChild(renderer.domElement);

// LUMIERES
scene.add(new THREE.HemisphereLight(0xffffff, 0x58718a, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-5, 12, 8);
sun.castShadow = true;
scene.add(sun);

// SOL
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0xeaf7ff })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.12;
scene.add(ground);

// ROUTE
const road = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 200),
    new THREE.MeshStandardMaterial({ color: 0x59616b })
);
road.rotation.x = -Math.PI / 2;
road.position.y = -0.05;
scene.add(road);

// LIGNES DE LA ROUTE
for (let x of [-1.33, 1.33]) {
    const line = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.03, 200),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    line.position.set(x, 0, -45);
    scene.add(line);
}

// PERSONNAGE
const player = new THREE.Group();
scene.add(player);

const red = new THREE.MeshStandardMaterial({ color: 0xd71935 });
const skin = new THREE.MeshStandardMaterial({ color: 0xffc58a });
const black = new THREE.MeshStandardMaterial({ color: 0x202020 });
const white = new THREE.MeshStandardMaterial({ color: 0xffffff });

function addPart(parent, geometry, material, x, y, z) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(x, y, z);
    part.castShadow = true;
    parent.add(part);
    return part;
}

// Corps
addPart(player, new THREE.BoxGeometry(0.65, 0.8, 0.4), red, 0, 1.15, 0);

// Tete
addPart(player, new THREE.SphereGeometry(0.27, 20, 20), skin, 0, 1.85, 0);

// Bonnet
addPart(player, new THREE.ConeGeometry(0.22, 0.5, 16), red, 0, 2.23, 0);

// Pompon
addPart(player, new THREE.SphereGeometry(0.09, 12, 12), white, 0, 2.49, 0);

// Bras
addPart(player, new THREE.BoxGeometry(0.18, 0.65, 0.2), skin, -0.43, 1.2, 0);
addPart(player, new THREE.BoxGeometry(0.18, 0.65, 0.2), skin, 0.43, 1.2, 0);

// Jambes
const leftLeg = addPart(player, new THREE.BoxGeometry(0.22, 0.55, 0.25), black, -0.18, 0.42, 0);
const rightLeg = addPart(player, new THREE.BoxGeometry(0.22, 0.55, 0.25), black, 0.18, 0.42, 0);

player.position.z = 3;

// SAPINS
const trees = [];

function createTree(x, z) {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x70452b })
    );
    trunk.position.y = 0.4;
    tree.add(trunk);

    for (let i = 0; i < 3; i++) {
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(1.1 - i * 0.2, 1.5, 8),
            new THREE.MeshStandardMaterial({ color: 0x126b3a })
        );
        leaves.position.y = 1.2 + i * 0.65;
        tree.add(leaves);
    }

    tree.position.set(x, 0, z);
    scene.add(tree);
    trees.push(tree);
}

for (let z = -80; z < 10; z += 8) {
    createTree(-6, z);
    createTree(6, z - 3);
}

// NEIGE
const snowflakes = [];

for (let i = 0; i < 350; i++) {
    const flake = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );

    flake.position.set(
        (Math.random() - 0.5) * 25,
        Math.random() * 12,
        -Math.random() * 90
    );

    scene.add(flake);
    snowflakes.push(flake);
}

// OBJETS DU PARCOURS
const objects = [];
const lanes = [-2.5, 0, 2.5];

function createObstacle(lane, z) {
    const obstacle = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.2, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xd71935 })
    );
    body.position.y = 0.6;
    obstacle.add(body);

    obstacle.position.set(lanes[lane], 0, z);
    scene.add(obstacle);

    objects.push({
        mesh: obstacle,
        type: "obstacle",
        active: true
    });
}

function createCoin(lane, z) {
    const coin = new THREE.Mesh(
        new THREE.TorusGeometry(0.35, 0.09, 12, 24),
        new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.7,
            roughness: 0.2
        })
    );

    coin.position.set(lanes[lane], 1.2, z);
    scene.add(coin);

    objects.push({
        mesh: coin,
        type: "coin",
        active: true
    });
}

// GENERATION DES PATTERNS
let nextPattern = -30;

function generatePattern() {
    const pattern = Math.floor(Math.random() * 5);
    const lane = Math.floor(Math.random() * 3);

    if (pattern === 0) {
        createObstacle(lane, nextPattern);
    }

    if (pattern === 1) {
        createObstacle(0, nextPattern);
        createObstacle(2, nextPattern);
    }

    if (pattern === 2) {
        createCoin(lane, nextPattern);
    }

    if (pattern === 3) {
        createObstacle(lane, nextPattern);
        createCoin((lane + 1) % 3, nextPattern - 5);
    }

    if (pattern === 4) {
        createObstacle(0, nextPattern);
        createObstacle(1, nextPattern);
    }

    nextPattern -= 12;
}

// ETAT DU JEU
let running = false;
let startTime = 0;
let lanePosition = 1;
let playerX = 0;
let jumpHeight = 0;
let jumpVelocity = 0;
let elapsed = 0;
let speed = 0.35;

function startGame() {
    objects.forEach(obj => scene.remove(obj.mesh));
    objects.length = 0;

    nextPattern = -30;
    lanePosition = 1;
    playerX = 0;
    jumpHeight = 0;
    jumpVelocity = 0;
    elapsed = 0;
    speed = 0.35;

    player.position.set(0, 0, 3);

    for (let i = 0; i < 7; i++) {
        generatePattern();
    }

    startTime = performance.now();
    running = true;

    timerDisplay.textContent = "00:00.00";
    message.textContent = "Bonne chance !";
    startButton.style.display = "none";
}

// FIN DU JEU
function finishGame(text) {
    if (!running) return;

    running = false;

    message.textContent = text;
    startButton.textContent = "REJOUER";
    startButton.style.display = "block";

    // Enregistre le meilleur temps local
    const pseudo = localStorage.getItem("christmasPseudo") || "Invité";
    const scores = JSON.parse(localStorage.getItem("christmasScores") || "[]");

    scores.push({
        name: pseudo,
        time: elapsed
    });

    scores.sort((a, b) => a.time - b.time);
    localStorage.setItem("christmasScores", JSON.stringify(scores.slice(0, 10)));

    displayLeaderboard();
}

// CLASSEMENT LOCAL
function displayLeaderboard() {
    const list = document.getElementById("leaderboard");
    const scores = JSON.parse(localStorage.getItem("christmasScores") || "[]");

    list.innerHTML = "";

    scores.forEach(score => {
        const item = document.createElement("li");
        item.textContent = `${score.name} — ${(score.time / 1000).toFixed(2)} s`;
        list.appendChild(item);
    });
}

// DEPLACEMENT ET COMMANDES
const keys = {
    forward: false,
    slide: false
};

let isSliding = false;

function moveLeft() {
    if (running) lanePosition = Math.max(0, lanePosition - 1);
}

function moveRight() {
    if (running) lanePosition = Math.min(2, lanePosition + 1);
}

function jump() {
    if (running && jumpHeight === 0) {
        jumpVelocity = 0.22;
    }
}

// TOUCHES DU CLAVIER
document.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    if (key === "z") keys.forward = true;
    if (key === "q") moveLeft();
    if (key === "d") moveRight();
    if (key === "s") keys.slide = true;

    if (key === " ") jump();
});

document.addEventListener("keyup", event => {
    const key = event.key.toLowerCase();

    if (key === "z") keys.forward = false;
    if (key === "s") keys.slide = false;
});

// COMMANDES TACTILES
let touchStart = null;

game.addEventListener("touchstart", event => {
    touchStart = event.touches[0].clientX;
}, { passive: true });

game.addEventListener("touchend", event => {
    if (touchStart === null) return;

    const diff = event.changedTouches[0].clientX - touchStart;

    if (Math.abs(diff) > 30) {
        if (diff < 0) moveLeft();
        else moveRight();
    } else {
        jump();
    }

    touchStart = null;
}, { passive: true });

startButton.addEventListener("click", startGame);

// ANIMATION
function animate(now) {
    requestAnimationFrame(animate);

    if (running) {
        elapsed = now - startTime;

        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const hundredths = Math.floor((elapsed % 1000) / 10);

        timerDisplay.textContent =
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}.` +
            `${String(hundredths).padStart(2, "0")}`;

        // Deplacement du personnage
        playerX += (lanes[lanePosition] - playerX) * 0.18;
        player.position.x = playerX;

        // Saut
        jumpHeight += jumpVelocity;
        jumpVelocity -= 0.012;

        if (jumpHeight < 0) {
            jumpHeight = 0;
            jumpVelocity = 0;
        }

        player.position.y = jumpHeight;

        leftLeg.rotation.x = Math.sin(now * 0.015) * 0.4;
        rightLeg.rotation.x = -Math.sin(now * 0.015) * 0.4;

        // Avancement des objets
        objects.forEach(obj => {
            if (!obj.active) return;

            obj.mesh.position.z += speed;

            if (obj.type === "coin") {
                obj.mesh.rotation.y += 0.06;

                // Le chrono s'arrete au contact d'une piece
                if (
                    Math.abs(obj.mesh.position.z - player.position.z) < 0.8 &&
                    Math.abs(obj.mesh.position.x - player.position.x) < 0.8
                ) {
                    obj.active = false;
                    finishGame("🪙 Pièce touchée ! Temps arrêté.");
                }
            }

            if (
                obj.type === "obstacle" &&
                Math.abs(obj.mesh.position.z - player.position.z) < 0.8 &&
                Math.abs(obj.mesh.position.x - player.position.x) < 0.8 &&
                jumpHeight < 0.8
            ) {
                finishGame("💥 Tu as touché un obstacle !");
            }

            if (obj.mesh.position.z > 12) {
                obj.active = false;
                scene.remove(obj.mesh);
            }
        });

        // Nouveaux patterns
        if (nextPattern > -90) {
            generatePattern();
        }

        // Difficulté progressive
        speed = Math.min(0.65, 0.35 + elapsed / 120000);
    }

    // Neige qui tombe
    snowflakes.forEach(flake => {
        flake.position.z += running ? speed * 1.5 : 0.04;
        flake.position.y -= 0.025;

        if (flake.position.y < 0 || flake.position.z > 12) {
            flake.position.y = 10 + Math.random() * 3;
            flake.position.z = -80;
        }
    });

    // Sapins qui défilent
    if (running) {
        trees.forEach(tree => {
            tree.position.z += speed;

            if (tree.position.z > 12) {
                tree.position.z = -80;
            }
        });
    }

    renderer.render(scene, camera);
}

function resizeGame() {
    const width = game.clientWidth;
    const height = game.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

window.addEventListener("resize", resizeGame);

displayLeaderboard();
requestAnimationFrame(animate);
