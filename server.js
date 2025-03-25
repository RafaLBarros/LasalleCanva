// server.js - Servidor Node.js para gerenciar os cliques no Pixel Canvas

const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const serviceAccount = require("./firebase-key.json"); // Adicione seu arquivo de credenciais do Firebase

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const CLICK_TIMEOUT = 30000; // 30 segundos de cooldown por IP

app.post("/click", async (req, res) => {
    const { x, y, color } = req.body;
    const ip = req.ip;

    if (!(x+1) || !(y+1) || !color) {
        return res.status(400).json({ error: "Dados inválidos" });
    }

    const ipRef = db.collection("clicks").doc(ip);
    const ipDoc = await ipRef.get();
    const now = Date.now();

    if (ipDoc.exists && now - ipDoc.data().lastClick < CLICK_TIMEOUT) {
        return res.status(429).json({ error: "Aguarde antes de clicar novamente." });
    }

    await ipRef.set({ lastClick: now });

    const clickRef = db.collection("pixels").doc(`${x}-${y}`);
    await clickRef.set({ x, y, color, timestamp: now });

    res.json({ success: true });
});

app.get('/pixels', async (req, res) => {
    try {
        const snapshot = await db.collection('pixels').get();
        const pixels = [];

        snapshot.forEach(doc => {
            pixels.push(doc.data());
        });

        res.json(pixels);
    } catch (error) {
        console.error("Erro ao buscar pixels:", error);
        res.status(500).json({ error: "Erro ao buscar pixels" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));