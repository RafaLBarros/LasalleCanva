// server.js - Servidor Node.js para gerenciar os cliques no Pixel Canvas

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require("./firebase-key.json"); // Adicione seu arquivo de credenciais do Firebase

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();
const server = http.createServer(app);
const io = new Server(server); // <- socket.io server

const usersCollection = db.collection("admins"); // Tabela de usuários admins
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CLICK_TIMEOUT = 10000; // 10 segundos de cooldown por IP

// Função para verificar se um usuário é admin
async function isAdmin(uid) {
    const userDoc = await usersCollection.doc(uid).get();
    return userDoc.exists && userDoc.data().isAdmin === true;

}

app.post("/click", async (req, res) => {
    const { x, y, color, uid} = req.body;
    const ip = req.ip;

    if (!(x+1) || !(y+1) || !color) {
        return res.status(400).json({ error: "Dados inválidos" });
    }
    const ipRef = db.collection("clicks").doc(ip);
    const ipDoc = await ipRef.get();
    const now = Date.now();

    if(uid){
        const adminStatus = await isAdmin(uid); // Verifica se o usuário é admin
        if (!adminStatus && ipDoc.exists && now - ipDoc.data().lastClick < CLICK_TIMEOUT) {
            return res.status(429).json({ error: "Aguarde antes de clicar novamente." });
        }
    }else{
        if (ipDoc.exists && now - ipDoc.data().lastClick < CLICK_TIMEOUT) {
            return res.status(429).json({ error: "Aguarde antes de clicar novamente." });
        }
    }

    await ipRef.set({ lastClick: now });

    const clickRef = db.collection("pixels").doc(`${x}-${y}`);
    await clickRef.set({ x, y, color, timestamp: now });


    // 🔥 Envia atualização para todos os clientes
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

io.on("connection", (socket) => {
    console.log("Novo cliente conectado:", socket.id);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));