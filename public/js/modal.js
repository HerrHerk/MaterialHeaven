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




/* ==========================================
==========================================
==========================================
   MODAL.JS
   ==========================================
   ==========================================
========================================== */

// Function to preload all modals and store them in the DOM
function preloadModals() {
    const modalsToLoad = ['modal-cart', 'modal-profile', 'modal-subscription', 'modal-signup-login'];
    const modalContainer = document.getElementById('modal-container');



    // Load the base modal structure
    fetch('/modal/modal-base.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load base modal structure');
            }
            return response.text();
        })
        .then(baseData => {
            /* console.log('Base modal structure loaded'); */

            // Create a wrapper for all modals using the base modal structure
            modalContainer.innerHTML = baseData;

            const modalInnerContent = document.getElementById('modal-inner-content');

            // Preload and insert content for each modal type
            modalsToLoad.forEach(modalType => {
                fetch(`/modal/${modalType}.html`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load modal content: ${modalType}`);
                        }
                        return response.text();
                    })
                    .then(contentData => {
                        /* console.log(`Modal content for ${modalType} loaded`); */

                        // Create a hidden div for each modal
                        const modalDiv = document.createElement('div');
                        modalDiv.id = modalType;
                        modalDiv.classList.add('hidden-modal'); // Custom class for hidden modals
                        modalDiv.innerHTML = contentData;

                        // Append the hidden modal to the base modal container
                        modalInnerContent.appendChild(modalDiv);

 

                        // After the modal content is appended, add event listeners
                        if (modalType === 'modal-profile') {
                            const logoutBtn = modalDiv.querySelector("#logout-btn" );
                            const resetPasswordBtn = modalDiv.querySelector('#reset-password-link');
                            const resetPasswordMessage = modalDiv.querySelector('#reset-error-message');
                            
                            if (logoutBtn) {
                                logoutBtn.addEventListener("click", logoutBtnPressed);
                            }

                            if (resetPasswordBtn) {
                                resetPasswordBtn.addEventListener("click", (e) => {
                                    e.preventDefault();
                                    const user = auth.currentUser;
                                
                                    
                                    
                                    
                                    // Ensure the element exists
                                    if (!resetPasswordMessage) {
                                        console.error('Reset error message element not found!');
                                        return; // Exit if the element is not found
                                    }
                                
                                    const userEmail = user.email;
                                
                                    // Remove any previous messages or styles
                                    resetPasswordMessage.innerHTML = '';
                                    resetPasswordMessage.style.color = ''; // Reset color to default
                                    resetPasswordMessage.style.display = 'block'; // Ensure it is visible
                                
                                    // Show loading or message that the email is being sent
                                    resetPasswordMessage.innerHTML = `Sending reset password link to ${userEmail}...`;
                                
                                    // Attempt to send the password reset email
                                    sendPasswordResetEmail(auth, userEmail)
                                        .then(() => {
                                            // Success: inform the user that the reset email was sent
                                            resetPasswordMessage.innerHTML = `We've sent a link to reset your password to ${userEmail}. Please check your inbox.`;
                                            resetPasswordMessage.style.color = '#438416'; // Green color for success
                                        })
                                        .catch((error) => {
                                            // Handle error (e.g., invalid email, network error)
                                            resetPasswordMessage.innerHTML = "There was an error. Please provide a valid email.";
                                            resetPasswordMessage.style.color = '#841643'; // Red color for error
                                            console.error("Password reset error: ", error);
                                        });
                                });
                            }

                        } else if (modalType === 'modal-signup-login') {
                            // Get references to the new form elements
                            const loginBtn = modalDiv.querySelector("#login-btn");
                            const loginEmail = modalDiv.querySelector("#login-email");
                            const loginPassword = modalDiv.querySelector("#login-password");
                            const loginErrorMessage = modalDiv.querySelector("#login-error-message");
                        
                            // Get references to the new sign-up form elements
                            const signUpBtn = modalDiv.querySelector("#signup-btn");
                            const signupName = modalDiv.querySelector("#signup-name");
                            const signupEmail = modalDiv.querySelector("#signup-email");
                            const signupPassword = modalDiv.querySelector("#signup-password");
                            const signupErrorMessage = modalDiv.querySelector("#signup-error-message");

                            const resendVerificationBtn = modalDiv.querySelector("#resend-verification-btn");

                            const logoutBtn = modalDiv.querySelector("#logout-btn" );
                            

                            const forgotPasswordBtn = document.querySelector("#forgot-password-btn");
                            const resetPasswordForm = document.querySelector("#reset-password-form");
                            const loginForm = document.querySelector("#login-form");
                            const verifyForm = document.querySelector('#verify-form');
                            const resetPasswordMessage = document.querySelector("#reset-error-message-2");
                            const sendResetEmailBtn = document.querySelector("#send-reset-email-btn");
                            
                            const googleLoginBtn = modalDiv.querySelector("#login-with-google-btn");

                            if (forgotPasswordBtn) {
                                forgotPasswordBtn.addEventListener("click", (e) => {
                                    e.preventDefault();
                                    // Hide login form and show reset password form
                                    loginForm.style.display = "none";
                                    resetPasswordForm.style.display = "block";
                                });
                            }

                            // Add event listener for "Send Reset Email" button
                            if (sendResetEmailBtn) {
                                sendResetEmailBtn.addEventListener("click", async (e) => {
                                    e.preventDefault();

                                    console.log("Send Reset Email Button pressed")

                                    const emailInput = document.querySelector("#reset-password-email");
                                    const email = emailInput.value.trim();

                                    // Clear previous messages
                                    resetPasswordMessage.innerHTML = "";
                                    resetPasswordMessage.style.color = ""; // Reset color to default

                                    // Validate email input
                                    if (!email) {
                                        resetPasswordMessage.innerHTML = "Please enter an email address.";
                                        resetPasswordMessage.style.color = "#841643"; // Error color
                                        return;
                                    }

                                    // Attempt to send the password reset email
                                    try {
                                        await sendPasswordResetEmail(auth, email);
                                        resetPasswordMessage.innerHTML = `We've sent a reset password link to ${email}. Please check your inbox.`;
                                        resetPasswordMessage.style.color = "#438416"; // Success color
                                    } catch (error) {
                                        console.error("Password reset error: ", error);
                                        resetPasswordMessage.innerHTML = "There was an error. Please ensure the email is valid.";
                                        resetPasswordMessage.style.color = "#841643"; // Error color
                                    }
                                });
                            }

                            // Add event listener for "Back to Login" link
                            const backToLoginBtn = document.querySelector("#back-to-login-btn");
                            if (backToLoginBtn) {
                                backToLoginBtn.addEventListener("click", (e) => {
                                    e.preventDefault();
                                    // Hide reset password form and show login form
                                    resetPasswordForm.style.display = "none";
                                    loginForm.style.display = "block";
                                });
                            }

                            if (logoutBtn) {
                                logoutBtn.addEventListener("click", (e) => {
                                    e.preventDefault(); // Prevent default behavior
                                    
                                    logoutBtnPressed(); // ✅ Call the function properly
                                    
                                    console.log("logging out");
                                    verifyForm.style.display = "none";
                                    loginForm.style.display = "block";
                                });
                            }
                            

                            if (resendVerificationBtn) {
                                resendVerificationBtn.addEventListener("click", (e) => {
                                    // Prevent default form submission behavior
                                    e.preventDefault();
                                    resendVerificationBtnPressed(e);
                                });
                            } 
                            
                            if (loginBtn) {
                                loginBtn.addEventListener("click", (e) => {
                                    
                                    console.log("Login Button Pressed");
                                    e.preventDefault();
                                    
                                
                                    // Clear any previous error messages
                                    loginErrorMessage.classList.add('hidden');
                                    loginErrorMessage.innerHTML = '';
                                
                                    // Ensure email and password fields are populated
                                    const email = loginEmail.value;
                                    const password = loginPassword.value;
                                
                                    if (email && password) {
                                        // Sign in with email and password
                                        signInWithEmailAndPassword(auth, email, password)
                                            .then(() => {
                                                // If login is successful, reload the page or redirect to the user dashboard
                                                console.log('Login successful!');
                                                window.location.reload();
                                            })
                                            .catch((error) => {
                                                // Handle login errors
                                                console.error('Login error: ', error);
                                                // Display user-friendly error message
                                                loginErrorMessage.innerHTML = formatErrorMessage(error.code, "login");
                                                loginErrorMessage.classList.remove('hidden');
                                            });
                                    } else {
                                        // Display an error if email or password is missing
                                        loginErrorMessage.innerHTML = 'Please fill out both email and password fields.';
                                        loginErrorMessage.classList.remove('hidden');
                                    }

                                });
                            }

                            if (googleLoginBtn) {
                                googleLoginBtn.addEventListener("click", loginWithGoogleBtnPressed);
                            }

                            if (signUpBtn) {
                                signUpBtn.addEventListener("click", (e) => {
                                    console.log("sign up button pressed");
                                    // Prevent the default form submission
                                    e.preventDefault();
                        
                                    // Clear any previous error messages
                                    signupErrorMessage.classList.add('hidden');
                                    signupErrorMessage.innerHTML = '';
                        
                                    // Ensure all fields are filled
                                    const name = signupName.value;
                                    const email = signupEmail.value;
                                    const password = signupPassword.value;
                        
                                    // Check for empty fields
                                    if (!name || !email || !password) {
                                        signupErrorMessage.innerHTML = 'Please fill out all fields.';
                                        signupErrorMessage.classList.remove('hidden');
                                        return;
                                    }
                        
                                    // Step 1: Create the user with Firebase Auth
                                    createUserWithEmailAndPassword(auth, email, password)
                                        .then(async (userCredential) => {
                                            // Step 2: Send email verification
                                            await sendEmailVerification(userCredential.user);
                        
                                            // Step 3: Create user profile in Firestore
                                            const docRef = doc(db, "users", userCredential.user.uid);
                                            await setDoc(docRef, {
                                                realname: name,  // Store the real name
                                                email: email,    // Store the email
                                                favourites: {},  // Initialize favourites map (empty by default)
                                            });
                        
                                            console.log('User profile created:', userCredential);
                        
                                            // Redirect or handle post-signup logic
                                            // Optionally, show a message or close the modal
                                            signupErrorMessage.innerHTML = 'Please check your email for verification.';
                                            signupErrorMessage.classList.remove('hidden');
                                            
                                            // Reload or navigate after successful sign-up
                                            window.location.reload();
                                        })
                                        .catch((error) => {
                                            // Handle errors from Firebase (e.g., email already in use, weak password)
                                            console.error('Sign-up error: ', error);
                                            signupErrorMessage.innerHTML = formatErrorMessage(error.code, "signup");
                                            signupErrorMessage.classList.remove('hidden');
                                        });
                                });
                            }
                        }
                    });
            });
        })
        .catch(error => {
            console.error('Error preloading modals:', error);
        });


}

