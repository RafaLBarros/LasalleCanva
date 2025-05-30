console.log("Servidor INICIADO");
// server.js - Servidor Node.js para gerenciar os cliques no Pixel Canvas
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require("./firebase-key.json"); // Adicione seu arquivo de credenciais do Firebase

const fs = require("fs");
const snapshotsDir = path.join(__dirname, "snapshots");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const server = http.createServer(app);
const io = new Server(server); // <- socket.io server

const usersCollection = db.collection("admins"); // Tabela de usuários admins
app.use(express.json());

const CLICK_TIMEOUT = 10000; // 10 segundos de cooldown por IP

// Função para verificar se um usuário é admin
async function isAdmin(uid) {
    const userDoc = await usersCollection.doc(uid).get();
    return userDoc.exists && userDoc.data().isAdmin === true;

}

app.post("/click", async (req, res) => {
    const { x, y, color } = req.body;
    const ip = req.ip;
    const authHeader = req.headers.authorization;

    if (!(x + 1) || !(y + 1) || !color) {
        return res.status(400).json({ error: "Dados inválidos" });
    }

    let isAdmin = false;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.split(" ")[1];
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            const userDoc = await db.collection("admins").doc(uid).get();
            isAdmin = userDoc.exists && userDoc.data().isAdmin === true;
        } catch (error) {
            console.error("Token inválido:", error);
            return res.status(401).json({ error: "Token inválido" });
        }
    }

    const ipRef = db.collection("clicks").doc(ip);
    const ipDoc = await ipRef.get();
    const now = Date.now();

    if (!isAdmin) {
        if (ipDoc.exists && now - ipDoc.data().lastClick < CLICK_TIMEOUT) {
            return res.status(429).json({ error: "Aguarde antes de clicar novamente." });
        }
    }

    await ipRef.set({ lastClick: now });

    const clickRef = db.collection("pixels").doc(`${x}-${y}`);
    await clickRef.set({ x, y, color, timestamp: now });

    io.emit("pixelUpdate", { x, y, color });

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

if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir);
}
app.post("/saveSnapshot", async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: "Imagem não fornecida" });

        const filename = `snapshot-${Date.now()}.png`;
        const filePath = path.join(snapshotsDir, filename);

        // Salva a imagem base64 no arquivo
        fs.writeFile(filePath, image, "base64", (err) => {
            if (err) {
                console.error("Erro ao salvar snapshot:", err);
                return res.status(500).json({ error: "Erro ao salvar snapshot" });
            }
            res.json({ success: true });
        });
    } catch (error) {
        console.error("Erro na rota saveSnapshot:", error);
        res.status(500).json({ error: "Erro interno do servidor" });
    }
});

app.use(express.static(path.join(__dirname, 'public')));

io.on("connection", (socket) => {
    console.log("Novo cliente conectado:", socket.id);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0",() => console.log(`Servidor rodando na porta ${PORT}`));