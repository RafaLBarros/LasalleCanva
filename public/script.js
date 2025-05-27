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
    console.log("Clicou")
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
canvas.addEventListener("mousemove", async (event) => {
    if (window.isAdmin && isMouseDown) {
        await handlePaint(event);
    }
});

// Evento ao soltar o botão do mouse
canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
});
canvas.addEventListener("click", async (event) => {
    if (!window.isAdmin) {
        await handlePaint(event);
    }
});

// Função de pintura individual
async function handlePaint(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);
    const color = colorPicker.value;

    try {
        const response = await fetch('/click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ x, y, color, uid }),
        });

        const data = await response.json();
        if (data.success) {
            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        } else {
            console.warn(data.error);
            alert(data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}


async function atualizarPagina(){
    console.log("atualizei a pagina");
    await drawGrid();
}
drawGrid();
const socket = io(); // conecta com o servidor

socket.on("pixelUpdate", ({ x, y, color }) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
});