// CSS to hide modals by default
const style = document.createElement('style');
style.textContent = `
    .hidden-modal { display: none; }
    .modal-visible { display: block; }
`;
document.head.appendChild(style);

// Call preloadModals on page load
document.addEventListener('DOMContentLoaded', preloadModals);



// Function to show a preloaded modal
function loadModal(modalType) {
    /* console.log(`Displaying modal: ${modalType}`); */

    // Hide all modals first
    const modals = document.querySelectorAll('.hidden-modal');
    modals.forEach(modal => modal.classList.remove('modal-visible'));

    // Show the selected modal
    const targetModal = document.getElementById(modalType);
    if (targetModal) {
        targetModal.classList.add('modal-visible');
        document.getElementById('modal-container').style.display = 'flex'; // Show modal overlay
        document.body.classList.add('no-scroll');

        // Apply specific widths for certain modals
        const modalWrapper = document.querySelector('.modal-content-wrapper');
        modalWrapper.classList.remove('narrow-width', 'medium-width'); // Reset width classes

        const narrowModals = ['modal-profile', 'modal-signup-login'];
        if (narrowModals.includes(modalType)) {
            modalWrapper.classList.add('narrow-width');
        }

        const mediumModals = ['modal-subscription'];
        if (mediumModals.includes(modalType)) {
            modalWrapper.classList.add('medium-width');
        }

        // Attach event listeners for the modal after it becomes visible
        attachModalEventListeners(modalType);
    } else {
        console.error(`Modal with ID ${modalType} not found`);
    }
}

