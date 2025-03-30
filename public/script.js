/* Arquivo: script.js */
const pixelSize = 10;
const width = 180;
const height = 93;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
let uid = 0;

canvas.width = width * pixelSize;
canvas.height = height * pixelSize;

async function drawGrid() {
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

    // Busca pixels salvos no servidor
    try {
        const response = await fetch('/pixels');
        const pixels = await response.json();

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
    console.log(email,password)
    console.log("window.login:", window.login);
    if (window.login) {
        console.log("entrou no if")
        uid = await window.login(email, password);
    }
});

canvas.addEventListener("click", async (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);
    const color = colorPicker.value;
    console.log(x,y,color,uid);
    try {
        const response = await fetch('/click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ x, y, color, uid}),
        });

        const data = await response.json();
        if (data.success) {
            ctx.fillStyle = color;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Houve um erro ao registrar o clique.');
    }
});

drawGrid();