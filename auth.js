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
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js"

// Ensure the auth component is registered properly
const auth = getAuth(app);
const db = getFirestore();

const mainView = document.getElementById("ui-section"); //shows everything account related


const emailVerificationView = document.getElementById("email-verification")
const resendEmailBtn = document.getElementById("resend-email-btn");


const resetPasswordForm = document.getElementById("reset-password-form");
const resetPasswordBtn = document.getElementById("reset-password-btn");
const resetPasswordEmail = document.getElementById("reset-password-email");
const resetPasswordMessage = document.getElementById("rp-message");


const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const loginErrorMessage = document.getElementById("login-error-message");
const needAnAccountBtn= document.getElementById("need-an-account-btn");
const forgotPasswordBtn = document.getElementById("forgot-password-btn");
const loginWithGoogleBtn = document.getElementById("login-with-google-btn");


const userName = document.getElementById("username");
const realName = document.getElementById("real-name");
const email = document.getElementById("email");
const password = document.getElementById("password");
const signUpBtn = document.getElementById("signup-btn");
const UIErrorMessage = document.getElementById("error-message");
const signUpFormView = document.getElementById("signup-form");
const haveAnAccountBtn = document.getElementById("have-an-account-btn");


const userProfileView = document.getElementById("user-profile");
const UIuserEmail = document.getElementById("user-email");
const logOutBtn = document.getElementById("logout-btn");


const signUpLogInBtn = document.getElementById("sign-up-log-in-btn");
const profileDataBtn = document.getElementById("profile-data-btn");
const profileLogOutBtn = document.getElementById("profile-logout-btn");
const authLinksLogIn = document.getElementById("auth-links-login");
const authLinksLogOut = document.getElementById("auth-links-logout");

onAuthStateChanged(auth, (user) => {

    console.log(user);
    if (user) {

        authLinksLogIn.style.display = "none";
        authLinksLogOut.style.display = "flex"; // Show logout options
        emailVerificationView.style.display = "none";

        if (!user.emailVerified) {
            loginForm.style.display = "none";
            userProfileView.style.display = "none";
            signUpFormView.style.display = "none";
            emailVerificationView.style.display = "block";

        } else {
            UIuserEmail.innerHTML = user.email;

            loginForm.style.display = "none";
            userProfileView.style.display = "none";
            mainView.style.display = "none";
            authLinksLogIn.style.display = "none";
            authLinksLogOut.style.display = "flex"; // Show logout options
            signUpFormView.style.display = "none";
        }



    } else {

        loginForm.style.display = "none";
        userProfileView.style.display = "none";
        authLinksLogIn.style.display = "flex";  // Show login options
        authLinksLogOut.style.display = "none";
        emailVerificationView.style.display = "none";
        resetPasswordForm.style.display = "none";

    }
    mainView.classList.remove("loading");
});




const hideMainView = (e) => {
    
    if (e instanceof Event) {
        console.log(e.target);
        console.log(e.currenTtarget);
    
        if (e.target === e.currentTarget) {
            mainView.style.display = "none";
            loginForm.style.display = "none";
            userProfileView.style.display = "none";
        }         
    } else {
        mainView.style.display = "none";
        loginForm.style.display = "none";
        userProfileView.style.display = "none";
    }

}




const profileDataBtnPressed = () => {
    const user = auth.currentUser; // Use the 'auth' instance to get the current user

    // Common UI updates regardless of verification status
    mainView.style.display = "flex";
    loginForm.style.display = "none";
    signUpFormView.style.display = "none";
    resetPasswordForm.style.display = "none";

    if (user) {
        if (user.emailVerified) {
            // If the user's email is verified, show the profile view
            userProfileView.style.display = "block";
            emailVerificationView.style.display = "none";
        } else {
            // If the user's email is not verified, show the email verification view
            userProfileView.style.display = "none";
            emailVerificationView.style.display = "block";
        }


    } else {
        console.error("No authenticated user found.");
    }
};