// Make loadModal accessible in material-library.js
window.loadModal = loadModal;



// Wait until the DOM is fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function () {
    /* console.log("Event listeners for modal buttons are set up"); */

    // Use event delegation for the modal open buttons
    const openCart = document.querySelector('.open-cart');
    const openProfile = document.querySelector('.open-profile');
    const openSubscription = document.querySelector('.open-subscription');

    // Handle shopping cart modal
    if (openCart) {
        openCart.addEventListener('click', function(event) {
            event.preventDefault();  // Prevent the default link behavior (navigation)
            console.log('Cart modal clicked');  // Log to confirm it's working
            if (checkIfUserIsLoggedIn()) {
                if (checkIfUserIsVerifierd()){
                    loadModal('modal-cart'); // Show preloaded subscription modal if the user is logged in
                } else {
                    loadModal('modal-signup-login'); // Show login modal if the user is not logged in
                }
            } else {
                loadModal('modal-signup-login'); // Show login modal if the user is not logged in
            }
        });
    }

    // Handle profile modal
    if (openProfile) {
        openProfile.addEventListener('click', function(event) {
            event.preventDefault();  // Prevent the default link behavior (navigation)
            console.log('Profile modal clicked');  // Log to confirm it's working
            if (checkIfUserIsLoggedIn()) {
                if (checkIfUserIsVerifierd()){
                    loadModal('modal-profile'); // Show preloaded subscription modal if the user is logged in
                } else {
                    loadModal('modal-signup-login'); // Show login modal if the user is not logged in
                }
            } else {
                loadModal('modal-signup-login'); // Show login modal if the user is not logged in
            }
        });
    }

    // Handle subscription modal
    if (openSubscription) {
        openSubscription.addEventListener('click', function(event) {
            event.preventDefault();  // Prevent the default link behavior (navigation)
            console.log('Subscription modal clicked');  // Log to confirm it's working
            if (checkIfUserIsLoggedIn()) {
                if (checkIfUserIsVerifierd()){
                    loadModal('modal-subscription'); // Show preloaded subscription modal if the user is logged in
                } else {
                    loadModal('modal-signup-login'); // Show login modal if the user is not logged in
                }
            } else {
                loadModal('modal-signup-login'); // Show login modal if the user is not logged in
            }
        });
    }
});

