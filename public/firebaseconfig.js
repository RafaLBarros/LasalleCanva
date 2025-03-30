// Importando Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Configuração do Firebase (substitua com os dados do seu projeto)
const firebaseConfig = apiString(); //Essa função é de um código chamado apiconfigsecret.js, que retorna os dados assim:
/*
const firebaseConfig = {
    apiKey: "seus dados",
    authDomain: "seus dados",
    databaseURL: "seus dados",
    projectId: "seus dados",
    storageBucket: "seus dados",
    messagingSenderId: "seus dados",
    appId: "seus dados",
    measurementId: "seus dados"
};

function apiString(){
    return firebaseConfig;
}
*/

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