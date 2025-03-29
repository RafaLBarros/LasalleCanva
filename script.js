/* Arquivo: script.js */
const pixelSize = 10;
const width = 180;
const height = 93;
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");

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

canvas.addEventListener("click", async (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / pixelSize);
    const y = Math.floor((event.clientY - rect.top) / pixelSize);
    console.log(x,y)

    const color = colorPicker.value;

    try {
        const response = await fetch('/click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ x, y, color }),
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