// Close modal function for account-related modals
function closeAccountModal() {
    const accountModalContainer = document.getElementById('modal-container');
    if (accountModalContainer) {
        accountModalContainer.style.display = 'none'; // Close modal
        document.body.classList.remove('no-scroll'); // Remove no-scroll when modal closes
        const modalWrapper = document.querySelector('.modal-content-wrapper');
        if (modalWrapper) {
            modalWrapper.classList.remove('narrow-width', 'medium-width');
        }
    }
}

// Close material modal function
function closeMaterialModal() {
    const materialModalContainer = document.getElementById('modal-container-material');
    if (materialModalContainer) {
        materialModalContainer.style.display = 'none'; // Hide the modal container

        document.body.classList.remove('no-scroll'); // Remove no-scroll when modal closes

        // Hide all visible modals and make them hidden
        document.querySelectorAll('.visible-modal').forEach((modal) => {
            modal.classList.remove('visible-modal');
            modal.classList.add('hidden-modal');
        });

        // Navigate back to the base path when closing the modal
        window.history.replaceState({}, 'Material Library', '/material-library/');
    }
}






// General modal close function to handle both
function closeModal() {
    closeAccountModal();
    closeMaterialModal();
}


// Event delegation for close buttons
document.body.addEventListener('click', function (event) {
    // Check if the clicked element is a button that should trigger a modal close
    if (event.target && event.target.classList.contains('close-button')) {
        closeModal();
    }
});


let isMouseDownOutside = false;

// Detect if mousedown event started outside the modal content
document.addEventListener('mousedown', function (e) {
    const accountModalContent = document.querySelector('.modal-content'); // Old modal content
    const materialModalContent = document.querySelector('.modal-content-material'); // New modal content

    /* console.log("Mousedown target:", e.target); */

    // Check if the mousedown occurred outside both modal contents
    const isOutsideAccountModal = accountModalContent && !accountModalContent.contains(e.target);
    const isOutsideMaterialModal = materialModalContent && !materialModalContent.contains(e.target);

    isMouseDownOutside = isOutsideAccountModal && isOutsideMaterialModal;

/*     console.log("Mousedown status - Outside Account Modal:", isOutsideAccountModal);
    console.log("Mousedown status - Outside Material Modal:", isOutsideMaterialModal);
    console.log("IsMouseDownOutside:", isMouseDownOutside); */
});

