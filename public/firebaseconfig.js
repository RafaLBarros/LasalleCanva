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

window.isAdmin = false;

// Função para login de administradores
window.login = async function login(email, senha) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        console.log("Login bem-sucedido:", userCredential.user);
        alert("Login bem-sucedido: ",userCredential.user);
        const isAdmin = await checkAdmin(user);
        window.isAdmin = isAdmin;
    } catch (error) {
        console.error("Erro no login:", error.message);
        alert("Erro no login: ",error.message);
    }
}

// Verifica se o usuário logado é admin
async function checkAdmin(user) {
    if (!user) return false;

    const docRef = doc(db, "admins", user.uid);
    const docSnap = await getDoc(docRef);
    
    return docSnap.exists(); // Se o documento existe, é admin
}

// Exportando para outros módulos, se necessário
export { auth };