const profileLogOutBtnPressed = () => {
    logOutBtnPressed();
    authLinksLogIn.style.display = "flex";
    authLinksLogOut.style.display = "none";
    mainView.style.display = "none";

}

const signUpBtnPressed = async (e) => {
    e.preventDefault();

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email.value,
            password.value
        );

        await sendEmailVerification(userCredential.user);

        const docRef = doc(db, "users", userCredential.user.uid);
        await setDoc(docRef, {
            username: userName.value,
            realname: realName.value,
            email: email.value,
            tier: "free",
        });
        
        console.log(userCredential);

    } catch (error)  {
        console.log(error);
        UIErrorMessage.innerHTML = formatErrorMessage(error.code, "signup");
        UIErrorMessage.classList.add('visible');
    }
    
};

const logOutBtnPressed = async() => {
    try {
        await signOut(auth);
        email.value = "";
        password.value = "";
        mainView.style.display = "none";
    } catch (error){
        console.log(error);
    };
    
}


const loginBtnPressed = async (e) => {
    e.preventDefault();

    try {
        await signInWithEmailAndPassword(
            auth,
            loginEmail.value,
            loginPassword.value
        );

    } catch(error) {
        console.log(error);
        loginErrorMessage.innerHTML = formatErrorMessage(error.code, "login");
        loginErrorMessage.classList.add('visible');
    }

    
}


const needAnAccountBtnPressed = () => {
    loginForm.style.display = "none";
    signUpFormView.style.display = "block";
}

const haveAnAccountBtnPressed = () => {
    loginForm.style.display = "block";
    signUpFormView.style.display = "none";
}

// Function to show the login form and hide the sign-up form
const signUpLogInBtnPressed = (e) => {
    e.preventDefault(); // Prevent the default anchor link behavior
    mainView.style.display = "flex";
    loginForm.style.display = "block";
    signUpFormView.style.display = "none";
    resetPasswordForm.style.display = "none";
    // authLinksLogIn.style.display = "none";
    // authLinksLogOut.style.display = "flex";

};

const resendEmailBtnPressed = async() => {
    await sendEmailVerification(auth.currentUser);
};

const forgotPasswordBtnPressed = () => {
    loginForm.style.display = "none";
    resetPasswordForm.style.display = "block";
};

const resetPasswordBtnPressed = async(e) => {
    e.preventDefault();
    console.log(resetPasswordEmail.value);

    try {
        await sendPasswordResetEmail(auth, resetPasswordEmail.value);
        resetPasswordMessage.innerHTML = `We've sent a link to reset your password to ${resetPasswordEmail.value}`;
        resetPasswordMessage.classList.add("success");
    } catch (error) {
        console.log(error.code);
        resetPasswordMessage.innerHTML = "Please provide a valid registered email";
        resetPasswordMessage.classList.add("error");
    }
    resetPasswordMessage.classList.remove("hidden");
};


const loginWithGoogleBtnPressed = async (e) => {
    e.preventDefault();

    const googleProvider = new GoogleAuthProvider();
 
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        console.log(error.code);
    }
    

}


signUpBtn.addEventListener("click", signUpBtnPressed);
logOutBtn.addEventListener("click", logOutBtnPressed);
loginBtn.addEventListener("click", loginBtnPressed);
needAnAccountBtn.addEventListener("click", needAnAccountBtnPressed);
haveAnAccountBtn.addEventListener("click", haveAnAccountBtnPressed);
signUpLogInBtn.addEventListener("click", signUpLogInBtnPressed);
mainView.addEventListener("click", hideMainView);
profileDataBtn.addEventListener("click", profileDataBtnPressed);
profileLogOutBtn.addEventListener("click", profileLogOutBtnPressed);
resendEmailBtn.addEventListener("click", resendEmailBtnPressed);
forgotPasswordBtn.addEventListener("click", forgotPasswordBtnPressed);
resetPasswordBtn.addEventListener("click", resetPasswordBtnPressed);
loginWithGoogleBtn.addEventListener("click", loginWithGoogleBtnPressed);

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