// Detect if mouseup event ended outside the modal content
document.addEventListener('mouseup', function (e) {
    const accountModalContent = document.querySelector('.modal-content'); // Old modal content
    const materialModalContent = document.querySelector('.modal-content-material'); // New modal content

    /* console.log("Mouseup target:", e.target); */

    // Check if the mouseup occurred outside both modal contents
    const isOutsideAccountModal = accountModalContent && !accountModalContent.contains(e.target);
    const isOutsideMaterialModal = materialModalContent && !materialModalContent.contains(e.target);

/*     console.log("Mouseup status - Outside Account Modal:", isOutsideAccountModal);
    console.log("Mouseup status - Outside Material Modal:", isOutsideMaterialModal); */

    // If both mousedown and mouseup occurred outside both modals, close
    if (isMouseDownOutside && isOutsideAccountModal && isOutsideMaterialModal) {
        console.log("Closing modal...");
        closeModal();
    }

    // Reset the flag
    isMouseDownOutside = false;
});






// Call this function after loading modal-cart.html into the DOM
function initializeCheckboxListeners() {
    console.log("Checkbox function is available");

    const termsCheckbox = document.getElementById('termsCheckbox');
    const refundCheckbox = document.getElementById('refundCheckbox');
    const checkoutButton = document.querySelector('.checkout-button[data-type="cart"]'); // Use class selector
  
    // Only proceed if the checkboxes exist
    if (termsCheckbox && refundCheckbox && checkoutButton) {
        // Function to enable/disable the checkout button
        function updateCheckoutButton() {
            /* console.log("Something got checked"); */
            console.log(`Terms checkbox is ${termsCheckbox.checked ? 'checked' : 'unchecked'}`);
            console.log(`Refund checkbox is ${refundCheckbox.checked ? 'checked' : 'unchecked'}`);
        
            // Ensure the checkoutButton exists before trying to access it
            if (checkoutButton) {
                checkoutButton.disabled = !(termsCheckbox.checked && refundCheckbox.checked);
                console.log(`Checkout button is now ${checkoutButton.disabled ? 'disabled' : 'enabled'}`);
            } else {
                console.log("Checkout button not found");
            }
        }

        // Listen for changes on both checkboxes
        termsCheckbox.addEventListener('change', updateCheckoutButton);
        refundCheckbox.addEventListener('change', updateCheckoutButton);
    } else {
        console.log("Checkboxes or Checkout button not found in the DOM");
    }
}

// Call this function after loading modal-cart.html into the DOM
function initializeCheckboxListenersSubscription() {
    console.log("Checkbox Subscription function is available");

    const termsCheckboxSub = document.getElementById('termsCheckboxSubscription');
    const refundCheckboxSub = document.getElementById('refundCheckboxSubscription');
    const checkoutButtonSub = document.querySelector('.checkout-button[data-type="subscription"]'); // Use class selector
  
    // Only proceed if the checkboxes exist
    if (termsCheckboxSub && refundCheckboxSub && checkoutButtonSub) {
        // Function to enable/disable the checkout button
        function updateCheckoutButton() {
            
            console.log(`Terms Subscribe checkbox is ${termsCheckboxSub.checked ? 'checked' : 'unchecked'}`);
            console.log(`Refund Subscribe checkbox is ${refundCheckboxSub.checked ? 'checked' : 'unchecked'}`);
        
            // Ensure the checkoutButton exists before trying to access it
            if (checkoutButtonSub) {
                checkoutButtonSub.disabled = !(termsCheckboxSub.checked && refundCheckboxSub.checked);
                console.log(`Checkout button Subscribe is now ${checkoutButtonSub.disabled ? 'disabled' : 'enabled'}`);
            } else {
                console.log("Checkout button Subscribe not found");
            }
        }

        // Listen for changes on both checkboxes
        termsCheckboxSub.addEventListener('change', updateCheckoutButton);
        refundCheckboxSub.addEventListener('change', updateCheckoutButton);
    } else {
        console.log("Checkboxes or Checkout Subscribe button not found in the DOM");
    }
}

