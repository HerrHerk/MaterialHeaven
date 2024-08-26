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
const updateName = document.getElementById("update-realname");
const updateUserName = document.getElementById("update-username");
const updateEmail = document.getElementById("update-email");
const updateBtn = document.getElementById("update-btn");



const signUpLogInBtn = document.getElementById("sign-up-log-in-btn");
const profileDataBtn = document.getElementById("sidebar-profile-div");
const profileLogOutBtn = document.getElementById("profile-logout-btn");
const authLinksLogIn = document.getElementById("auth-links-login");
const authLinksLogOut = document.getElementById("auth-links-logout");

const sidebarAbout = document.getElementById("sidebar-about-div");
const sidebarResetPassword = document.getElementById("sidebar-reset-password-div");
const sidebarContact = document.getElementById("sidebar-contact-div");
const sidebarName = document.getElementById("sidebar-name-div");
const sidebarEmail = document.getElementById("sidebar-email-div");
const sidebarLogin = document.getElementById("sidebar-login-div");
const sidebarLogout = document.getElementById("sidebar-logout-div");
const aboutForm = document.getElementById("about-form");

//const eyeIcon = document.getElementById("eye-btn");

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







onAuthStateChanged(auth, async (user) => {

    console.log(user);
    if (user) {

        authLinksLogIn.style.display = "none";
        sidebarLogin.style.display = "none";
        authLinksLogOut.style.display = "flex"; // Show logout options
        sidebarLogout.style.display = "flex";
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
            sidebarLogin.style.display = "none";
            authLinksLogOut.style.display = "flex"; // Show logout options
            sidebarLogout.style.display = "flex";
            signUpFormView.style.display = "none";

            
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);
                console.log(docSnap.data());

                updateName.value = docSnap.data().realname;
                updateUserName.value = docSnap.data().username;
                updateEmail.value = docSnap.data().email;
                

            } catch (error){
                console.log(error.code);
            }


        }



    } else {

        loginForm.style.display = "none";
        userProfileView.style.display = "none";
        authLinksLogIn.style.display = "flex";  // Show login options
        sidebarLogin.style.display = "flex";
        authLinksLogOut.style.display = "none";
        sidebarLogout.style.display = "none";
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
            aboutForm.style.display = "none";
            loginForm.style.display = "none";
            userProfileView.style.display = "none";
        }         
    } else {
        mainView.style.display = "none";
        loginForm.style.display = "none";
        userProfileView.style.display = "none";
        aboutForm.style.display = "none";
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
    sidebarLogin.style.display = "flex";
    authLinksLogOut.style.display = "none";
    sidebarLogout.style.display = "none";
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

const updateBtnPressed = async (e) => {
    e.preventDefault();

    const docRef = doc(db, "users", auth.currentUser.uid);

    try {
        await setDoc(docRef, {
            realname: updateName.value,
            username: updateUserName.value,
            email: updateEmail.value,
        });
    } catch (error) {
        console.log(error.ccode);
    }



};


const sidebarResetPasswordPressed = () => {
    
    mainView.style.display = "flex";
    resetPasswordForm.style.display = "block";
};

const sidebarAboutPressed = () => {
    
    mainView.style.display = "flex";
    aboutForm.style.display = "block";
};



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
//updateBtn.addEventListener("click", updateBtnPressed);


sidebarAbout.addEventListener("click", sidebarAboutPressed);
// sidebarContact.addEventListener("click", sidebarContactPressed);
sidebarLogin.addEventListener("click", signUpLogInBtnPressed);
sidebarLogout.addEventListener("click", logOutBtnPressed);
sidebarResetPassword.addEventListener("click", sidebarResetPasswordPressed);

// HIDE AND REVEAL PASSWORD
/* const eyeIconPressed = () => {

    console.log("eyew Icon pressed");

    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.remove('eye');
        eyeIcon.classList.add('eye', 'slash');
        console.log("PW -> TEXT");
    } else {
        passwordField.type = 'password';
        eyeIcon.classList.remove('eye', 'slash');
        eyeIcon.classList.add('eye');
        console.log("TEXT -> PW");
    }
} */



//------------------------------------------------------------
// SHOW/HIDE PASSWORD
//------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    const passwordFieldLogin = document.getElementById('login-password');
    const eyeIconLogin = document.getElementById('eye-icon');
    const eyeBtnLogin = document.getElementById('eye-btn');

    const passwordFieldSignup = document.getElementById('password');
    const eyeIconSignup = document.getElementById('signup-eye-icon');
    const eyeBtnSignup = document.getElementById('signup-eye-btn');

    // Function to toggle password visibility
    function togglePasswordVisibility(event, eyeIcon, passwordField) {
        event.preventDefault(); // Prevent default button behavior

        console.log("Eye Icon pressed");

        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            eyeIcon.classList.remove('eye-hidden');
            eyeIcon.classList.add('eye-visible');
            eyeIcon.classList.remove('eye');
            eyeIcon.classList.add('eye', 'slash');
            console.log("Password field set to text");
        } else {
            passwordField.type = 'password';
            eyeIcon.classList.remove('eye-visible');
            eyeIcon.classList.add('eye-hidden');
            eyeIcon.classList.remove('eye', 'slash');
            eyeIcon.classList.add('eye');
            console.log("Password field set to password");
        }
    }

    // Attach event listeners to the buttons
    eyeBtnLogin.addEventListener('click', function(event) {
        togglePasswordVisibility(event, eyeIconLogin, passwordFieldLogin);
    });

    eyeBtnSignup.addEventListener('click', function(event) {
        togglePasswordVisibility(event, eyeIconSignup, passwordFieldSignup);
    });
});
    
//------------------------------------------------------------
// SIDEBAR
//------------------------------------------------------------


document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('closebtn');
    const menuBtn = document.getElementById('menu-btn');

    // Function to open sidebar
    function openNav() {
        sidebar.classList.add('open');
        sidebar.classList.remove('close');
    }

    // Function to close sidebar
    function closeNav() {
        sidebar.classList.add('close');
        sidebar.classList.remove('open');
    }

    // Event listeners
    menuBtn.addEventListener('click', openNav);
    closeBtn.addEventListener('click', closeNav);

    // Optional: Close sidebar if clicked outside
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
            closeNav();
        }
    });
});     
    
    



