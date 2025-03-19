/* ==========================================
   AUTH.JS
========================================== */


import app from './firebase-sdk.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    onAuthStateChanged, 
    signOut,
    signInWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import { 
    getFirestore,
    doc,
    setDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"

// Ensure the auth component is registered properly
const auth = getAuth(app);
const db = getFirestore();

/* ==========================================
   referencing DOM objectsL
========================================== */

// Get references to new form elements
const loginBtn = document.getElementById("login-btn");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginErrorMessage = document.getElementById("login-error-message");


/* ==========================================
   ERROR Handler
========================================== */


const formatErrorMessage = (errorCode, action) => {
    let message = "";

    if(action === "signup") {
        if (
            errorCode === "auth/invalid-email" || 
            errorCode === "auth/missing-email"
        ) {
            message = "Please enter a valid Email";
        } else if (
            errorCode === "auth/missing-password" ||
            errorCode === "auth/weak-password"
        ) {
            message = "Password must be at least 6 characters long";
        } else if (
            errorCode === "auth/email-already-in-use"
        ) {
            message = "Email is already taken";
        } else {
            message = "Unknown Error";
        }
    } else if (action === "login") {
        if (
            errorCode === "auth/invalid-email" || 
            errorCode === "auth/missing-password"
        ) {
            message = "Email or Password is incorrect";
        } else if (
            errorCode === "auth/user-not-found" ||
            errorCode === "auth/invalid-credential"
        ) {
            message= "Our system was unable to verify your email or password";

        } else {
            message = "Unknown Error";
        }
    }


    return message;
};

/* ==========================================
   Authentication and user related
========================================== */

let isUserLoggedIn = false;

// Check authentication status
onAuthStateChanged(auth, (user) => {
    if (user) {
        isUserLoggedIn = true;
        console.log ("there is an active user is logged in", user);
    } else {
        isUserLoggedIn = false;
        console.log("there is currently no user logged in");
    }
});





// Attach event listener to the login button
loginBtn.addEventListener("click", loginBtnPressed);

const loginBtnPressed = async (e) => {
    e.preventDefault(); // Prevent the default form submission

    // Clear any previous error messages
    loginErrorMessage.classList.add('hidden');
    loginErrorMessage.innerHTML = '';

    try {
        // Sign in with email and password
        await signInWithEmailAndPassword(
            auth,
            loginEmail.value,
            loginPassword.value
        );

        // Optional: Log a success message (for debugging)
        console.log("Login successful!");

        // Reload the page only after successful login
        window.location.reload();
    } catch (error) {
        // Log the error (for debugging)
        console.error(error);

        // Display a user-friendly error message
        loginErrorMessage.innerHTML = formatErrorMessage(error.code, "login");
        loginErrorMessage.classList.remove('hidden');
    }
};