// Function to monitor for the checkboxes and checkout button appearing in the DOM
export function monitorCheckboxes(type) {
    let observer;

    console.log("passed type:", type);

    if (type === 'cart') {
        observer = new MutationObserver((mutations) => {
            // Check if both checkboxes and checkout button exist
            if (document.getElementById('termsCheckbox') && document.getElementById('refundCheckbox') && document.querySelector('.checkout-button[data-type="cart"]')) {
                initializeCheckboxListeners(); // Run listener function when checkboxes and button appear
                console.log("A");
                observer.disconnect(); // Stop observing once found
            }
        });
    } else if (type === 'subscription') {
        observer = new MutationObserver((mutations) => {
            // Check if both checkboxes and checkout button exist for the subscription modal
            if (document.getElementById('termsCheckboxSubscription') && document.getElementById('refundCheckboxSubscription') && document.querySelector('.checkout-button[data-type="subscription"]')) {
                initializeCheckboxListenersSubscription(); // Run listener function when checkboxes and button appear
                console.log("B");
                observer.disconnect(); // Stop observing once found
            }
        });
    }

    // Start observing the DOM for changes
    observer.observe(document.body, {
        childList: true, // Look for added or removed child elements
        subtree: true,   // Look through all descendant elements
    });
}


  
function attachModalEventListeners() {
    // Attach event listeners for toggling between login and signup forms
    const needAccountBtn = document.getElementById('need-an-account-btn');
    const haveAccountBtn = document.getElementById('have-an-account-btn');

    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const verifyForm = document.getElementById('verify-form');

    const user = auth.currentUser;

    if (user) {
        if (!user.emailVerified) {
            console.log("Unverified user detected, showing verification form");
            if (loginForm) loginForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'none';
            if (verifyForm) verifyForm.style.display = 'block';
        } else {
            console.log("Verified user, hiding verification form");
            if (loginForm) loginForm.style.display = 'block';
            if (signupForm) signupForm.style.display = 'none';
            if (verifyForm) verifyForm.style.display = 'none';
        }
    }


    if (needAccountBtn) {
        needAccountBtn.addEventListener('click', function () {


            // Hide the login form and show the signup form
            if (loginForm) loginForm.style.display = 'none';
            if (signupForm) signupForm.style.display = 'block';
            if (verifyForm) verifyForm.style.display = 'none';
        });
    }

    if (haveAccountBtn) {
        haveAccountBtn.addEventListener('click', function () {


            // Hide the signup form and show the login form
            if (signupForm) signupForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (verifyForm) verifyForm.style.display = 'none';
        });
    }

    // Password toggle functionality for login and signup forms
    const eyeBtn = document.getElementById('eye-btn');
    const signupEyeBtn = document.getElementById('signup-eye-btn');

    if (eyeBtn) {
        eyeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            togglePasswordVisibility('login-password', 'eye-icon');
        });
    }

    if (signupEyeBtn) {
        signupEyeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            togglePasswordVisibility('signup-password', 'signup-eye-icon');
        });
    }
}


function togglePasswordVisibility(passwordId, iconId) {
    const passwordField = document.getElementById(passwordId);
    const eyeIcon = document.getElementById(iconId);
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.className = 'eye-slash-icon'; // Change icon class
    } else {
        passwordField.type = 'password';
        eyeIcon.className = 'eye-icon'; // Revert icon class
    }
}


/* ==========================================
==========================================
==========================================
   AUTH.JS
   ==========================================
   ==========================================
========================================== */

// Ensure the auth component is registered properly
const auth = getAuth(app);
const db = getFirestore();

/* ==========================================
   referencing DOM objectsL
========================================== */






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
let isUserVerified = false;


// Global variable to hold user data
let currentUser = null;

// Check authentication status
onAuthStateChanged(auth, (user) => {
    if (user) {
        isUserLoggedIn = true;
        currentUser = user; // Save the current user for later use
        console.log("An active user is logged in", user);
        if (user.emailVerified) {
            isUserVerified = true;
            /* console.log("The active user's email is verified", user.emailVerified); */
        } else {
            isUserVerified = false;
            console.log("The active user's email is NOT verified yet", user.emailVerified);
        }

        /* checkVerification(); */

        // Populate the profile modal once the user is confirmed
        populateProfileModal();
    } else {
        isUserLoggedIn = false;
        currentUser = null;
        console.log("No user is logged in.");
    }
});

// Assuming you have the isUserLoggedIn flag set by onAuthStateChanged
function checkIfUserIsLoggedIn() {
    return isUserLoggedIn; // Return the value of the flag that tracks if the user is logged in
}

// Assuming you have the isUserLoggedIn flag set by onAuthStateChanged
function checkIfUserIsVerifierd() {
    return isUserVerified; // Return the value of the flag that tracks if the user is logged in
}

