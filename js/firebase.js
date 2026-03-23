/**
 * DocuScript AI - Firebase Service
 * Handles Authentication and User Profile Storage
 */

// TODO: Replace with your actual Firebase config from the Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCsSh1XFkx2veRYUNJMJ2Gw_F6_J9xlsvQ",
    authDomain: "scriptgenerator-43e8f.firebaseapp.com",
    projectId: "scriptgenerator-43e8f",
    storageBucket: "scriptgenerator-43e8f.firebasestorage.app",
    messagingSenderId: "660572133566",
    appId: "1:660572133566:web:777dbe993a93f5c4d426ef",
    measurementId: "G-HP3K00R8QB"
};

// Initialize Firebase (Check if script is loaded first)
let auth, db;

const FirebaseService = {
    async init() {
        if (!window.firebase) {
            console.error("Firebase SDK not loaded. Please ensure Firebase scripts are in index.html");
            return;
        }

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();

        if (firebase.analytics) {
            firebase.analytics();
        }

        console.log("Firebase initialized successfully.");
    },

    /**
     * Sign Up a new user
     * @param {string} email 
     * @param {string} password 
     * @param {object} profileData { fullName, username }
     */
    async signUp(email, password, profileData) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save additional profile data to Firestore
            await db.collection("users").doc(user.uid).set({
                email: email,
                fullName: profileData.fullName,
                username: profileData.username,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, user };
        } catch (error) {
            console.error("Signup error:", error);
            throw error;
        }
    },

    /**
     * Sign In existing user
     * @param {string} email 
     * @param {string} password 
     */
    async signIn(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Fetch profile data from Firestore (optional sync)
            const doc = await db.collection("users").doc(user.uid).get();
            const userData = doc.exists ? doc.data() : { email: user.email };

            return { success: true, user, userData };
        } catch (error) {
            console.error("Signin error:", error);
            throw error;
        }
    },

    /**
     * Sign Out
     */
    async signOut() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error("Signout error:", error);
            throw error;
        }
    }
};

// Export for global use
window.FirebaseService = FirebaseService;
