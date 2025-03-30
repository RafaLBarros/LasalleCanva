// Importando Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Configuração do Firebase (substitua com os dados do seu projeto)
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

// Função para login de administradores
window.login = async function login(email, senha) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        console.log("Login bem-sucedido:", userCredential.user);
        return userCredential.user.uid;
    } catch (error) {
        console.error("Erro no login:", error.message);
    }
}

// Verifica se o usuário logado é admin
async function checkAdmin(user) {
    if (!user) return false;

    const docRef = doc(db, "admins", user.uid);
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists(); // Se o documento existe, é admin
}

// Monitorar estado de login
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const isAdmin = await checkAdmin(user);
        if (isAdmin) {
            window.isAdmin = true; // Tornando acessível globalmente
        } else {
            window.isAdmin = false;
        }
    } else {
        console.log("Usuário não autenticado.");
        window.isAdmin = false;
    }
});

// Exportando para outros módulos, se necessário
export { auth };