// Function to populate the profile modal
function populateProfileModal() {
    if (!currentUser) {
        console.error("No user is signed in.");
        return;
    }

    // References to profile fields
    const userIdField = document.getElementById("user-id");
    const userNameField = document.getElementById("user-name");
    const userEmailField = document.getElementById("user-email");
    const userPlanField = document.getElementById("user-plan");
    const subscriptionContainer = document.getElementById("subscription-status");

    // Populate fields with Firebase Auth data
    userIdField.textContent = currentUser.uid;
    userEmailField.textContent = currentUser.email;

    // Fetch additional user data from Firestore
    const userDocRef = doc(db, "users", currentUser.uid);
    getDoc(userDocRef)
        .then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                userNameField.textContent = userData.realname || "Not Provided";
                userPlanField.textContent = userData.restricted?.tier || "Free";

                // Get subscription data
                const subscriptions = userData.restricted?.subscriptions || {};

                // Construct subscription details HTML
                let subscriptionHtml = '';

                // Define all subscription categories (material, cad, simulation, complete)
                const subscriptionCategories = [
                    { name: "material", label: "Material" },
                    { name: "cad", label: "CAD" },
                    { name: "simulation", label: "Simulation" },
                    { name: "complete", label: "Complete" }
                ];

                // Loop through subscription categories and check their status
                subscriptionCategories.forEach((category) => {
                    const isActive = subscriptions[category.name] || false;
                    const expirationDate = subscriptions[`${category.name}Expiration`] 
                        ? new Date(subscriptions[`${category.name}Expiration`]) 
                        : null;
                    
                    // Determine subscription status and expiration date
                    let statusText = isActive ? '✔️ Active' : '❌ Inactive';
                    let expirationText = isActive && expirationDate ? ` (Expires: ${expirationDate.toLocaleDateString()})` : '';

                    subscriptionHtml += `
                        <p><strong>${category.label}:</strong> ${statusText}${expirationText}</p>
                    `;
                });

                // If no subscriptions, show a message
                if (!subscriptionHtml) {
                    subscriptionHtml = `<p>No subscriptions data available.</p>`;
                }

                // Update the subscription section
                subscriptionContainer.innerHTML = subscriptionHtml;

            } else {
                console.error("User document does not exist in Firestore.");
            }
        })
        .catch((error) => {
            console.error("Error fetching user data from Firestore:", error);
        });
}


// Utility function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}




// Example logout function (for demonstration)
function logoutBtnPressed() {
    console.log("Logout button pressed");
    // Your logout function
    signOut(auth).then(() => {
        console.log('Logged out!');
        closeModal();
    }).catch(error => {
        console.log('Error during logout: ' + error.message);
    });
}

const resendVerificationBtnPressed = async (e) => {
    e.preventDefault(); // Prevent default behavior of the link

    try {
        const user = auth.currentUser;
        if (user) {
            console.log("Resending verification email to:", user.email);
            await sendEmailVerification(user);
            alert(`Verification email sent to ${user.email}. Please check your inbox.`);
        } else {
            console.log("No user logged in to resend verification email.");
            alert("You need to log in before resending the verification email.");
        }
    } catch (error) {
        console.error("Error sending verification email:", error);
        alert("Failed to resend verification email. Please try again later.");
    }
};


const loginWithGoogleBtnPressed = async (e) => {
    e.preventDefault();

    const googleProvider = new GoogleAuthProvider();
 
    try {
        // Sign in with Google popup
        const userCredential = await signInWithPopup(auth, googleProvider);
        
        // After signing in, check if the user document exists in Firestore
        const docRef = doc(db, "users", userCredential.user.uid);
        const docSnap = await getDoc(docRef);

        // If user document does not exist, create it
        if (!docSnap.exists()) {
            await createUserProfileWithGoogle(userCredential);
        }
        // Reload the page only after the user profile is fully created
        window.location.reload();
    } catch (error) {
        console.log("Google login error: ", error.code);
    }
};

const createUserProfileWithGoogle = async (userCredential) => {
    const docRef = doc(db, "users", userCredential.user.uid);
    await setDoc(docRef, {
        username: userCredential.user.displayName || '', // Use Google display name
        realname: userCredential.user.displayName || '', // Use Google display name
        email: userCredential.user.email,
        favourites: {},  // Initialize empty favourites map
    });
    console.log('User profile created:', userCredential);
};



const modalInnerContent = document.getElementById('modal-inner-content');







