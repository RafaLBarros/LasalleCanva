// Importando Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyB6u1mGrKgd7oZPfY5TqE5FYr9eraGlP1A",
    authDomain: "canva-lasalle.firebaseapp.com",
    databaseURL: "https://canva-lasalle-default-rtdb.firebaseio.com",
    projectId: "canva-lasalle",
    storageBucket: "canva-lasalle.firebasestorage.app",
    messagingSenderId: "1028330995532",
    appId: "1:1028330995532:web:bd8756f778e8bb87f119e9",
    measurementId: "G-EZ895WDHMR"
  };


// Inicializando Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* Arquivo: script.js */
const pixelSize = 10;
const width = 180;
const height = 93;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
let uid = 0;

let isMouseDown = false;

canvas.width = width * pixelSize;
canvas.height = height * pixelSize;

async function drawGrid() {

    // Busca pixels salvos no servidor
    try {
        const response = await fetch('/pixels');
        const pixels = await response.json();

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#ccc";

        // Desenha as linhas da grade
        for (let x = 0; x <= width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * pixelSize, 0);
            ctx.lineTo(x * pixelSize, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * pixelSize);
            ctx.lineTo(canvas.width, y * pixelSize);
            ctx.stroke();
        }


        pixels.forEach(pixel => {
            ctx.fillStyle = pixel.color;
            ctx.fillRect(pixel.x * pixelSize, pixel.y * pixelSize, pixelSize, pixelSize);
        });
    } catch (error) {
        console.error("Erro ao carregar pixels:", error);
    }
}

// Adicionando evento de clique para login
document.getElementById("loginBtn").addEventListener("click", async() => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (window.login) {
        uid = await window.login(email, password);
    }
});

// Evento para pressionar o mouse
canvas.addEventListener("mousedown", async (event) => {
    if (window.isAdmin) {
        isMouseDown = true;
        await handlePaint(event);
    }
});

// Evento para movimentar o mouse enquanto pressionado
let lastPaintTime = 0;
const paintInterval = 100; // ms

canvas.addEventListener("mousemove", async (event) => {
  if (window.isAdmin && isMouseDown) {
    const now = Date.now();
    if (now - lastPaintTime > paintInterval) {
      lastPaintTime = now;
      await handlePaint(event);
    }
  }
});

// Evento ao soltar o botão do mouse
window.addEventListener("mouseup", () => {
    isMouseDown = false;
});
canvas.addEventListener("click", async (event) => {
    if (!window.isAdmin) {
        await handlePaint(event);
    }
});
function showModalAlert(message) {
  const modal = document.getElementById("modalAlert");
  const modalMessage = document.getElementById("modalMessage");
  const modalClose = document.getElementById("modalClose");

  modalMessage.textContent = message;
  modal.style.display = "flex";

  function closeModal() {
    modal.style.display = "none";
    modalClose.removeEventListener("click", closeModal);
  }

  modalClose.addEventListener("click", closeModal);

  // Fecha o modal ao clicar fora da caixa de mensagem
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  }, { once: true });
}
// Função de pintura individual
async function handlePaint(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);
    const color = colorPicker.value;

    try {
        let headers = {
            "Content-Type": "application/json",
        };

        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch("/click", {
            method: "POST",
            headers,
            body: JSON.stringify({ x, y, color }),
        });

        const data = await response.json();
        if (data.success) {
            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        } else {
            console.warn(data.error);
            showModalAlert(data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}


drawGrid();
const socket = io(); // conecta com o servidor

socket.on("pixelUpdate", ({ x, y, color }) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
});